// Small, distant encounters: one aircraft or launch at a time.
(() => {
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:1;pointer-events:none';
  document.body.appendChild(canvas);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width, height, visitor = null, frame = 0, last = 0, timer = 0, weather = document.body.classList.contains('raining') ? 'rain' : 'clear';
  const buttons = new Map();
  const grid = document.querySelector('[data-effect="lanterns"]')?.parentElement;
  for (const [kind, label] of [['plane','Plane'], ['rocket','Rocket']]) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      if (visitor?.kind === kind) clear(); else spawn(kind);
    });
    grid?.appendChild(button); buttons.set(kind, button);
  }
  function update() {
    buttons.forEach((button, kind) => {
      button.disabled = reduced.matches || weather !== 'clear';
      button.title = reduced.matches ? 'Unavailable with reduced motion' : weather !== 'clear' ? 'Available in clear weather' : '';
      button.setAttribute('aria-pressed', String(visitor?.kind === kind));
    });
  }
  function resize() {
    width = innerWidth; height = innerHeight;
    const d = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width*d); canvas.height = Math.round(height*d); ctx.setTransform(d,0,0,d,0,0);
  }
  function schedule() {
    clearTimeout(timer);
    if (!document.hidden && !reduced.matches && weather === 'clear' && !navigator.connection?.saveData) {
      timer = setTimeout(() => spawn(Math.random() < .12 ? 'rocket' : 'plane'), 75000 + Math.random()*105000);
    }
  }
  function clear() {
    cancelAnimationFrame(frame); frame = 0; last = 0; visitor = null;
    ctx.clearRect(0,0,width,height); update(); schedule();
  }
  function spawn(kind) {
    if (document.hidden || reduced.matches || weather !== 'clear') return;
    clearTimeout(timer); cancelAnimationFrame(frame); last = 0;
    visitor = {kind, age:0, direction:Math.random()<.5 ? -1 : 1, altitude:.065+Math.random()*.06, origin:.64+Math.random()*.16, trail:[], nextPuff:0};
    update(); frame = requestAnimationFrame(draw);
  }
  function light(x,y,r,color,alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    const glow = ctx.createRadialGradient(x,y,0,x,y,r);
    glow.addColorStop(0,color); glow.addColorStop(1,'transparent');
    ctx.fillStyle=glow;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();
  }
  function draw(time) {
    frame=0;if (!visitor || document.hidden || reduced.matches) return;
    const dt=last?Math.min((time-last)/1000,.05):0;last=time;visitor.age+=dt;
    const v=visitor,t=v.age,hour=Number(document.querySelector('#daytime')?.value ?? 12),night=hour<6||hour>19;
    ctx.clearRect(0,0,width,height);
    if(v.kind==='plane') {
      const p=t/52,x=v.direction>0?-40+p*(width+80):width+40-p*(width+80),y=height*(v.altitude+.035*Math.sin(p*Math.PI));
      const scale=Math.min(1.2,Math.max(.85,width/1000))*(.85+.15*Math.sin(p*Math.PI));
      ctx.save();ctx.translate(x,y);ctx.scale(v.direction*scale,scale);
      // Project and depth-sort a small 3D airframe: cylindrical body, wings and tail.
      const yaw=.36+.12*Math.sin(p*Math.PI),bank=.23+Math.sin(t*.14)*.10;
      function project([ax,ay,az]){
        const by=ay*Math.cos(bank)-az*Math.sin(bank),bz=ay*Math.sin(bank)+az*Math.cos(bank);
        const xx=ax*Math.cos(yaw)+bz*Math.sin(yaw),zz=-ax*Math.sin(yaw)+bz*Math.cos(yaw);
        return [xx,-by*.88+zz*.46,zz*.88+by*.46];
      }
      const faces=[];
      function face(points,color){const pts=points.map(project);faces.push({pts,color,depth:pts.reduce((s,q)=>s+q[2],0)/pts.length});}
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4,b=(i+1)*Math.PI/4;
        const ring=(xx,r,angle)=>[xx,Math.cos(angle)*r,Math.sin(angle)*r];
        const shade=Math.round((night?86:185)+Math.cos(a)*35);
        face([ring(-14,.8,a),ring(10,2,a),ring(10,2,b),ring(-14,.8,b)],`rgb(${shade},${shade+8},${shade+12})`);
        face([ring(10,2,a),[18,0,0],ring(10,2,b)],night?'#82959f':'#e7eceb');
      }
      for(const side of [-1,1]){
        face([[5,0,side],[-7,-.3,side*17],[-11,-.3,side*17],[-4,0,side]],night?'#697f8b':side>0?'#d2dbdf':'#98acb6');
        face([[-12,.5,0],[-19,.8,side*6],[-21,.8,side*6],[-17,.5,0]],night?'#637782':'#bccbd0');
        face([[0,-.8,side*6],[3,-2.5,side*6],[-2,-2.5,side*6],[-3,-1,side*6]],night?'#3f535e':'#728b99');
      }
      face([[-12,1,0],[-18,7,0],[-21,7,0],[-18,.5,0]],night?'#6d818b':'#c5d3d8');
      faces.sort((a,b)=>b.depth-a.depth).forEach(({pts,color})=>{ctx.fillStyle=color;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fill();});
      const left=project([-9,0,-17]),right=project([-9,0,17]);
      light(left[0],left[1],night?3:1.7,'#ff5344',.8);light(right[0],right[1],night?3:1.7,'#87f5b6',.8);
      const pulse=t%2.3;if(pulse<.075||(pulse>.19&&pulse<.245))light(-15,0,night?5:2.5,'#f4fbff',.8);
      ctx.restore();
      if(p>=1){clear();return;}
    }else{
      const launch=Math.max(0,t-2),p=Math.min(1,launch/20),x=width*(v.origin-.095*p*p),y=height*(.34-.47*p*p),s=1-p*.5;
      if(t>v.nextPuff&&t<23){v.nextPuff=t+.14;v.trail.push({x:x/width,y:(y+12*s)/height,birth:t,seed:Math.random()});}
      v.trail=v.trail.filter(puff=>t-puff.birth<9).slice(-70);
      for(const puff of v.trail){const age=t-puff.birth,r=(3+age*2.8)*s,px=puff.x*width+age*2,py=puff.y*height;
        const smoke=ctx.createRadialGradient(px,py,0,px,py,r*1.8);smoke.addColorStop(0,night?'#abbfce':'#eef0e5');smoke.addColorStop(1,'transparent');ctx.globalAlpha=Math.max(0,1-age/9)*(night?.10:.22);ctx.fillStyle=smoke;ctx.fillRect(px-r*1.8,py-r*1.8,r*3.6,r*3.6);}
      ctx.globalAlpha=1;
      if(p<1){ctx.save();ctx.translate(x,y);ctx.rotate(-p*.23);ctx.scale(s,s);
        light(0,17,17,'#ffb966',night?.55:.25);
        const flame=ctx.createLinearGradient(0,9,0,39);flame.addColorStop(0,'#fffce0');flame.addColorStop(.25,'#ffd792');flame.addColorStop(1,'#ff783000');ctx.fillStyle=flame;
        ctx.beginPath();ctx.moveTo(-2.7,10);ctx.quadraticCurveTo(-4,22,Math.sin(t*29)*1.5,33+Math.sin(t*39)*4);ctx.quadraticCurveTo(4,22,2.7,10);ctx.fill();
        // Bright engine core and uneven expanding exhaust, rather than one solid flame.
        ctx.save();ctx.globalCompositeOperation='lighter';
        for(let j=0;j<12;j++){
          const q=((t*2.2+j/12)%1),yy=11+q*32,xx=Math.sin(j*7+t*18)*q*3;
          light(xx,yy,1.2+q*4,q<.3?'#e5efff':'#ffb65a',(1-q)*.36);
        }
        const core=ctx.createLinearGradient(0,10,0,28);core.addColorStop(0,'#f4f8ff');core.addColorStop(.45,'#fff7cf');core.addColorStop(1,'transparent');ctx.fillStyle=core;
        ctx.beginPath();ctx.moveTo(-1.4,10);ctx.lineTo(.5+Math.sin(t*43)*.4,29);ctx.lineTo(1.4,10);ctx.fill();ctx.restore();
        const hull=ctx.createLinearGradient(-3,0,3,0);hull.addColorStop(0,'#7b8d95');hull.addColorStop(.4,'#f3f1e6');hull.addColorStop(1,'#aebcc0');ctx.fillStyle=hull;
        ctx.beginPath();ctx.moveTo(-2.7,10);ctx.lineTo(-2.7,-10);ctx.quadraticCurveTo(-2.5,-14,0,-17);ctx.quadraticCurveTo(2.5,-14,2.7,-10);ctx.lineTo(2.7,10);ctx.closePath();ctx.fill();
        ctx.fillStyle='#34424b';ctx.fillRect(-2.7,-3,5.4,3);ctx.fillRect(-3,9,6,2);ctx.restore();
      }
      if(t>32){clear();return;}
    }
    frame=requestAnimationFrame(draw);
  }
  addEventListener('weather:change',event=>{weather=event.detail.weather;clear();});
  addEventListener('lake:scene',clear);
  document.addEventListener('visibilitychange',()=>{
    cancelAnimationFrame(frame);frame=0;last=0;clearTimeout(timer);
    if(!document.hidden){if(visitor)frame=requestAnimationFrame(draw);else schedule();}
  });
  reduced.addEventListener('change',clear);
  addEventListener('resize',resize,{passive:true});
  addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;clearTimeout(timer);});
  addEventListener('pageshow',()=>{last=0;if(visitor&&!frame&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(draw);else if(!visitor)schedule();});
  resize();update();schedule();
})();
