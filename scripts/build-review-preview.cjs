// Explicit static review artifact. Never deploy this output to production.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
function files() {
  const read = p => fs.readFileSync(path.join(root, p), 'utf8');
  const notice = '<aside aria-label="Design preview" style="background:#ff6b2b;color:#111;padding:12px 22px;font:600 14px/1.5 sans-serif">DESIGN PREVIEW — Forms and phone links are disabled. No messages, bookings or payments.</aside>';
  function page(source) {
    return read(source)
      .replace('</head>', '<meta name="robots" content="noindex,nofollow">\n</head>')
      .replace(/(<body[^>]*>)/, '$1' + notice)
      .replace(/<script src="\/payperbooked\/inquiry.js"><\/script>/g, '')
      .replace(/<noscript>[\s\S]*?<\/noscript>/g, '')
      .replace(/<form id="ppb-qualify"[\s\S]*?<\/form>/g, form =>
        '<p role="note">Preview only: inquiry submission is disabled.</p>' + form
          .replace('<form id="ppb-qualify" novalidate hidden>', '<form id="ppb-qualify" novalidate inert aria-label="Preview form disabled">')
          .replace(/<fieldset\b/g, '<fieldset disabled')
          .replace(/<button\b/g, '<button disabled'))
      .replace(/href="(?:tel:|mailto:)[^"]*"/g, 'aria-disabled="true"')
      ;
  }
  const home = page('pay-per-booking.html');
  const pricing = page('payperbooked/pricing.html');
  const booking = page('payperbooked/booking.html');
  return {
    'index.html': home, 'pay-per-booking.html': home,
    'pricing.html': pricing, 'booking.html': booking,
    'payperbooked/pricing.html': pricing, 'payperbooked/booking.html': booking,
    'style.css': read('style.css'), 'payperbooked/base.css': read('payperbooked/base.css'),
    'payperbooked/calculator.js': read('payperbooked/calculator.js'),
    'payperbooked/nav.js': read('payperbooked/nav.js'),
    'robots.txt': 'User-agent: *\nDisallow: /\n',
    'vercel.json': JSON.stringify({cleanUrls:true,headers:[{source:'/(.*)',headers:[
      {key:'X-Robots-Tag',value:'noindex, nofollow'},
      {key:'Content-Security-Policy',value:"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; form-action 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'"}
    ]}]}),
    'preview-source.json': JSON.stringify({sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),mode:'static-non-sending-review'})
  };
}
module.exports = {files};
if (require.main === module) {
  const output = process.argv[2];
  if (!output) throw new Error('Provide a new output directory outside the repository.');
  const destination = path.resolve(output);
  if (destination === root || destination.startsWith(root + path.sep) || fs.existsSync(destination)) throw new Error('Output must be a new directory outside the repository.');
  for (const [name, data] of Object.entries(files())) {
    const file = path.join(destination, name);
    fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, data);
  }
  console.log(destination);
}
