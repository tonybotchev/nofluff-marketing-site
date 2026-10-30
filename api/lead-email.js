const { randomUUID } = require('node:crypto');
const trades = ['HVAC', 'Plumbing', 'Electrical', 'Roofing', 'Garage door', 'Restoration'];
const towns = ['Celina', 'Prosper', 'McKinney', 'Frisco', 'Anna', 'Melissa', 'Little Elm', 'Aubrey', 'Denton'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const referencePattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

// References correlate inquiries; they are NOT durable idempotency keys.
// Never automatically retry sendMail after an ambiguous transport result.
module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  let body = req.body;
  try {
    if (Buffer.byteLength(typeof body === 'string' ? body : JSON.stringify(body || {})) > 8192) {
      return res.status(413).json({ ok: false, error: 'invalid', retryable: true });
    }
    if (typeof body === 'string') body = JSON.parse(body);
  } catch {
    return res.status(400).json({ ok: false, error: 'invalid', retryable: true });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ ok: false, error: 'invalid', retryable: true });
  }
  const reference = referencePattern.test(body.reference || '') ? body.reference : randomUUID();
  const reply = (code, data) => res.status(code).json({ ...data, reference });
  if (body.company_website) return reply(202, { ok: true, status: 'accepted' });
  const field = (key, max) => typeof body[key] === 'string' && body[key].length <= max
    ? body[key].replace(/[\r\n]+/g, ' ').trim() : '';
  const name = field('name', 120), phone = field('phone', 40), email = field('email', 120);
  const trade = field('trade', 40), town = field('town', 80), volume = field('volume', 5);
  if (name.length < 2 || !/^\d{10,15}$/.test(phone.replace(/\D/g, '')) ||
      !emailPattern.test(email) || !trades.includes(trade) || !towns.includes(town) ||
      !/^\d+$/.test(volume) || Number(volume) > 10000) {
    return reply(400, { ok: false, error: 'invalid', retryable: true });
  }
  const tenant = process.env.M365_TENANT_ID, clientId = process.env.M365_CLIENT_ID;
  const secret = process.env.M365_CLIENT_SECRET;
  const from = process.env.LEAD_MAIL_FROM || 'info@nofluffmarketing.io';
  const to = process.env.LEAD_MAIL_TO || 'info@nofluffmarketing.io';
  if (!tenant || !clientId || !secret || !emailPattern.test(from) || !emailPattern.test(to)) {
    return reply(503, { ok: false, error: 'mail_unavailable', retryable: true });
  }
  let token;
  try {
    const auth = await fetch('https://login.microsoftonline.com/' + encodeURIComponent(tenant) + '/oauth2/v2.0/token', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: secret,
        scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' })
    });
    if (!auth.ok) throw new Error('auth');
    token = (await auth.json()).access_token;
    if (typeof token !== 'string' || !token) throw new Error('auth');
  } catch {
    // No mail request has been made; a user-initiated retry is safe.
    return reply(503, { ok: false, error: 'mail_unavailable', retryable: true });
  }
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/users/' + encodeURIComponent(from) + '/sendMail', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json',
        'client-request-id': reference, 'return-client-request-id': 'true' },
      body: JSON.stringify({ message: {
        subject: 'PayPerBooked inquiry [' + reference + ']',
        body: { contentType: 'Text', content: [
          'PayPerBooked inquiry', 'Reference: ' + reference, 'Name: ' + name,
          'Phone: ' + phone, 'Email: ' + email, 'Trade: ' + trade, 'Town: ' + town,
          'Monthly call volume: ' + volume, 'Source: pay-per-booking', 'Page: ' + field('page', 300)
        ].join('\n') },
        toRecipients: [{ emailAddress: { address: to } }],
        replyTo: [{ emailAddress: { address: email, name } }]
      }, saveToSentItems: true })
    });
    // Graph 202 confirms acceptance, NOT inbox receipt.
    if (response.status === 202) return reply(202, { ok: true, status: 'accepted' });
    if ([400, 401, 403, 404, 413, 422, 429].includes(response.status)) {
      return reply(503, { ok: false, error: 'mail_unavailable', retryable: true });
    }
  } catch {
    // Never log credentials, form values, provider bodies or exception details.
  }
  return reply(502, { ok: false, status: 'unknown', error: 'delivery_unknown', retryable: false });
};
