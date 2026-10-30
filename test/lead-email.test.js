const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/lead-email');
const keys = ['M365_TENANT_ID','M365_CLIENT_ID','M365_CLIENT_SECRET','LEAD_MAIL_FROM','LEAD_MAIL_TO'];
const originalEnv = Object.fromEntries(keys.map(k=>[k,process.env[k]]));
const originalFetch = global.fetch;
const reference='b58d2695-37bc-4120-8248-c610b703ac81';
function lead(extra={}) { return {name:'Synthetic Test',phone:'2025550100',email:'test@example.invalid',trade:'HVAC',town:'Celina',volume:'0',page:'https://payperbooked.com/booking',reference,...extra}; }
function res() { return {headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;},end(){this.ended=true;}}; }
async function run(body=lead(), method='POST') { const response=res(); await handler({body,method},response); return response; }
function setupMail(status=202) {
 const calls=[];
 global.fetch=async(url,options)=>{calls.push({url,options});return calls.length===1?{ok:true,json:async()=>({access_token:'test-token'})}:{status,ok:status>=200&&status<300};};
 return calls;
}
test.beforeEach(()=>{keys.forEach(k=>delete process.env[k]);process.env.M365_TENANT_ID='test-tenant';process.env.M365_CLIENT_ID='test-client';process.env.M365_CLIENT_SECRET='TEST-SECRET';global.fetch=async()=>{throw Error('unexpected fetch');};});
test.after(()=>{global.fetch=originalFetch;keys.forEach(k=>{if(originalEnv[k]===undefined)delete process.env[k];else process.env[k]=originalEnv[k];});});
test('method handling makes no mail calls',async()=>{assert.equal((await run({},'OPTIONS')).code,204);assert.equal((await run({},'GET')).code,405);});
test('configuration failure is safe to retry before mail is attempted',async()=>{delete process.env.M365_CLIENT_SECRET;const r=await run();assert.equal(r.code,503);assert.equal(r.body.retryable,true);});
test('honeypot does not send',async()=>{const r=await run({company_website:'spam.invalid'});assert.equal(r.code,202);});
test('malformed, oversized, missing, fractional and out-of-scope inputs rejected before sending',async()=>{
 for(const input of ['{',null,[], 'x'.repeat(8193),lead({name:'x'}),lead({name:'x'.repeat(121)}),lead({phone:'123'}),lead({phone:'1'.repeat(16)}),lead({email:'invalid'}),lead({volume:''}),lead({volume:'1.2'}),lead({volume:'-1'}),lead({volume:'10001'}),lead({volume:'1e2'}),lead({trade:'unknown'}),lead({town:'unknown'})]) {
  const r=await run(input);assert.ok([400,413].includes(r.code));assert.equal(r.body.retryable,true);
 }
});
test('202 returns acceptance only, sends once to internal destination and preserves an audit copy',async()=>{
 const calls=setupMail(); const r=await run(JSON.stringify(lead()));
 assert.equal(r.code,202);assert.deepEqual(r.body,{ok:true,status:'accepted',reference});
 assert.equal(calls.length,2);assert.match(calls[1].url,/\/users\/info%40nofluffmarketing\.io\/sendMail$/);
 const mail=JSON.parse(calls[1].options.body);
 assert.deepEqual(mail.message.toRecipients,[{emailAddress:{address:'info@nofluffmarketing.io'}}]);
 assert.equal(mail.message.replyTo[0].emailAddress.address,'test@example.invalid');
 assert.equal(mail.saveToSentItems,true);assert.match(mail.message.subject,new RegExp(reference));
 assert.equal(calls[1].options.headers['client-request-id'],reference);
 assert.equal(calls[0].options.redirect,'error');assert.equal(calls[1].options.redirect,'error');
 assert.ok(calls.every(c=>c.options.signal instanceof AbortSignal));
 assert.doesNotMatch(JSON.stringify(r.body),/TEST-SECRET|test-token|Synthetic Test|2025550100/);
});
test('token rejection, missing token, malformed response, network failure and timeout allow manual retry',async()=>{
 for(const response of [{ok:false,json:async()=>({})},{ok:true,json:async()=>({})},{ok:true,json:async()=>{throw Error('bad json');}},new Error('network'),new DOMException('timeout','TimeoutError')]) {
  let calls=0;global.fetch=async()=>{calls++;if(response instanceof Error)throw response;return response;};
  const r=await run();assert.equal(r.code,503);assert.equal(r.body.retryable,true);assert.equal(calls,1);
 }
});
test('explicit Graph rejection allows user retry without automatic resend',async()=>{
 for(const status of [400,401,403,404,413,422,429]) {const calls=setupMail(status);const r=await run();assert.equal(r.code,503);assert.equal(r.body.retryable,true);assert.equal(calls.length,2);}
});
test('unexpected 2xx, redirect and server errors never become delivery success',async()=>{
 for(const status of [200,201,204,301,500,502,503]) {const calls=setupMail(status);const r=await run();assert.equal(r.code,502);assert.equal(r.body.status,'unknown');assert.equal(r.body.retryable,false);assert.equal(calls.length,2);}
});
test('mail network failure and timeout retain unknown outcome and never retry',async()=>{
 for(const failure of [new Error('network'),new DOMException('timeout','TimeoutError')]) {
  let calls=0;global.fetch=async()=>{if(++calls===1)return {ok:true,json:async()=>({access_token:'test'})};throw failure;};
  const r=await run();assert.equal(r.body.status,'unknown');assert.equal(r.body.retryable,false);assert.equal(calls,2);
 }
});
test('configured internal recipient is server controlled, not supplied by caller',async()=>{
 process.env.LEAD_MAIL_TO='internal@example.invalid';const calls=setupMail();await run(lead({mailTo:'untrusted@example.invalid',name:'Synthetic\r\nTest'}));
 const mail=JSON.parse(calls[1].options.body);assert.equal(mail.message.toRecipients[0].emailAddress.address,'internal@example.invalid');assert.match(mail.message.body.content,/Name: Synthetic Test/);
});
