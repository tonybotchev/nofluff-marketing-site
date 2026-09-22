const recommendations={website:{title:'Build a stronger front door.',description:'Start with the Managed Website System: a credible site, a clear contact path, and the upkeep handled.',subject:'My website needs work'},visibility:{title:'Make your business easier to find.',description:'Start with your local business presence, consistent service information, and a clear path from search to your website.',subject:'I need better local visibility'},reviews:{title:'Make asking for reviews a habit.',description:'Start with a simple process for requesting honest feedback from real customers, then connect it to your local business presence.',subject:'I need a better review process'},followup:{title:'Make the next step clear.',description:'Map what happens after a call or inquiry. Then connect the handoff so your team knows who needs a response and what they need.',subject:'I need more consistent follow-up'}};
document.querySelectorAll('[data-fit]').forEach(button=>button.addEventListener('click',()=>{const kind=button.dataset.fit;const item=recommendations[kind];document.querySelectorAll('[data-fit]').forEach(option=>option.setAttribute('aria-pressed',String(option===button)));document.getElementById('fit-title').textContent=item.title;document.getElementById('fit-description').textContent=item.description;const link=document.getElementById('fit-link');link.href='#contact';link.dataset.request=({visibility:"unsure",followup:"nurture"}[kind]||kind);link.innerHTML=(kind==='website'?'Get my free preview':'Request help with this')+' <span>↗</span>'}));
document.getElementById('year').textContent=new Date().getFullYear();

const requests={
callshield:{title:'Your CallShield request',message:'I would like help with CallShield (never miss a call).'},
reviews:{title:'Your Review Engine request',message:'I would like help with Review Engine.'},
leads:{title:'Your Lead Machine request',message:'I would like help with Lead Machine / pipeline.'},
booking:{title:'Your booking and reminders request',message:'I would like help with booking and reminders.'},
nurture:{title:'Your Nurture Autopilot request',message:'I would like help with Nurture Autopilot.'},
website:{title:'Your managed website preview',message:'I would like a free managed website preview.'},
command:{title:'Your Operator / Command plan request',message:'I would like help choosing an Operator / Command plan.'},
unsure:{title:'Let’s find your starting point',message:'I would like help choosing the right system for my business.'}
};
const timing={soon:'As soon as we find the right fit',month:'Within the next month',exploring:'Exploring what is possible'};
const needSelect=document.getElementById('inquiry-need');
const qualification=document.getElementById('qualification');
let selectedPlan='';
let loadedRequest='';
function showSetup(){document.getElementById('inquiry-setup').hidden=false;document.getElementById('inquiry-details').hidden=true;document.getElementById('request-change-note').hidden=!loadedRequest;}
if(needSelect){const incoming=new URLSearchParams(location.search);const preset=incoming.get('need')||document.body.dataset.product;if(requests[preset])needSelect.value=preset;
needSelect.addEventListener('change',()=>{selectedPlan='';});}
document.querySelectorAll('[data-request]').forEach(link=>link.addEventListener('click',()=>{
if(!needSelect)return;const requested=link.dataset.request;if(!requests[requested])return;
needSelect.value=requested;selectedPlan=['Operator','Command','Command Pro'].includes(link.dataset.plan)?link.dataset.plan:'';
showSetup();
}));
document.getElementById('change-request')?.addEventListener('click',()=>{showSetup();needSelect.focus();});
qualification?.addEventListener('submit',event=>{
event.preventDefault();const need=needSelect.value;const when=document.getElementById('inquiry-timing').value;if(!requests[need]||!timing[when])return;
const plan=need==='command'?selectedPlan:'';
const url=new URL('https://api.nofluffgroup.com/widget/form/KdjIMQjUWpGuPdiNp9ma');
// This existing widget custom field is the persisted routing input. A native
// form-submitted workflow must branch on PRODUCT_INTEREST to apply CRM tags.
url.searchParams.set('nfm_website_inquiry','PRODUCT_INTEREST: '+need+'\n'+requests[need].message+(plan?'\nPlan: '+plan:'')+'\nTiming: '+timing[when]+'.\n\nWebsite / service area / what I want to improve: ');
url.searchParams.set('source','NoFluff Marketing website — '+need);
const incoming=new URLSearchParams(location.search);for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']){const value=incoming.get(key);if(value&&/^[a-zA-Z0-9._~ -]{1,120}$/.test(value))url.searchParams.set(key,value);}
// Preserve entered widget details when reopening the same request.
if(loadedRequest!==url.href){document.getElementById('lead-frame').src=url.href;loadedRequest=url.href;}
document.getElementById('direct-form').href=url.href;
document.getElementById('request-heading').textContent=plan?'Your '+plan+' plan request':requests[need].title;
document.getElementById('inquiry-setup').hidden=true;document.getElementById('inquiry-details').hidden=false;document.getElementById('request-heading').focus();
});