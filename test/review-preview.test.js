const test = require('node:test');
const assert = require('node:assert/strict');
const {files} = require('../scripts/build-review-preview.cjs');
test('static review artifact excludes all sending code and serves PPB at the root', () => {
  const output = files();
  assert.match(output['index.html'], /Calls answered/);
  assert.equal(output['index.html'], output['pay-per-booking.html']);
  assert.ok(!Object.keys(output).some(p => /^(api\/|middleware)|inquiry\.js$|package\.json$/.test(p)));
  for (const [name, data] of Object.entries(output).filter(([p])=>p.endsWith('.html'))) {
    assert.match(data, /DESIGN PREVIEW/);
    assert.doesNotMatch(data, /inquiry\.js|href="(?:tel:|mailto:)/);
    for (const form of data.matchAll(/<form id="ppb-qualify"[\s\S]*?<\/form>/g)) {
      assert.match(form[0], /\binert\b/);
      for (const fieldset of form[0].matchAll(/<fieldset\b[^>]*>/g)) assert.match(fieldset[0], /\bdisabled\b/);
    }
  }
  const calculator = output['index.html'].match(/<form id="ppb-calc"[\s\S]*?<\/form>/)[0];
  assert.doesNotMatch(calculator, /\binert\b|\bdisabled\b/);
  const config = JSON.parse(output['vercel.json']);
  const csp = config.headers[0].headers.find(h=>h.key==='Content-Security-Policy').value;
  assert.match(csp, /connect-src 'none'/); assert.match(csp, /form-action 'none'/);
  assert.equal(output['robots.txt'], 'User-agent: *\nDisallow: /\n');
});
