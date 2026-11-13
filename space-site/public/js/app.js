// UI behaviour: image slots, side-scroll, reveal, CMS render, comments, contact form, Space Bot
function slot(id,key){
 const el=document.getElementById(id),img=el.querySelector('img'),ph=el.querySelector('.ph,span');
 const show=s=>{img.src=s;img.style.display='block';if(ph)ph.style.display='none'};
 try{const s=localStorage.getItem(key);if(s)show(s)}catch(e){}
 const inp=document.createElement('input');inp.type='file';inp.accept='image/*';
 el.onclick=()=>inp.click();
 inp.onchange=()=>{const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,800/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);const d=c.toDataURL('image/webp',.85);show(d);try{localStorage.setItem(key,d)}catch(e){}};im.src=r.result};r.readAsDataURL(f)};
}
slot('ill','sd_ill');

// ---- horizontal side-scroll sections ----
const hs=[...document.querySelectorAll('.hs')].map(s=>({s,t:s.querySelector('.track')}));
function setH(){hs.forEach(o=>{o.d=o.t.scrollWidth-innerWidth+innerWidth*.12;o.s.style.height=(o.d+innerHeight)+'px'})}
function sideScroll(){hs.forEach(o=>{const r=o.s.getBoundingClientRect(),k=Math.min(1,Math.max(0,-r.top/(o.s.offsetHeight-innerHeight)));o.k=k})}
addEventListener('scroll',sideScroll,{passive:true});addEventListener('resize',()=>{setH();sideScroll()});
addEventListener('load',()=>{setH();sideScroll()});setH();

// ---- reveal + 3D tilt ----
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.15});
document.querySelectorAll('.rv').forEach(e=>io.observe(e));
document.querySelectorAll('.photo,.proj').forEach(el=>{
 el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform='perspective(800px) rotateY('+x*16+'deg) rotateX('+-y*16+'deg)'});
 el.addEventListener('mouseleave',()=>el.style.transform='')});
// ---- logo + black hole image, headings, parallax, dots, counters, countdown ----
document.querySelectorAll('h2').forEach(h=>{h.classList.add('sp');h.innerHTML=h.textContent.split(' ').map((w,i)=>'<span class="w" style="transition-delay:'+i*.08+'s">'+w+'</span>').join(' ')});
const io2=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');if(e.target.classList.contains('cnt')){const el=e.target,to=+el.dataset.to,t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/1800);el.textContent=Math.round(to*(1-Math.pow(1-k,3))).toLocaleString()+(el.dataset.s||'');if(k<1)requestAnimationFrame(f)})(t0)}io2.unobserve(e.target)}}),{threshold:.25});
document.querySelectorAll('.sp,.cnt,.bars').forEach(e=>io2.observe(e));
const pr=[...document.querySelectorAll('[data-par]')];
function par(){pr.forEach(e=>{const r=e.getBoundingClientRect(),c=(r.top+r.height/2-innerHeight/2)/innerHeight;e.style.transform='translate3d(0,'+(-c*(+e.dataset.par))+'px,0)'})}
addEventListener('scroll',par,{passive:true});par();
const DT=document.getElementById('dots'),SEC=[...document.querySelectorAll('[data-l]')];
SEC.forEach(s=>{const a=document.createElement('a');a.href='#'+(s.id||'');a.dataset.t=s.dataset.l;a.onclick=e=>{e.preventDefault();s.scrollIntoView({behavior:'smooth'})};DT.appendChild(a);s._d=a});
const io3=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)SEC.forEach(s=>s._d.classList.toggle('on',s===e.target))}),{threshold:.35});SEC.forEach(s=>io3.observe(s));
const CD=document.getElementById('cd');
function tick(){let d=Math.max(0,new Date('2026-12-09T09:00:00+07:00')-Date.now())/1000;const v=[['DAYS',d/86400],['HRS',d/3600%24],['MIN',d/60%60],['SEC',d%60]];CD.innerHTML=v.map(a=>'<div><b>'+String(Math.floor(a[1])).padStart(2,'0')+'</b><small>'+a[0]+'</small></div>').join('')}
tick();setInterval(tick,1000);
const NV=document.querySelector('nav div');document.getElementById('mb').onclick=()=>NV.classList.toggle('open');NV.onclick=e=>{if(e.target.tagName==='A')NV.classList.remove('open')};
if(document.fonts)document.fonts.ready.then(()=>{setH();sideScroll()});
const FT=document.querySelector('footer');for(let i=0;i<80;i++){const s=document.createElement('span');s.className='fs';s.style.cssText='left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;--d:'+(2+Math.random()*4)+'s;animation-delay:'+Math.random()*4+'s;transform:scale('+(.6+Math.random()*1.4)+')';FT.appendChild(s)}
new IntersectionObserver(es=>es.forEach(e=>FT.classList.toggle('in',e.isIntersecting)),{threshold:.35}).observe(FT);
// ---- CMS content, project comments, contact form, Space Bot ----
const J={'Content-Type':'application/json'},$=id=>document.getElementById(id);let LIVE=false,C=DEF;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LSg=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}},LSs=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
async function api(p,o){try{const r=await fetch('/api/'+p,o);let j=null;try{j=await r.json()}catch(e){}if(r.ok)return j;if(j&&j.error&&r.status!==404)return{error:j.error};return null}catch(e){return null}}
const li=a=>(a||[]).map(x=>'<li>'+esc(x)+'</li>').join('');
function render(){
 document.querySelectorAll('[data-c]').forEach(e=>{const v=e.dataset.c.split('.').reduce((o,k)=>o&&o[k],C);if(v==null||v==='')return;if(e.hasAttribute('data-br'))e.innerHTML=esc(v).split(' ').join('<br>');else e.textContent=v});
 $('skillsT').innerHTML=C.skills.map((k,i)=>'<div class="glass card"><small>'+String(i+1).padStart(2,'0')+'</small><h3>'+esc(k.t)+'</h3><ul>'+li(k.items)+'</ul></div>').join('');
 $('expT').innerHTML=C.exp.map(k=>'<div class="glass card"><small>'+esc(k.d)+'</small><h3>'+esc(k.t)+'</h3><p>'+esc(k.c)+'</p><ul>'+li(k.items)+'</ul></div>').join('');
 $('projG').innerHTML=C.projects.map((p,i)=>'<div class="glass proj rv" style="transition-delay:'+i*.1+'s"><small>'+esc(p.d)+'</small><h3>'+esc(p.t)+'</h3><p>'+esc(p.p)+'</p>'+(/^https?:\/\//.test(p.l||'')?'<br><a href="'+esc(p.l)+'" target="_blank" rel="noopener">'+esc(p.l.replace(/^https?:\/\//,''))+' ↗</a>':'')+'<br><button class="cm" data-p="'+esc(p.t)+'">💬 Comments</button><div class="cbox"></div></div>').join('');
 const a=C.aboutme||{},ph=$('photo');if(a.photo){const im=ph.querySelector('img');im.src=a.photo;im.style.display='block';const h=ph.querySelector('.ph');if(h)h.style.display='none'}
 $('facts').innerHTML=li(a.facts);const c=C.contact||{};
 $('cinfo').innerHTML='<h3>Direct</h3><p><a href="mailto:'+esc(c.email)+'">'+esc(c.email)+'</a></p><p><a href="https://t.me/'+esc(c.telegram)+'" target="_blank" rel="noopener">Telegram @'+esc(c.telegram)+'</a></p><p>Microsoft Teams · same email</p><p>Open to work · Dubai, UAE +4 more · Remote</p>';
 document.querySelectorAll('.rv:not(.in)').forEach(e=>io.observe(e));setH();sideScroll();
}
render();
(async()=>{const r=await api('content');LIVE=!!r&&!r.error&&typeof r==='object';if(LIVE&&Object.keys(r).length)C=Object.assign({},DEF,r);render();if(!LIVE)slot('photo','sd_photo')})();
// comments on projects
const ci=x=>'<div class="ci"><b>'+esc(x.name)+'</b><small>'+new Date(x.at).toLocaleDateString()+'</small><br>'+esc(x.text)+'</div>';
async function lc(box,p){const r=await api('comments?project='+encodeURIComponent(p));const it=r&&r.items?r.items:(LSg('c:'+p)||[]);box.querySelector('.cl').innerHTML=it.length?it.map(ci).join(''):'<p>No comments yet — be the first!</p>'}
$('projG').addEventListener('click',async e=>{
 const bx=e.target.closest('.cbox');
 if(bx&&e.target.matches('.btn')){const n=bx.querySelector('input'),t=bx.querySelector('textarea'),note=bx.querySelector('.note'),p=bx.previousElementSibling.dataset.p;if(!t.value.trim())return;
  const r=await api('comments',{method:'POST',headers:J,body:JSON.stringify({project:p,name:n.value,text:t.value})});
  if(r&&r.error){note.textContent='⚠️ '+r.error;return}
  if(!r){const a=LSg('c:'+p)||[];a.push({name:n.value.trim()||'Guest',text:t.value.trim(),at:Date.now()});LSs('c:'+p,a);note.textContent='Demo mode: saved in this browser only.'}else note.textContent='';
  t.value='';await lc(bx,p);return}
 const b=e.target.closest('.cm');if(!b)return;const box=b.nextElementSibling;box.classList.toggle('open');
 if(box.classList.contains('open')&&!box.dataset.l){box.dataset.l=1;box.innerHTML='<div class="cl"></div><input maxlength="60" placeholder="Your name"><textarea maxlength="600" rows="3" placeholder="Write a comment…"></textarea><button class="btn" type="button">Post comment</button><p class="note"></p>';await lc(box,b.dataset.p)}});
// contact form
$('cf').addEventListener('submit',async e=>{e.preventDefault();const f=e.target,d=Object.fromEntries(new FormData(f)),m=$('cfm');m.textContent='Sending…';
 const r=await api('contact',{method:'POST',headers:J,body:JSON.stringify(d)});
 if(r&&r.ok){m.textContent='✅ Message sent — I’ll reply soon!';f.reset()}
 else if(r&&r.error)m.textContent='⚠️ '+r.error;
 else{if(!d.name||!d.email||!d.message){m.textContent='⚠️ Please fill all fields';return}const a=LSg('msgs')||[];a.push({name:d.name,email:d.email,message:d.message,at:Date.now()});LSs('msgs',a);m.textContent='✅ Demo mode: saved in this browser. Deploy with MongoDB to receive real messages.';f.reset()}});
// Space Bot
const BL=$('bl');let BH=[];
function say(w,t){const d=document.createElement('div');d.className='m '+w;d.textContent=t;BL.appendChild(d);BL.scrollTop=1e9;return d}
$('bt').onclick=()=>{$('bot').classList.toggle('open');if(!BL.children.length)say('b','Hi! I’m Space Bot 🚀 — ask me anything about planets, stars, black holes, missions or the universe.')};
$('bx').onclick=()=>$('bot').classList.remove('open');
function local(q){q=q.toLowerCase();let best=null,sc=0;KB.forEach(k=>{const s=k[0].reduce((a,w)=>a+(q.includes(w)?w.length:0),0);if(s>sc){sc=s;best=k}});return best?best[1]:'I can talk about the Solar System, stars, galaxies, black holes, telescopes and space missions. Try: “What is a black hole?”, “How big is Jupiter?” or “What is the ISS?”'}
async function ask(q){say('u',q);const w=say('b','…');const r=await api('chat',{method:'POST',headers:J,body:JSON.stringify({message:q,history:BH.slice(-6)})});const a=r&&r.reply?r.reply:local(q);w.textContent=a;BH.push({r:'u',t:q},{r:'b',t:a})}
$('bf').onsubmit=e=>{e.preventDefault();const i=$('bi'),q=i.value.trim();if(q){i.value='';ask(q)}};
$('bq').onclick=e=>{if(e.target.tagName==='BUTTON')ask(e.target.textContent)};
