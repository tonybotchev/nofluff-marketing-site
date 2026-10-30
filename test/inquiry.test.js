const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('payperbooked/inquiry.js', 'utf8');
const ref = '11111111-1111-4111-8111-111111111111';
function fixture(fetch, saved, brokenStorage = false) {
  const events = {}, fields = {}, memory = new Map(saved ? [['ppb-inquiry-state-v1', JSON.stringify(saved)]] : []);
  function node(id, value = '') {
    return fields[id] = { value, hidden: false, disabled: false, textContent: '',
      addEventListener: (type, fn) => { events[id + ':' + type] = fn; },
      setAttribute() {}, focus() {}, click() { return events[id + ':click']?.(); } };
  }
  ['qualify', 'qualify-error', 'qualify-done', 'next', 'back', 'send', 'step-label'].forEach(id => node('ppb-' + id));
  Object.entries({name:'Internal Test',phone:'2025550100',email:'internal@example.test',town:'Celina',volume:'0',company:''}).forEach(([id,v]) => node('ppb-'+id,v));
  const choice = {value:'HVAC'}, steps = Array.from({length:4},()=>({hidden:false,querySelector:()=>({focus(){}})}));
  fields['ppb-qualify'].querySelectorAll = () => steps;
  fields['ppb-qualify'].querySelector = () => choice.value ? choice : null;
  fields['ppb-qualify-done'].querySelector = tag => fields['done-'+tag] ||= node('done-'+tag);
  const context = {document:{getElementById:id=>fields[id]},fetch,crypto:{randomUUID:()=>ref},AbortController,
    location:{origin:'http://localhost',pathname:'/booking',search:'?secret=do-not-send'},
    sessionStorage:{getItem:k=>{if(brokenStorage)throw Error();return memory.get(k)||null;},setItem:(k,v)=>{if(brokenStorage)throw Error();memory.set(k,v);},removeItem:k=>memory.delete(k)},
    setTimeout:()=>1,clearTimeout(){},Date};
  vm.runInNewContext(source,context);
  return {fields,memory,choice,context,next:()=>fields['ppb-next'].click(), submit:()=>events['ppb-qualify:submit']({preventDefault(){}}),last(){for(let i=0;i<3;i++)this.next();}};
}
const result = (status, data) => ({status,json:async()=>data});
test('step validation and Enter never submit incomplete inquiry',async()=>{
 let count=0;const f=fixture(async()=>count++); f.choice.value=''; await f.submit();assert.equal(count,0);assert.match(f.fields['ppb-qualify-error'].textContent,/Choose/);
 f.choice.value='HVAC';f.next();f.next();f.fields['ppb-volume'].value='1.5';f.next();assert.match(f.fields['ppb-qualify-error'].textContent,/whole number/);
 f.fields['ppb-volume'].value='0';f.next();f.fields['ppb-email'].value='invalid';await f.submit();assert.equal(count,0);assert.match(f.fields['ppb-qualify-error'].textContent,/valid email/);
});
test('double submit sends once; acceptance states email submission, not booking; stores no PII',async()=>{
 let calls=0,resolve,body;const pending=new Promise(r=>resolve=r);const f=fixture(async(u,o)=>{calls++;body=JSON.parse(o.body);return pending;});f.last();
 const one=f.submit();await f.submit();assert.equal(calls,1);assert.equal(f.fields['ppb-send'].disabled,true);
 resolve(result(202,{ok:true,status:'accepted',reference:ref}));await one;
 assert.equal(f.fields['ppb-qualify'].hidden,true);assert.match(f.fields['done-p'].textContent,/does not reserve/);assert.equal(body.page,'http://localhost/booking');
 const stored=f.memory.get('ppb-inquiry-state-v1');assert.doesNotMatch(stored,/Internal|example|202555/);assert.equal(JSON.parse(stored).status,'accepted');
});
test('known non-send failures retain answers and permit one deliberate retry',async()=>{
 for(const code of [400,413,503]) {let count=0;const f=fixture(async()=>++count===1?result(code,{ok:false,retryable:true}):result(202,{ok:true,status:'accepted',reference:ref}));f.last();await f.submit();
 assert.equal(f.fields['ppb-name'].value,'Internal Test');assert.equal(f.fields['ppb-send'].disabled,false);assert.equal(f.memory.size,0);await f.submit();assert.equal(count,2);}
});
test('ambiguous transport, malformed JSON and mismatched responses prohibit automatic or manual repeat',async()=>{
 const cases=[async()=>{throw Error('network');},async()=>({status:202,json:async()=>{throw Error('JSON');}}),async()=>result(502,{ok:false,retryable:false}),async()=>result(200,{ok:true}),async()=>result(202,{ok:true,status:'accepted',reference:'wrong'})];
 for(const impl of cases){let count=0;const f=fixture(async()=>{count++;return impl();});f.last();await f.submit();await f.submit();assert.equal(count,1);assert.match(f.fields['ppb-qualify-error'].textContent,/could not confirm/);assert.equal(f.fields['ppb-name'].value,'Internal Test');assert.equal(JSON.parse(f.memory.values().next().value).status,'unknown');}
});
test('same-tab navigation restores accepted or uncertain guard; expired state permits inquiry',async()=>{
 for(const status of ['accepted','unknown']) {let count=0;const f=fixture(async()=>count++,{reference:ref,status,expires:Date.now()+100000});await f.submit();assert.equal(count,0);if(status==='accepted')assert.equal(f.fields['ppb-qualify'].hidden,true);else assert.match(f.fields['ppb-qualify-error'].textContent,/could not confirm/);}
 const f=fixture(async()=>{}, {reference:ref,status:'unknown',expires:1});assert.equal(f.memory.size,0);assert.equal(f.fields['ppb-next'].disabled,false);
});
test('unavailable session storage remains usable; unavailable UUID fails without sending',async()=>{
 let count=0;const f=fixture(async()=>{count++;return result(202,{ok:true,status:'accepted',reference:ref});},null,true);f.last();await f.submit();assert.equal(count,1);
 const g=fixture(async()=>count++);g.context.crypto.randomUUID=()=>{throw Error();};g.last();await g.submit();assert.equal(count,1);assert.equal(g.fields['ppb-send'].disabled,false);assert.match(g.fields['ppb-qualify-error'].textContent,/not submitted/);
});
test('draft branch suppresses deployments without changing other branch behavior',()=>{
 const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));
 assert.deepEqual(config.git.deploymentEnabled,{'codex/ppb-inquiry-readiness':false,'codex/ppb-premium-review':false});
});
