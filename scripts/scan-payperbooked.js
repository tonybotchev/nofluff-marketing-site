const fs = require('fs');
const path = require('path');

const files = [
  'pay-per-booking.html',
  'payperbooked/pricing.html',
  'payperbooked/booking.html',
  'payperbooked/llms.txt',
  'payperbooked/robots.txt',
  'payperbooked/sitemap.xml',
  'api/lead-email.js',
  'middleware.js'
];

const rules = [
  ['em dash', /\u2014/],
  ['GHL', /\bGHL\b/],
  ['HighLevel', /highlevel/i],
  ['GoHighLevel', /gohighlevel/i],
  ['Twilio', /twilio/i],
  ['OpenAI', /openai/i],
  ['Grok', /\bgrok\b/i],
  ['xAI', /\bxai\b/i],
  ['AI receptionist', /ai receptionist/i],
  ['results guarantee', /guarantee/i],
  ['CallShield', /callshield/i],
  ['blocked phone', /945[\s)._-]*370[\s.-]*8656/],
  ['lawn', /lawn/i],
  ['landscaping', /landscap/i],
  ['$999 cap', /\$999|\b999\b/]
];

const hits = [];
for (const file of files) {
  const text = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const lines = text.split(/\n/);
  lines.forEach((line, index) => {
    for (const [name, pattern] of rules) {
      if (pattern.test(line)) hits.push(`${file}:${index + 1} ${name}`);
    }
  });
}

if (hits.length) {
  console.error(hits.join('\n'));
  process.exit(1);
}
console.log(`payperbooked copy scan ok (${files.length} files)`);
