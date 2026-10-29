const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

test('NoFluff hosts redirect the new payperbooked files away', () => {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
  const hosts = config.redirects
    .filter((rule) => rule.source === '/payperbooked/:path*')
    .map((rule) => rule.has[0].value);
  assert.deepEqual(hosts.sort(), ['nofluffmarketing.io', 'www.nofluffmarketing.io']);
  for (const rule of config.redirects.filter((item) => item.source === '/payperbooked/:path*')) {
    assert.equal(rule.destination, 'https://payperbooked.com/:path*');
    assert.equal(rule.permanent, true);
  }
});

function loadDestination() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'middleware.js'), 'utf8');
  const start = src.indexOf('function payperbookedDestination');
  const end = src.indexOf('export const config');
  assert.ok(start >= 0 && end > start);
  return new Function(`${src.slice(start, end)}\nreturn payperbookedDestination;`)();
}

test('payperbooked host gets its own pages and other hosts do not', () => {
  const destination = loadDestination();
  assert.equal(destination('payperbooked.com', '/'), '/pay-per-booking');
  assert.equal(destination('www.payperbooked.com', '/index.html'), '/pay-per-booking');
  assert.equal(destination('payperbooked.com', '/pricing'), '/payperbooked/pricing');
  assert.equal(destination('payperbooked.com', '/pricing.html'), '/payperbooked/pricing');
  assert.equal(destination('payperbooked.com', '/booking'), '/payperbooked/booking');
  assert.equal(destination('www.payperbooked.com:443', '/booking.html'), '/payperbooked/booking');
  assert.equal(destination('payperbooked.com', '/llms.txt'), '/payperbooked/llms.txt');
  assert.equal(destination('PAYPERBOOKED.COM', '/robots.txt'), '/payperbooked/robots.txt');
  assert.equal(destination('payperbooked.com', '/sitemap.xml'), '/payperbooked/sitemap.xml');

  for (const host of ['nofluffmarketing.io', 'www.nofluffmarketing.io', 'preview.vercel.app']) {
    for (const pathname of ['/', '/pricing', '/booking', '/llms.txt', '/robots.txt', '/sitemap.xml']) {
      assert.equal(destination(host, pathname), '', `${host} ${pathname}`);
    }
  }
});
