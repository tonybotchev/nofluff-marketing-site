// Payperbooked inquiry mail. Credentials stay in Vercel env and are never written here:
// M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET, LEAD_MAIL_FROM, LEAD_MAIL_TO.

function clean(value, max) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const tenant = process.env.M365_TENANT_ID;
  const clientId = process.env.M365_CLIENT_ID;
  const clientSecret = process.env.M365_CLIENT_SECRET;
  const mailFrom = process.env.LEAD_MAIL_FROM || "info@nofluffmarketing.io";
  const mailTo = process.env.LEAD_MAIL_TO || "info@nofluffmarketing.io";

  if (!tenant || !clientId || !clientSecret) {
    return res.status(500).json({ ok: false, error: "not_configured" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body && typeof body === "object" ? body : {};

  if (String(body.company_website || "").trim()) {
    return res.status(200).json({ ok: true });
  }

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 40);
  const email = clean(body.email, 120);
  const trade = clean(body.trade, 40);
  const town = clean(body.town, 80);
  const volume = clean(body.volume, 40);
  const source = clean(body.source, 80);
  const page = clean(body.page, 300);
  const phoneDigits = phone.replace(/\D/g, "");
  const volumeNumber = /^\d+$/.test(volume) ? Number(volume) : NaN;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (
    name.length < 2 ||
    phoneDigits.length < 10 ||
    phoneDigits.length > 15 ||
    !emailOk ||
    !trade ||
    !town ||
    !Number.isInteger(volumeNumber) ||
    volumeNumber > 10000
  ) {
    return res.status(400).json({ ok: false, error: "invalid" });
  }

  const text = [
    "NoFluff Front Desk inquiry",
    "Name: " + name,
    "Phone: " + phone,
    "Email: " + email,
    "Trade: " + trade,
    "Town: " + town,
    "Monthly call volume: " + volume,
    "Source: " + source,
    "Page: " + page
  ].join("\n");

  const tokenResponse = await fetch(
    "https://login.microsoftonline.com/" + encodeURIComponent(tenant) + "/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials"
      })
    }
  );
  const tokenJson = await tokenResponse.json().catch(function () { return {}; });
  if (!tokenResponse.ok || !tokenJson.access_token) {
    return res.status(502).json({ ok: false, error: "mail_unavailable" });
  }

  const mailResponse = await fetch(
    "https://graph.microsoft.com/v1.0/users/" + encodeURIComponent(mailFrom) + "/sendMail",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + tokenJson.access_token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: {
          subject: "NoFluff Front Desk inquiry from " + name,
          body: { contentType: "Text", content: text },
          toRecipients: [{ emailAddress: { address: mailTo } }],
          replyTo: [{ emailAddress: { address: email, name: name } }]
        },
        saveToSentItems: false
      })
    }
  );
  if (!mailResponse.ok) {
    return res.status(502).json({ ok: false, error: "mail_unavailable" });
  }
  return res.status(200).json({ ok: true });
};
