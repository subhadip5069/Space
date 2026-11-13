// Space audio engine (Web Audio API).
// 1) REAL RECORDINGS: put files in /audio and list them in audio/manifest.json — they play when you approach the object.
// 2) FALLBACK: every object also has a synthesised voice, so nothing is ever silent while files are missing.
// Sound fades in with distance, pans to the side the object is on, and a fly-by whoosh plays when you cross it.
window.SpaceAudio=(()=>{
 let ctx,master,verbIn,noiseBuf,on=false,vec,MAN=null,manP=null;const voices={},st={},bufs={},credits=new Set(),rnd=Math.random;
 const ROOT={Mercury:523.25,Venus:110,Earth:261.63,Mars:146.83,Jupiter:73.42,Saturn:293.66,Uranus:659.25,Neptune:98,Sun:110,Moon:196};
 const BIG=new Set(['Orion Nebula','Eagle Nebula','Lagoon Nebula','Veil Nebula','Crab Nebula','Spiral Galaxy','Andromeda Galaxy','Elliptical Galaxy','Triangulum Galaxy','Quasar','Galactic Center (Sagittarius A*)','Galaxy Cluster','Cosmic Web','Dark Matter','Big Bang','Supermassive Black Hole','Omega Centauri']);
 const RAD={Sun:240,Jupiter:160,Saturn:160,Uranus:140,Neptune:140,'Wormhole (theoretical)':160},GAIN={Mercury:.55,Venus:.75,Earth:.55,Mars:.6,Jupiter:.95,Saturn:.6,Uranus:.55,Neptune:.8,Sun:.55,Moon:.5};
 const rad=n=>RAD[n]||(BIG.has(n)?200:120);
 // --- building blocks ---
 const osc=(type,f,dest,g)=>{const o=ctx.createOscillator(),a=ctx.createGain();o.type=type;o.frequency.value=f;a.gain.value=g;o.connect(a);a.connect(dest);o.start();return{o,a}};
 const noise=(dest,type,f,q,g)=>{const s=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),a=ctx.createGain();s.buffer=noiseBuf;s.loop=true;fl.type=type;fl.frequency.value=f;fl.Q.value=q;a.gain.value=g;s.connect(fl);fl.connect(a);a.connect(dest);s.start();return{fl,a}};
 const lfo=(rate,depth,param)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=rate;g.gain.value=depth;o.connect(g);g.connect(param);o.start()};
 const lpf=(dest,f)=>{const x=ctx.createBiquadFilter();x.type='lowpass';x.frequency.value=f;x.connect(dest);return x};
 function bell(dest,f,v,d){const t=ctx.currentTime,c=ctx.createOscillator(),m=ctx.createOscillator(),mg=ctx.createGain(),e=ctx.createGain();c.frequency.value=f;m.frequency.value=f*3.5;mg.gain.setValueAtTime(f*1.4,t);mg.gain.exponentialRampToValueAtTime(.01,t+d);m.connect(mg);mg.connect(c.frequency);e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(v,t+.005);e.gain.exponentialRampToValueAtTime(.001,t+d);c.connect(e);e.connect(dest);c.start(t);m.start(t);c.stop(t+d+.1);m.stop(t+d+.1)}
 function burst(dest,type,f,att,dur,peak){const t=ctx.currentTime,s=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),e=ctx.createGain();s.buffer=noiseBuf;fl.type=type;fl.frequency.value=f;e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(peak,t+att);e.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(fl);fl.connect(e);e.connect(dest);s.start(t,rnd()*2);s.stop(t+dur+.1)}
 function glide(dest,f0,f1,dur,v){const t=ctx.currentTime,o=ctx.createOscillator(),e=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(v,t+dur*.25);e.gain.linearRampToValueAtTime(0,t+dur);o.connect(e);e.connect(dest);o.start(t);o.stop(t+dur+.1)}
 const every=(lo,hi,fn)=>{let nx=0;return()=>{const t=ctx.currentTime;if(t>nx){nx=t+lo+rnd()*(hi-lo);fn()}}};
 // --- generic synth voices (used for non-planet objects and as fallback) ---
 const pad=(b,fs,cut)=>{const f=lpf(b,cut||1600);fs.forEach((x,i)=>{const o=osc(i%2?'sine':'triangle',x,f,.07);lfo(.08+i*.03,.03,o.a.gain);lfo(.2+i*.07,1.2,o.o.frequency)});noise(b,'highpass',6500,.8,.02)};
 const twink=(b,sc,per,v)=>every(per*.4,per*1.6,()=>bell(b,sc[rnd()*sc.length|0],v||.1,2.2));
 const drone=(b,f,cut,ev)=>{osc('sine',f,b,.3);osc('triangle',f*1.5,b,.08);const n=noise(b,'lowpass',cut,.7,.3);lfo(.05,.2,n.a.gain);return ev?every(7,13,()=>glide(b,f*3,f*1.2,4,.3)):undefined};
 const pulsar=(b,rate)=>{const g=ctx.createGain(),n=ctx.createBufferSource(),f=ctx.createBiquadFilter(),re=new Float32Array(33),im=new Float32Array(33);g.gain.value=0;g.connect(b);n.buffer=noiseBuf;n.loop=true;f.type='bandpass';f.frequency.value=1800;f.Q.value=.8;n.connect(f);f.connect(g);n.start();for(let i=1;i<33;i++)re[i]=1;const o=ctx.createOscillator(),d=ctx.createGain();o.setPeriodicWave(ctx.createPeriodicWave(re,im));o.frequency.value=rate;d.gain.value=.9;o.connect(d);d.connect(g.gain);o.start()};
 const SC1=[1318.5,1568,1760,2093],SC2=[880,1108.7,1318.5,1661.2],SC3=[1046.5,1396.9,1568,2093];
 // --- one synthesised voice per object; each may return a tick() for random events ---
 const V={
  Mercury(b){noise(b,'bandpass',5200,6,.05);return twink(b,[1760,2349,2794,3136],.9,.18)},
  Venus(b){const f=lpf(b,260);[55,82.41,110.5].forEach((x,i)=>osc('sawtooth',x,f,.18-.04*i));lfo(.07,120,f.frequency);noise(b,'lowpass',380,.7,.35)},
  Earth(b){[220,329.63,440,554.37].forEach((x,i)=>{const o=osc('sine',x,b,.07);lfo(.2+i*.05,1.5,o.o.frequency)});const w=noise(b,'lowpass',500,.5,.25);lfo(.13,.22,w.a.gain)},
  Mars(b){const n=noise(b,'bandpass',650,1.4,.45);lfo(.11,380,n.fl.frequency);lfo(.17,.2,n.a.gain);osc('triangle',68,b,.06);noise(b,'highpass',3000,.5,.04)},
  Jupiter(b){osc('sine',36,b,.35);osc('triangle',48.5,b,.18);const n=noise(b,'lowpass',140,.8,.6);lfo(.06,.5,n.a.gain);return every(5,12,()=>burst(b,'lowpass',200,.4,4,.9))},
  Saturn(b){const f=lpf(b,2200);[293.66,440,587.33,739.99].forEach((x,i)=>{const o=osc('triangle',x,f,.06);lfo(4.5+i*.4,2.5,o.o.frequency);lfo(.1+i*.03,.04,o.a.gain)});noise(b,'highpass',7000,.8,.03);return twink(b,[1174.7,1568,1760,2349],2,.07)},
  Uranus(b){noise(b,'highpass',6000,1,.05);osc('sine',1318.5,b,.02);return twink(b,[1318.5,1568,1760,2093,2637],.7,.12)},
  Neptune(b){const o=osc('sine',110,b,.25);lfo(.05,40,o.o.frequency);const o2=osc('sine',164.8,b,.1);lfo(.04,25,o2.o.frequency);noise(b,'lowpass',260,.7,.4);const n=noise(b,'bandpass',900,3,.12);lfo(.09,.12,n.a.gain);return every(9,17,()=>glide(b,80,170,5,.35))},
  Sun(b){const f=lpf(b,500);[110,164.8].forEach(x=>osc('sawtooth',x,f,.1));lfo(.3,80,f.frequency);const n=noise(b,'bandpass',2500,.8,.1);lfo(.8,.06,n.a.gain)},
  Moon(b){osc('sine',130.8,b,.08);return twink(b,[261.6],6,.08)},
  ISS(b){osc('sine',120,b,.1);osc('triangle',240,b,.04);noise(b,'bandpass',900,2,.04);return every(5,9,()=>bell(b,1320,.06,.6))},
  Comet(b){noise(b,'highpass',6500,.8,.05);return twink(b,SC1,.9,.08)},
  'Red Giant'(b){return drone(b,55,200)},
  'Binary Star'(b){osc('sine',196,b,.15);osc('sine',197.8,b,.15);pad(b,[392,588],1200)},
  Pulsar(b){pulsar(b,4.5)},'Crab Pulsar'(b){pulsar(b,29.6)},'Vela Pulsar'(b){pulsar(b,11.2)},'PSR B1919+21'(b){pulsar(b,.75)},'Geminga Pulsar'(b){pulsar(b,4.2)},
  'Pleiades Cluster'(b){pad(b,[392,493.9],1800);return twink(b,SC2,.8)},'Beehive Cluster'(b){pad(b,[261.6,392],1500);return twink(b,SC3,1)},
  'Double Cluster'(b){pad(b,[329.6,440],1700);return twink(b,SC2,.7)},'Omega Centauri'(b){pad(b,[196,246.9,293.7,392],1400);return twink(b,SC3,.4,.07)},
  'Orion Nebula'(b){pad(b,[220,277.2,329.6])},'Ring Nebula'(b){pad(b,[293.7,370,440])},'Eagle Nebula'(b){pad(b,[196,246.9,293.7,392])},
  'Lagoon Nebula'(b){pad(b,[174.6,220,261.6])},'Veil Nebula'(b){pad(b,[233.1,311.1,349.2])},'Crab Nebula'(b){pad(b,[207.7,277.2,311.1],1200)},
  Supernova(b){osc('sine',40,b,.2);noise(b,'lowpass',300,.7,.2);return every(8,13,()=>burst(b,'lowpass',500,.05,3,1))},
  'Gamma-Ray Burst (GRB)'(b){noise(b,'highpass',5000,.5,.03);return every(5,9,()=>{glide(b,200,2400,.5,.25);burst(b,'highpass',3000,.02,.8,.5)})},
  'Supermassive Black Hole'(b){return drone(b,29,90,1)},
  'Gravitational Waves'(b){noise(b,'lowpass',200,.5,.1);return every(3.5,5,()=>glide(b,40,420,.9,.4))},
  'Wormhole (theoretical)'(b){const o=osc('sine',220,b,.12),o2=osc('sine',222.5,b,.12);lfo(.4,18,o.o.frequency);lfo(.33,22,o2.o.frequency);const n=noise(b,'bandpass',700,4,.12);lfo(.2,500,n.fl.frequency)},
  'Galactic Center (Sagittarius A*)'(b){const t=drone(b,36,140);noise(b,'bandpass',3200,3,.03);return t},
  'Spiral Galaxy'(b){pad(b,[146.8,220,293.7])},'Andromeda Galaxy'(b){pad(b,[130.8,196,261.6,329.6])},'Elliptical Galaxy'(b){pad(b,[110,164.8,220],900)},
  'Triangulum Galaxy'(b){pad(b,[164.8,246.9,329.6])},Quasar(b){noise(b,'bandpass',2400,.7,.14);pulsar(b,1.3)},
  'Galaxy Cluster'(b){pad(b,[98,146.8,196],900)},'Cosmic Web'(b){pad(b,[82.4,123.5,164.8],800)},'Dark Matter'(b){return drone(b,32,100)},
  'Big Bang'(b){osc('sine',30,b,.3);noise(b,'lowpass',400,.6,.25);return every(10,14,()=>{burst(b,'lowpass',600,.1,5,1);glide(b,200,30,4,.4)})}
 };
 // --- real-recording layer (audio/manifest.json) ---
 const manifest=()=>manP||(manP=fetch('audio/manifest.json').then(r=>r.ok?r.json():null).catch(()=>null).then(m=>MAN=m&&m.sounds?m:{sounds:{}}));
 const loadBuf=n=>{const c=MAN&&MAN.sounds[n];if(!c||!c.file)return Promise.resolve(null);return bufs[n]||(bufs[n]=fetch(c.file).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}).then(a=>ctx.decodeAudioData(a)).catch(()=>null))};
 function showCredit(){const el=document.getElementById('credit');if(el)el.textContent=credits.size?'Space audio: '+[...credits].join(' · ')+' — real mission recordings / sonifications':''}
 function attachSample(v,n){manifest().then(()=>loadBuf(n)).then(buf=>{if(!buf||!ctx)return;const c=MAN.sounds[n],src=ctx.createBufferSource(),sg=ctx.createGain(),s0=c.start||0;src.buffer=buf;src.loop=true;if(c.start!=null||c.end!=null){src.loopStart=s0;src.loopEnd=Math.min(c.end||buf.duration,buf.duration)}src.playbackRate.value=c.rate||1;sg.gain.value=0;src.connect(sg);sg.connect(v.bus);src.start(0,s0+rnd()*Math.max(0,((c.end||buf.duration)-s0)*.4));sg.gain.setTargetAtTime(c.gain==null?1:c.gain,ctx.currentTime,1.2);if(c.mix!=='layer')v.sb.gain.setTargetAtTime(0,ctx.currentTime,1);v.real=true;credits.add(c.credit||MAN.credit||'NASA');showCredit()})}
 function voice(n){if(voices[n])return voices[n];const bus=ctx.createGain(),sb=ctx.createGain(),pan=ctx.createStereoPanner(),snd=ctx.createGain();bus.gain.value=0;sb.connect(bus);snd.gain.value=.35;bus.connect(pan);pan.connect(master);bus.connect(snd);snd.connect(verbIn);const v=voices[n]={bus,sb,pan,tick:V[n](sb),real:false};attachSample(v,n);return v}
 function flyby(n,side,quiet){const t=ctx.currentTime,p=ctx.createStereoPanner(),sv=ctx.createGain();p.pan.value=Math.max(-1,Math.min(1,side*1.7));sv.gain.value=.4;p.connect(master);p.connect(sv);sv.connect(verbIn);
  const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),e=ctx.createGain();s.buffer=noiseBuf;f.type='bandpass';f.Q.value=1.2;f.frequency.setValueAtTime(250,t);f.frequency.exponentialRampToValueAtTime(2400,t+.55);f.frequency.exponentialRampToValueAtTime(300,t+1.6);e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(quiet?.22:.55,t+.5);e.gain.exponentialRampToValueAtTime(.001,t+1.7);s.connect(f);f.connect(e);e.connect(p);s.start(t,rnd()*2);s.stop(t+1.8);
  if(quiet)return;const r=ROOT[n]||220;[1,1.5,2,3].forEach((m,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=i?'sine':'triangle';o.frequency.value=r*m;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.1/(i+1)+.03,t+.35);g.gain.exponentialRampToValueAtTime(.001,t+3.2);o.connect(g);g.connect(p);o.start(t);o.stop(t+3.3)})}
 function init(){if(ctx)return;ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=0;const cp=ctx.createDynamicsCompressor();master.connect(cp);cp.connect(ctx.destination);
  noiseBuf=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=rnd()*2-1;
  verbIn=ctx.createGain();const cv=ctx.createConvolver(),n=ctx.sampleRate*2.8|0,ib=ctx.createBuffer(2,n,ctx.sampleRate);for(let c=0;c<2;c++){const x=ib.getChannelData(c);for(let i=0;i<n;i++)x[i]=(rnd()*2-1)*Math.pow(1-i/n,2.6)}cv.buffer=ib;verbIn.connect(cv);const vg=ctx.createGain();vg.gain.value=.6;cv.connect(vg);vg.connect(master);manifest()}
 const btn=document.getElementById('snd');
 const label=()=>{if(btn)btn.textContent=on?'🔊 Sound on':'🔇 Sound off'};
 function set(v){if(v){init();if(ctx.resume)ctx.resume()}on=v;if(ctx)master.gain.setTargetAtTime(v?.85:0,ctx.currentTime,.3);label();try{localStorage.setItem('snd',v?'1':'0')}catch(e){}if(v)bell(master,880,.06,2.5)}
 let objs=null;
 function update(cam,OBJ){if(!on||!ctx)return;if(!vec)vec=new THREE.Vector3();if(!objs)objs=OBJ.filter(o=>V[o.n]);const now=ctx.currentTime;
  objs.forEach(o=>{const n=o.n;vec.set(o.x,o.y,o.z);const d=cam.position.distanceTo(vec),R=rad(n);let l=Math.max(0,1-d/R);l=l*l*(3-2*l);const s=st[n]||(st[n]={z:0,cool:0});vec.applyMatrix4(cam.matrixWorldInverse);
   const side=vec.x/Math.max(d,1);
   if(l>.015){const v=voice(n);v.bus.gain.setTargetAtTime(l*(GAIN[n]||.6),now,.15);v.pan.pan.setTargetAtTime(Math.max(-1,Math.min(1,side*1.7)),now,.1);if(v.tick)v.tick()}else if(voices[n])voices[n].bus.gain.setTargetAtTime(0,now,.15);
   if(d<R&&s.z<0&&vec.z>=0&&now>s.cool){s.cool=now+4;flyby(n,side,voices[n]&&voices[n].real)}
   s.z=vec.z})}
 if(btn){btn.onclick=()=>set(!on);label()}
 let pref=null;try{pref=localStorage.getItem('snd')}catch(e){}
 if(pref==='1'){const ev=['pointerdown','keydown','touchend'],go=e=>{if(e.target&&e.target.closest&&e.target.closest('#snd'))return;ev.forEach(x=>removeEventListener(x,go));set(true)};ev.forEach(x=>addEventListener(x,go))}
 document.addEventListener('visibilitychange',()=>{if(!ctx)return;if(document.hidden)ctx.suspend();else if(on)ctx.resume()});
 return{update,set,get on(){return on}};
})();
