const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const pages={'/':'pay-per-booking.html','/pricing':'payperbooked/pricing.html','/booking':'payperbooked/booking.html'};
test('all internal page links and fragment targets resolve',()=>{
 for(const [route,file] of Object.entries(pages)){
 const html=fs.readFileSync(file,'utf8');
 for(const [,href] of html.matchAll(/href="([^"]+)"/g)){
 if(!href.startsWith('/')&&!href.startsWith('#'))continue;
 const url=new URL(href,'https://payperbooked.com'+route);const target=pages[url.pathname]||url.pathname.slice(1);
 assert.ok(fs.existsSync(target),file+' -> '+href);
 if(url.hash)assert.ok(fs.readFileSync(target,'utf8').includes('id="'+url.hash.slice(1)+'"'),file+' -> '+href);
 }
 }
});
test('metadata retains product identity, canonical routes and approved structured pricing',()=>{
 for(const [route,file] of Object.entries(pages)){
 const html=fs.readFileSync(file,'utf8');assert.match(html,/<title>[^<]*PayPerBooked/);
 assert.ok(html.includes('rel="canonical" href="https://payperbooked.com'+route+'"'));
 const data=JSON.parse(html.match(/application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(data['@graph'].find(x=>x['@type']==='Organization').name,'PayPerBooked');
 const service=data['@graph'].find(x=>x['@type']==='Service');
 if(service.offers){const specs=service.offers.priceSpecification;assert.deepEqual(specs.map(x=>x.price??x.maxPrice),[0,49,29,499]);}
 }
});
test('calculator preserves zero-booking base and cap for every trade and keyboard input',()=>{
 const nodes={},events={},names=['HVAC','Plumbing','Electrical','Roofing','Garage door','Restoration'];
 for(const id of ['ppb-count','ppb-range','ppb-total','ppb-detail','ppb-trade-example'])nodes[id]={value:'10',textContent:'',addEventListener:(type,f)=>events[id+type]=f};
 const picks=names.map(name=>({textContent:name,addEventListener:(t,f)=>events[name]=f,setAttribute(){}}));
 nodes['ppb-calc']={querySelectorAll:()=>picks,addEventListener:(t,f)=>events.submit=f};
 vm.runInNewContext(fs.readFileSync('payperbooked/calculator.js','utf8'),{document:{getElementById:id=>nodes[id]}});
 for(const name of names){events[name]();for(const [count,total] of [[0,'$49'],[1,'$78'],[15,'$484'],[16,'$499'],[80,'$499'],[-1,'$49']]){nodes['ppb-count'].value=String(count);events['ppb-countinput']();assert.equal(nodes['ppb-total'].textContent,total);assert.match(nodes['ppb-detail'].textContent,new RegExp('^'+name));}}
 nodes['ppb-range'].value='5';events['ppb-rangeinput']();assert.equal(nodes['ppb-total'].textContent,'$194');let prevented=false;events.submit({preventDefault(){prevented=true;}});assert.ok(prevented);
});
