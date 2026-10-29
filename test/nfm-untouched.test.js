const { execFileSync } = require('child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const files = [
  'index.html',
  'pricing.html',
  'booking.html',
  'reviews.html',
  'leads.html',
  'nurture.html',
  'style.css',
  'script.js',
  'llms.txt',
  'sitemap.xml',
  'robots.txt'
];

test('NoFluff Marketing pages are unchanged from main', () => {
  const out = execFileSync('git', ['diff', '--exit-code', 'origin/main', '--', ...files], { encoding: 'utf8' });
  assert.equal(out, '');
});
