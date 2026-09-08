import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as three from '../vendor/three.module.js';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
function harness(){
 let now=0,id=0;const timers=new Map(),frames=new Map(),events=new Map(),elements=new Map(),media=new Map();
 const ctx=new Proxy({}, {get(o,k){return o[k]??((...args)=>{for(const a of args)if(typeof a==='number')assert(Number.isFinite(a),k+' received nonfinite value');if(k.startsWith('create'))return {addColorStop(){}};});},set(o,k,v){o[k]=v;return true;}});
 function el(){const classes=new Set();return {style:{},hidden:false,textContent:'',value:'21',children:[],classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle(x,on){on??=!classes.has(x);on?classes.add(x):classes.delete(x);return on;}},append(...x){this.children.push(...x)},after(){},setAttribute(k,v){this[k]=v},removeAttribute(){},getContext:()=>ctx,addEventListener(){},querySelector:sel=>get(sel),querySelectorAll:()=>[],close(){},focus(){}};}
 const get=s=>{if(!elements.has(s))elements.set(s,el());return elements.get(s)};
 const on=(n,fn)=>{if(!events.has(n))events.set(n,[]);events.get(n).push(fn)};
 const sandbox={console,Math,URLSearchParams,innerWidth:390,innerHeight:844,devicePixelRatio:2,navigator:{},location:{search:''},document:{body:el(),hidden:false,querySelector:get,querySelectorAll:()=>[],createElement:el,addEventListener:on},matchMedia:q=>{if(!media.has(q))media.set(q,{matches:false,addEventListener(n,fn){this.change=fn;}});return media.get(q)},performance:{now:()=>now},setTimeout(fn,ms){timers.set(++id,{fn,at:now+ms});return id},clearTimeout:n=>timers.delete(n),setInterval(){return ++id},clearInterval(){},requestAnimationFrame(fn){frames.set(++id,fn);return id},cancelAnimationFrame:n=>frames.delete(n),addEventListener:on,dispatchEvent:e=>(events.get(e.type)||[]).forEach(fn=>fn(e)),CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},panel:el()};
 sandbox.window=sandbox;vm.createContext(sandbox);
 return {s:sandbox,ctx,get,media,timers,frames,run(code){vm.runInContext(code,sandbox)},emit(type,detail){sandbox.dispatchEvent({type,detail})},tick(ms){const end=now+ms;while(true){const next=[...timers].filter(([,x])=>x.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn()}now=end;},frame(ms=33){now+=ms;const queue=[...frames.values()];frames.clear();queue.forEach(fn=>fn(now))}};
}const nature=fs.readFileSync(root+'water-nature.js','utf8');
{
 const h=harness();h.run(nature);let seed=847;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32};
 for(const mobile of [false,true])for(const kind of ['fish','lanterns','petals']){const counts=new Set();for(let i=0;i<2000;i++){const p=h.s.LakeNature.profile(kind,{mobile},rng);counts.add(p.count);assert(p.count>=(kind==='fish'?3:1));assert(p.count<=(kind==='fish'?(mobile?6:10):kind==='lanterns'?(mobile?4:7):(mobile?22:36)));}assert(counts.size>=4);}
 console.log('PASS 12,000 seeded generation profiles: varied populations and mobile caps');
}
{
 const h=harness();h.run(nature);let clears=0;h.ctx.clearRect=()=>clears++;
 const src=fs.readFileSync(root+'water-life.js','utf8').replace(/\}\)\(\);\s*$/,'globalThis.test={state:()=>({fishSchool,petals,frame}),now,clearEffect};})();');h.run(src);h.emit('koi:spawn');h.frame();let fish=h.s.test.state().fishSchool[0];const x=fish.x,phase=fish.swimPhase,deadline=fish.end,age=h.s.test.now();
 h.s.document.hidden=true;h.emit('visibilitychange');h.emit('pagehide');assert.equal(h.frames.size,0);h.tick(120000);assert.equal(h.s.test.now(),age);
 h.s.document.hidden=false;h.emit('pageshow');h.emit('visibilitychange');assert.equal(h.frames.size,1);h.frame();assert.notEqual(fish.x,x);assert(fish.swimPhase>phase);assert.equal(fish.end,deadline);
 // Expire a school while still on-screen: no final painted frame may remain.
 for(const f of h.s.test.state().fishSchool){f.end=h.s.test.now()-1;f.x=150;f.y=600;}
 const before=clears;h.frame();assert.equal(h.s.test.state().fishSchool.length,0);assert.equal(h.frames.size,0);assert(clears-before>=2);
 h.emit('koi:spawn');h.frame();const beforeClear=clears;h.emit('koi:clear');assert.equal(h.frames.size,0);assert(clears>beforeClear);
 h.emit('life:spawn',{effect:'petals'});const petals=h.s.test.state().petals;assert(petals.length>=6);assert(Math.max(...petals.map(p=>p.birth))-Math.min(...petals.map(p=>p.birth))>300);
 console.log('PASS full life runtime: two-minute navigation pause, duplicate resume events, moving fish/tails, expiry canvas cleanup, manual removal, staggered petals');
}
{
 const h=harness();h.run(nature);const profile=h.s.LakeNature.profile;h.s.LakeNature={...h.s.LakeNature,profile:(kind,options)=>({...profile(kind,options),count:7})};h.s.THREE={...three,WebGLRenderer:class{setClearColor(){}setPixelRatio(){}setSize(){}render(){}clear(){}}};
 let src=fs.readFileSync(root+'water-lake-3d.js','utf8').replace("import * as THREE from 'three';",'').replace(/\}\)\(\);\s*$/,'globalThis.test={get:()=>({lanterns,scene}),clearLanterns};})();');h.run(src);h.emit('lanterns:spawn');h.frame();assert.equal(new Set(h.s.test.get().lanterns.map(l=>l.model.kanjiMaterial.map)).size,7);let l=h.s.test.get().lanterns[0];const x=l.baseX;assert(l.model.group.visible);for(const later of h.s.test.get().lanterns.slice(1))assert(!later.model.group.visible);
 h.emit('pagehide');h.tick(120000);h.emit('pageshow');assert.equal(h.frames.size,1);h.frame();assert.notEqual(l.baseX,x);assert(l.model.group.visible);h.s.test.clearLanterns();h.frame();assert.equal(h.frames.size,0);
 console.log('PASS seven distinct lantern character textures, arrival visibility, navigation pause/resume and cleanup (renderer stubbed)');
}
{
 const h=harness();h.run(fs.readFileSync(root+'water-weather.js','utf8').replace(/\}\)\(\);\s*$/,'globalThis.weatherTest={particles:()=>particles};})();'));
 let hits=[];h.s.addEventListener('lake:ripple',e=>hits.push(e.detail));h.emit('weather:set',{weather:'snow'});
 const p=h.s.weatherTest.particles()[0];p.y=p.landing-0.01;h.frame(160);assert(hits.length);assert(hits.every(x=>x.audible===false&&x.strength<=.02&&x.y>=844*.56));
 console.log('PASS snow landing dispatches a small silent water disturbance');
}
{
 const h=harness();const src=fs.readFileSync(root+'water-engine.js','utf8');
 h.run('let ready=true,paused=false,drops=[],time=1,activeUntil=0;'+src.slice(src.indexOf('    function splash('),src.indexOf('    let dragging='))+';globalThis.splashTest={splash,drops};');
 for(const y of [.58,.7,.88,.96])h.s.splashTest.splash(195,844*y,.02,.007,false);assert.equal(h.s.splashTest.drops.length,4);
 assert(h.s.splashTest.drops.every(d=>d[1]>.02&&d[1]<.98));
 console.log('PASS water simulation receives foreground wakes, including the former uncovered lower-water region');
}
{
 for(const width of [390,1440,2560]){
  const h=harness();h.s.innerWidth=width;
  h.run(fs.readFileSync(root+'water-cosmos.js','utf8').replace(/\}\)\(\);\s*$/,'globalThis.cosmosTest={spawn,get:()=>({meteor,embers,burst})};})();'));
  h.emit('lake:scene',{key:'cosmos'});h.s.cosmosTest.spawn();
  let m=h.s.cosmosTest.get().meteor;assert(m.x<0);assert(m.tx-Math.min(width*.18,170)>width);
  let crossed=false;for(let i=0;i<200;i++){h.frame();const cur=h.s.cosmosTest.get().meteor;if(cur&&cur.x+(cur.tx-cur.x)*cur.t/cur.duration>width)crossed=true;if(crossed&&!cur)break;}
  assert(crossed);assert.equal(h.s.cosmosTest.get().meteor,null);assert(h.s.cosmosTest.get().embers.length>0);
  h.s.cosmosTest.spawn();h.s.innerWidth=320;h.emit('resize');m=h.s.cosmosTest.get().meteor;assert(m.tx-Math.min(320*.18,170)>320);
  h.emit('lake:scene',{key:'fuji'});h.emit('lake:scene',{key:'cosmos'});h.s.cosmosTest.spawn(true);m=h.s.cosmosTest.get().meteor;assert(m.impact);assert(m.tx>0&&m.tx<320);
 }
 console.log('PASS meteor crosses the far edge with full tail clearance at three widths, including resize; asteroid still targets Earth');
}
{
 const h=harness();h.run(nature);h.run(fs.readFileSync(root+'water-life.js','utf8').replace(/\}\)\(\);\s*$/,'globalThis.starTest={get:()=>star};})();'));
 h.emit('life:spawn',{effect:'star'});const star=h.s.starTest.get();assert(star.x<0);assert(star.tx-star.length>h.s.innerWidth);for(let i=0;i<200;i++)h.frame();assert.equal(h.s.starTest.get(),null);assert.equal(h.frames.size,0);
 console.log('PASS shooting-star travel, trail rendering and cleanup');
}
{
 const h=harness();h.run(nature);
 h.run(fs.readFileSync(root+'water-life.js','utf8').replace(/\}\)\(\);\s*$/,'globalThis.fireworksTest={eligible,get:()=>fireworks,clearEffect};})();'));
 h.get('#daytime').value='12';assert(!h.s.fireworksTest.eligible().includes('fireworks'));
 h.get('#daytime').value='22';assert(h.s.fireworksTest.eligible().includes('fireworks'));
 h.s.document.body.classList.add('quiet-mode');assert(!h.s.fireworksTest.eligible().includes('fireworks'));h.s.document.body.classList.remove('quiet-mode');
 h.get('#daytime').value='12';let bursts=0;h.s.addEventListener('fireworks:burst',()=>bursts++);
 h.emit('life:spawn',{effect:'fireworks'});const count=h.s.fireworksTest.get().length;assert(count>=3&&count<=5);
 h.frame();h.emit('pagehide');h.tick(60000);h.emit('pageshow');assert.equal(bursts,0);
 for(let i=0;i<500;i++)h.frame();assert.equal(bursts,count);assert.equal(h.s.fireworksTest.get(),null);assert.equal(h.frames.size,0);
 h.get('#daytime').value='22';assert(!h.s.fireworksTest.eligible().includes('fireworks'));
 h.emit('life:spawn',{effect:'fireworks'});h.frame();h.s.fireworksTest.clearEffect('fireworks');assert.equal(h.s.fireworksTest.get(),null);assert.equal(h.frames.size,0);
 h.media.get('(prefers-reduced-motion: reduce)').matches=true;h.emit('life:spawn',{effect:'fireworks'});assert.equal(h.s.fireworksTest.get(),null);
 console.log('PASS fireworks: natural night-only eligibility, quiet-mode exclusion, manual daytime display, navigation pause, single burst events, cooldown, removal and reduced motion');
}
{
 for(const width of [390,1440])for(const seedStart of [19,317,902]){
  const h=harness();h.s.innerWidth=width;let seed=seedStart;h.s.Math=Object.create(Math);h.s.Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32};h.run(nature);
  const profile=h.s.LakeNature.profile;h.s.LakeNature={...h.s.LakeNature,profile:(kind,options)=>({...profile(kind,options),count:7})};
  h.s.THREE={...three,WebGLRenderer:class{setClearColor(){}setPixelRatio(){}setSize(){}render(){}clear(){}}};
  h.run(fs.readFileSync(root+'water-lake-3d.js','utf8').replace("import * as THREE from 'three';",'').replace(/\}\)\(\);\s*$/,'globalThis.spacingTest=()=>lanterns;})();'));
  h.emit('lanterns:spawn');
  for(let step=0;step<1800;step++){
   h.frame(33);const visible=h.s.spacingTest().filter(l=>l.model.group.visible);
   for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++){
    const a=visible[i],b=visible[j],dx=Math.abs(a.baseX-b.baseX),dy=Math.abs(a.baseY+a.scale*.25-b.baseY-b.scale*.25);
    assert(dx>=(a.scale+b.scale)*.42+.135||dy>=(a.scale+b.scale)*.29+.155,'lantern silhouettes overlap');
   }
  }
 }
 console.log('PASS maximum-size lantern groups stay separate through one minute of drift in six seeded desktop/mobile runs');
}
{
 const h=harness();h.run(nature);h.get('#daytime').value='12';
 h.run(fs.readFileSync(root+'water-mountain-life.js','utf8').replace(/\}\)\(\);\s*$/,'globalThis.mountainTest={project,pointOn,sync,available,get:()=>({walkers,routes,key})};})();'));
 const t=h.s.mountainTest;
 for(const key of ['fuji','yotei','alps']){
  h.emit('lake:scene',{key,winter:false});const state=t.get();assert(state.walkers.length>=9);assert(state.walkers.some(w=>w.horse));
  for(const path of [state.routes[key].climb,state.routes[key].lower])for(let i=0;i<=100;i++){
   const p=t.pointOn(path,i/100),screen=t.project(p.x,p.y);assert(Number.isFinite(screen.x)&&Number.isFinite(screen.y));assert(p.y<state.routes[key].shore);assert(screen.y<h.s.innerHeight*.431);
  }
  for(let i=0;i<50;i++)h.frame(45);
 }
 h.emit('lake:scene',{key:'cosmos'});assert.equal(h.frames.size,0);assert(!t.available());
 h.emit('lake:scene',{key:'fuji',winter:true});assert.equal(h.frames.size,0);
 h.emit('lake:scene',{key:'fuji',winter:false});h.get('#daytime').value='23';t.sync();assert.equal(h.frames.size,0);
 h.get('#daytime').value='12';t.sync();assert.equal(h.frames.size,1);
 h.emit('pagehide');h.tick(120000);h.emit('pageshow');assert.equal(h.frames.size,1);
 console.log('PASS mountain experiment: trail projection, horses, finite silhouettes, daylight/season/scene gating and navigation resume');
}
