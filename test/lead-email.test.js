const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/lead-email.js');

const envKeys = ['M365_TENANT_ID', 'M365_CLIENT_ID', 'M365_CLIENT_SECRET', 'LEAD_MAIL_FROM', 'LEAD_MAIL_TO'];

function mockRes() {
  return {
    statusCode: 200,
    body: undefined,
    ended: false,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { this.ended = true; return this; }
  };
}

function validLead() {
  return {
    name: 'Ada Lovelace',
    phone: '(940) 555-0100',
    email: 'ada@example.com',
    trade: 'HVAC',
    town: 'Celina',
    volume: '10',
    source: 'pay-per-booking',
    page: 'https://payperbooked.com/booking'
  };
}

test.beforeEach(() => {
  for (const key of envKeys) delete process.env[key];
  process.env.M365_TENANT_ID = 'tenant';
  process.env.M365_CLIENT_ID = 'client';
  process.env.M365_CLIENT_SECRET = 'secret';
  global.fetch = async () => { throw new Error('fetch should not run'); };
});

test('OPTIONS and wrong methods', async () => {
  const options = mockRes();
  await handler({ method: 'OPTIONS', body: {} }, options);
  assert.equal(options.statusCode, 204);
  assert.equal(options.ended, true);

  const get = mockRes();
  await handler({ method: 'GET', body: {} }, get);
  assert.equal(get.statusCode, 405);
  assert.deepEqual(get.body, { ok: false, error: 'method_not_allowed' });
});

test('missing mail configuration', async () => {
  delete process.env.M365_CLIENT_SECRET;
  const res = mockRes();
  await handler({ method: 'POST', body: validLead() }, res);
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { ok: false, error: 'not_configured' });
});

test('honeypot returns ok without sending mail', async () => {
  let called = false;
  global.fetch = async () => { called = true; return { ok: true, json: async () => ({}) }; };
  const res = mockRes();
  await handler({ method: 'POST', body: { company_website: 'https://spam.example' } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(called, false);
});

test('incomplete inquiries are invalid', async () => {
  const badEmail = mockRes();
  await handler({ method: 'POST', body: { ...validLead(), email: 'not-an-email' } }, badEmail);
  assert.equal(badEmail.statusCode, 400);
  assert.deepEqual(badEmail.body, { ok: false, error: 'invalid' });

  const missingVolume = mockRes();
  const lead = validLead();
  delete lead.volume;
  await handler({ method: 'POST', body: lead }, missingVolume);
  assert.equal(missingVolume.statusCode, 400);
});

test('a complete inquiry sends mail through Microsoft Graph', async () => {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('/oauth2/')) {
      return { ok: true, json: async () => ({ access_token: 'token' }) };
    }
    return { ok: true, json: async () => ({}) };
  };
  const res = mockRes();
  await handler({ method: 'POST', body: JSON.stringify(validLead()) }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /login\.microsoftonline\.com\/tenant\/oauth2\/v2\.0\/token/);
  assert.match(calls[1].url, /graph\.microsoft\.com\/v1\.0\/users\/info%40nofluffmarketing\.io\/sendMail/);
  const mail = JSON.parse(calls[1].options.body);
  assert.equal(mail.message.toRecipients[0].emailAddress.address, 'info@nofluffmarketing.io');
  assert.match(mail.message.body.content, /Ada Lovelace/);
  assert.match(mail.message.body.content, /Celina/);
  assert.doesNotMatch(calls[1].options.headers.Authorization, /secret/);
});
