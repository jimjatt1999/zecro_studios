// Sparse meteors and an optional Earth impact. No downloaded models or textures.
(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  if(!ctx)return;
  canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1';
  document.querySelector('#water').after(canvas);
  const menu=document.querySelector('.atmosphere-menu');
  const options=document.createElement('div');options.className='cosmos-options';options.hidden=true;
  options.innerHTML='<div class="atmosphere-section-label">Cosmos</div><div class="atmosphere-grid"><button type="button" data-cosmos="meteor">Meteor</button><button type="button" data-cosmos="asteroid">Asteroid</button></div>';
  menu?.append(options);
  const meteorButton=options.querySelector('[data-cosmos="meteor"]');
  const asteroidButton=options.querySelector('[data-cosmos="asteroid"]');
  let scene='',w=0,h=0,frame=0,last=0,next=6,age=0,meteor=null,burst=null,embers=[];
  const coarse=matchMedia('(pointer: coarse)').matches;
  function resize(){
    const oldW=w||innerWidth,oldH=h||innerHeight;w=innerWidth;h=innerHeight;
    const d=Math.min(devicePixelRatio,coarse?1:1.5);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);
    if(meteor){meteor.x*=w/oldW;meteor.y*=h/oldH;const target=meteor.impact?earth():{x:w+Math.min(w*.18,170)+24,y:meteor.ty*h/oldH};meteor.tx=target.x;meteor.ty=target.y;}
    if(burst){const target=earth();burst.x=target.x;burst.y=target.y;}
    embers=[];
  }
  function earth(){const aspect=w/h;return aspect<1?{x:.744*w,y:(.431+(.177-.52)*aspect/1.78)*h}:{x:(.5+(.744-.5)/Math.min(1,aspect/1.78))*w,y:.177*.431/.52*h};}
  function waterGlow(x,y,alpha,radius=35){
    const horizon=h*.431,base=horizon+(horizon-y)*.7;
    ctx.save();ctx.beginPath();ctx.rect(0,horizon,w,h-horizon);ctx.clip();
    for(let i=0;i<28;i++){
      const d=i/28,yy=base+d*radius*2,shift=Math.sin(yy*.07-age*2)*4;
      const span=radius*(.25+d*.8),g=ctx.createLinearGradient(x-span,0,x+span,0);
      g.addColorStop(0,'rgba(255,151,61,0)');g.addColorStop(.5,`rgba(255,203,125,${alpha*(1-d)*.22})`);g.addColorStop(1,'rgba(255,151,61,0)');
      ctx.fillStyle=g;ctx.fillRect(x-span+shift,yy,span*2,1+Math.sin(i+age)*.4);
    }
    ctx.restore();
  }
  function spawn(impact=false){
    if(reduced.matches||scene!=='cosmos'||meteor||burst)return;
    // Continue until the entire tail has crossed the far edge, not an interior waypoint.
    const exitMargin=Math.min(w*.18,170)+24;
    const target=impact?earth():{x:w+exitMargin,y:h*(.18+Math.random()*.08)};
    meteor={x:impact?w*.12:-Math.max(24,w*.04),y:h*.025,tx:target.x,ty:target.y,t:0,duration:impact?3.2:2.8,impact};
    asteroidButton.disabled=impact;
  }
  function glow(x,y,r,alpha){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(255,244,204,${alpha})`);g.addColorStop(.2,`rgba(255,163,57,${alpha*.7})`);g.addColorStop(1,'rgba(255,65,12,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  function draw(now){
    frame=0;if(document.hidden||reduced.matches||scene!=='cosmos')return;
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;age+=dt;
    ctx.clearRect(0,0,w,h);
    if(age>next&&!meteor&&!burst){spawn();next=age+24+Math.random()*32;}
    ctx.save();ctx.globalCompositeOperation='lighter';
    if(meteor){
      const m=meteor;m.t+=dt;const p=Math.min(1,m.t/m.duration),x=m.x+(m.tx-m.x)*p,y=m.y+(m.ty-m.y)*p;
      const angle=Math.atan2(m.ty-m.y,m.tx-m.x),length=Math.min(w*.18,170)*Math.min(1,p*8);
      const fade=Math.min(1,p*12);
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);
      const g=ctx.createLinearGradient(-length,0,0,0);g.addColorStop(0,'rgba(255,55,10,0)');g.addColorStop(.65,`rgba(255,105,25,${fade*.6})`);g.addColorStop(1,`rgba(255,245,202,${fade})`);
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-length,0);ctx.quadraticCurveTo(-length*.35,-5,0,-1.5);ctx.lineTo(0,1.5);ctx.quadraticCurveTo(-length*.35,5,-length,0);ctx.fill();
      for(let i=0;i<(coarse?7:14);i++){const q=(i/14+age*.7)%1;ctx.globalAlpha=fade*(1-q)*.65;ctx.fillStyle='#ffad49';ctx.fillRect(-q*length,Math.sin(i*13+age*8)*q*7,1.5,1.5);}
      ctx.restore();glow(x,y,m.impact?16:9,fade*.65);
      waterGlow(x,y,fade,m.impact?55:30);
      if(embers.length<90)embers.push({x,y,t:0,vx:(Math.random()-.5)*7,vy:2+Math.random()*3});
      if(p===1){if(m.impact){burst={x:m.tx,y:m.ty,t:0};dispatchEvent(new CustomEvent('cosmos:impact',{detail:{x:m.tx/w}}));}meteor=null;}
    }
    embers=embers.filter(e=>e.t<2.4);
    for(const e of embers){e.t+=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;glow(e.x,e.y,2.2,Math.pow(Math.max(0,1-e.t/2.4),2)*.28);}
    if(burst){
      burst.t+=dt;const b=burst,fade=Math.max(0,1-b.t/4),r=12+b.t*32;
      waterGlow(b.x,b.y,fade*.85,r*1.2);
      glow(b.x,b.y,r,fade*.7);ctx.strokeStyle=`rgba(255,189,102,${fade*.55})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(b.x,b.y,r*1.4,r*.48,-.3,0,Math.PI*2);ctx.stroke();
      for(let i=0;i<(coarse?16:28);i++){const a=i*2.399,dist=b.t*(12+(i%7)*7);glow(b.x+Math.cos(a)*dist,b.y+Math.sin(a)*dist,2.5,fade*.6);}
      if(b.t>4){burst=null;asteroidButton.disabled=false;}
    }
    ctx.restore();frame=requestAnimationFrame(draw);
  }
  function reset(){cancelAnimationFrame(frame);frame=0;last=0;meteor=null;burst=null;embers=[];asteroidButton.disabled=false;ctx.clearRect(0,0,w,h);if(scene==='cosmos'&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(draw);}
  meteorButton.onclick=()=>spawn();
  asteroidButton.onclick=()=>spawn(true);
  addEventListener('lake:scene',e=>{const key=e.detail.key;if(key===scene)return;scene=key;options.hidden=scene!=='cosmos';age=0;next=4;reset();});
  document.addEventListener('visibilitychange',reset);reduced.addEventListener('change',()=>{meteorButton.disabled=reduced.matches;asteroidButton.disabled=reduced.matches;reset();meteorButton.disabled=reduced.matches;asteroidButton.disabled=reduced.matches;});
  addEventListener('resize',resize);resize();
})();
