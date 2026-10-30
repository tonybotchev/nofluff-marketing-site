const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const pages = [
  'pay-per-booking.html',
  'payperbooked/pricing.html',
  'payperbooked/booking.html',
  'payperbooked/llms.txt'
];

const placeholder = '[placeholder: no payperbooked.com contact email is in this repo]';

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('payperbooked pages use PayPerBooked and drop NoFluff branding', () => {
  for (const file of pages) {
    const text = read(file);
    assert.equal(text.includes('NoFluff'), false, file);
    assert.equal(text.includes('nofluff'), false, file);
    assert.equal(text.includes('info@nofluffmarketing.io'), false, file);
    assert.equal(text.includes('fonts.googleapis.com'), false, file);
    assert.equal(text.includes('fonts.gstatic.com'), false, file);
    assert.equal(text.includes('nofluff-logo-dark.png'), false, file);
    assert.equal(text.includes('hero.png'), false, file);
    assert.equal(text.includes('\u2014'), false, file);
    assert.match(text, /PayPerBooked/);
    assert.match(text, /\$0/);
    assert.match(text, /\$49/);
    assert.match(text, /\$29/);
    assert.match(text, /\$499/);
  }
  for (const file of ['pay-per-booking.html', 'payperbooked/pricing.html', 'payperbooked/booking.html']) {
    const text = read(file);
    assert.match(text, /HVAC/);
    assert.match(text, /North DFW/);
    assert.equal(text.includes(placeholder), false, file);
    assert.match(text, /og:site_name" content="PayPerBooked"/);
    assert.match(text, /© <span id="year">2026<\/span> PayPerBooked/);
    assert.match(text, /aria-label="PayPerBooked home"/);
    assert.doesNotMatch(text, /<img[^>]+alt="NoFluff/);
    assert.match(text, /application\/ld\+json/);
    const json = text.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    const data = JSON.parse(json[1]);
    const graph = data['@graph'] || [data];
    const org = graph.find((node) => node['@type'] === 'Organization');
    assert.equal(org.name, 'PayPerBooked');
    assert.equal(JSON.stringify(data).includes('nofluff'), false);
  }
});

test('payperbooked pages keep internal links and skip the shared site script', () => {
  const home = read('pay-per-booking.html');
  const pricing = read('payperbooked/pricing.html');
  const booking = read('payperbooked/booking.html');
  assert.match(home, /href="\/pricing"/);
  assert.match(home, /href="\/booking"/);
  assert.match(home, /id="hvac"/);
  assert.match(pricing, /href="\/booking"/);
  assert.match(pricing, /href="\/#hvac"/);
  assert.match(booking, /href="\/pricing"/);
  assert.match(booking, /href="\/#hvac"/);
  for (const text of [home, pricing, booking]) {
    assert.equal(text.includes('/script.js'), false);
    assert.match(text, /\/payperbooked\/base\.css/);
    assert.match(text, /\/payperbooked\/nav\.js/);
    assert.match(text, /\/payperbooked\/og\.png/);
  }
});

test('middleware rewrite does not import the functions package', () => {
  const src = read('middleware.js');
  assert.doesNotMatch(src, /^\s*import\s.+\sfrom\s+['"]@vercel\/functions['"]/m);
  assert.doesNotMatch(src, /require\(['"]@vercel\/functions['"]\)/);
  assert.match(src, /x-middleware-rewrite/);
  assert.match(src, /function payperbookedDestination/);
});

test('cache headers are limited to payperbooked responses', () => {
  const config = JSON.parse(read('vercel.json'));
  assert.ok(Array.isArray(config.headers));
  const blanket = config.headers.find((rule) => rule.source === '/:path*' || rule.source === '/(.*)');
  assert.equal(blanket, undefined);
  const home = config.headers.filter((rule) => rule.source === '/');
  assert.deepEqual(
    home.map((rule) => rule.has[0].value).sort(),
    ['payperbooked.com', 'www.payperbooked.com']
  );
  for (const rule of config.headers) {
    assert.equal(rule.headers[0].key, 'Cache-Control');
    assert.match(rule.headers[0].value, /s-maxage=86400/);
    assert.equal(rule.source.includes('api'), false);
  }
});
