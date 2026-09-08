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
  let scene='',w=0,h=0,frame=0,last=0,next=6,age=0,meteor=null,burst=null;
  const coarse=matchMedia('(pointer: coarse)').matches;
  function resize(){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio,coarse?1:1.5);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);}
  function earth(){return {x:(.5+(.744-.5)/Math.min(1,Math.max(.6,w/h/1.78)))*w,y:.177*.431/.52*h};}
  function spawn(impact=false){
    if(reduced.matches||scene!=='cosmos'||meteor||burst)return;
    const target=impact?earth():{x:w*(.55+Math.random()*.35),y:h*(.15+Math.random()*.12)};
    meteor={x:w*.12,y:h*.025,tx:target.x,ty:target.y,t:0,duration:impact?3.2:1.5,impact};
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
      const fade=Math.min(1,p*9)*(m.impact?1:Math.min(1,(1-p)*8));
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);
      const g=ctx.createLinearGradient(-length,0,0,0);g.addColorStop(0,'rgba(255,55,10,0)');g.addColorStop(.65,`rgba(255,105,25,${fade*.6})`);g.addColorStop(1,`rgba(255,245,202,${fade})`);
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-length,0);ctx.quadraticCurveTo(-length*.35,-5,0,-1.5);ctx.lineTo(0,1.5);ctx.quadraticCurveTo(-length*.35,5,-length,0);ctx.fill();
      for(let i=0;i<(coarse?7:14);i++){const q=(i/14+age*.7)%1;ctx.globalAlpha=fade*(1-q)*.65;ctx.fillStyle='#ffad49';ctx.fillRect(-q*length,Math.sin(i*13+age*8)*q*7,1.5,1.5);}
      ctx.restore();glow(x,y,m.impact?16:9,fade*.65);
      if(p===1){if(m.impact)burst={x:m.tx,y:m.ty,t:0};meteor=null;}
    }
    if(burst){
      burst.t+=dt;const b=burst,fade=Math.max(0,1-b.t/4),r=12+b.t*32;
      glow(b.x,b.y,r,fade*.7);ctx.strokeStyle=`rgba(255,189,102,${fade*.55})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(b.x,b.y,r*1.4,r*.48,-.3,0,Math.PI*2);ctx.stroke();
      for(let i=0;i<(coarse?16:28);i++){const a=i*2.399,dist=b.t*(12+(i%7)*7);glow(b.x+Math.cos(a)*dist,b.y+Math.sin(a)*dist,2.5,fade*.6);}
      if(b.t>4){burst=null;asteroidButton.disabled=false;}
    }
    ctx.restore();frame=requestAnimationFrame(draw);
  }
  function reset(){cancelAnimationFrame(frame);frame=0;last=0;meteor=null;burst=null;asteroidButton.disabled=false;ctx.clearRect(0,0,w,h);if(scene==='cosmos'&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(draw);}
  meteorButton.onclick=()=>spawn();
  asteroidButton.onclick=()=>spawn(true);
  addEventListener('lake:scene',e=>{const key=e.detail.key;if(key===scene)return;scene=key;options.hidden=scene!=='cosmos';age=0;next=4;reset();});
  document.addEventListener('visibilitychange',reset);reduced.addEventListener('change',()=>{meteorButton.disabled=reduced.matches;asteroidButton.disabled=reduced.matches;reset();meteorButton.disabled=reduced.matches;asteroidButton.disabled=reduced.matches;});
  addEventListener('resize',resize);resize();
})();
