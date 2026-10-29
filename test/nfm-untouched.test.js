const fs = require('fs');
const { execFileSync } = require('child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const frozen = [
  'pricing.html',
  'booking.html',
  'reviews.html',
  'leads.html',
  'nurture.html',
  'style.css',
  'script.js',
  'sitemap.xml',
  'robots.txt'
];

const capCopy = {
  'index.html': {
    before: '<p>$0 setup. $49 a month plus $29 per confirmed booking, capped at $499 ($999 for roofing and water/fire restoration). Five pilot spots for home-service trades. Not for lawn or landscaping.</p>',
    after: '<p>$0 setup. $49 a month plus $29 per confirmed booking, with a $499 cap for every trade. Five pilot spots for home-service trades. Not for lawn or landscaping.</p>'
  },
  'llms.txt': {
    before: '- NoFluff Front Desk: Calls answered and jobs booked for home-service trades. $0 setup, $49/month + $29 per confirmed booking, $499/month cap ($999 roofing and water/fire restoration), bookings past the cap are free. No contract; cancel effective end of billing month. 48-hour dispute window. 5 pilot spots. Not for lawn/landscaping. Serving Celina, Prosper, McKinney, Frisco, Anna, Melissa, Little Elm, Aubrey and Denton, TX (US-380 corridor); more North Texas areas planned. https://www.nofluffmarketing.io/pay-per-booking',
    after: '- NoFluff Front Desk: Calls answered and jobs booked for home-service trades. $0 setup, $49/month + $29 per confirmed booking, $499 cap for every trade, bookings past the cap are free. No contract; cancel effective end of billing month. 48-hour dispute window. 5 pilot spots. Not for lawn/landscaping. Serving Celina, Prosper, McKinney, Frisco, Anna, Melissa, Little Elm, Aubrey and Denton, TX (US-380 corridor); more North Texas areas planned. https://www.nofluffmarketing.io/pay-per-booking'
  }
};

function changedLines(file) {
  const diff = execFileSync('git', ['diff', '-U0', 'origin/main', '--', file], { encoding: 'utf8' });
  const removed = [];
  const added = [];
  for (const line of diff.split('\n')) {
    if (
      line.startsWith('diff ') ||
      line.startsWith('index ') ||
      line.startsWith('---') ||
      line.startsWith('+++') ||
      line.startsWith('@@') ||
      line.startsWith('\\')
    ) continue;
    if (line.startsWith('-')) removed.push(line.slice(1));
    else if (line.startsWith('+')) added.push(line.slice(1));
  }
  return { removed, added };
}

test('NoFluff Marketing pages stay unchanged except the approved cap copy', () => {
  const out = execFileSync('git', ['diff', '--exit-code', 'origin/main', '--', ...frozen], { encoding: 'utf8' });
  assert.equal(out, '');

  for (const [file, lines] of Object.entries(capCopy)) {
    const text = fs.readFileSync(file, 'utf8');
    assert.equal(text.includes('$999'), false, file);
    assert.equal(text.includes('$499 cap for every trade'), true, file);
    const { removed, added } = changedLines(file);
    if (removed.length === 0 && added.length === 0) {
      assert.equal(text.includes(lines.after), true, file);
    } else {
      assert.deepEqual(removed, [lines.before], file);
      assert.deepEqual(added, [lines.after], file);
    }
  }
});
