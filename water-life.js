(() => {
  'use strict';
  const canvas=document.querySelector('#life-layer');
  if(!canvas)return;
  const ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const coarse=matchMedia('(pointer: coarse)');
  const saveData=navigator.connection?.saveData;
  const params=new URLSearchParams(location.search),forced=params.get('effect');
  let width=innerWidth,height=innerHeight,scene='fuji',weather=document.body.classList.contains('snowing')?'snow':document.body.classList.contains('raining')?'rain':'clear',frame=0,last=0,scheduleTimer=0,pointer=null;
  let petals=[],fireflies=[],mist=null,star=null,bird=null,fishSchool=[],lanternsActive=false,mistPuffTexture,glowTexture;

  const lifeClock=LakeNature.clock();
  if(document.hidden||reduced.matches)lifeClock.pause();
  let fireworks=null,lastFireworks=-Infinity;
  const now=()=>lifeClock.now();
  const hour=()=>Number(document.querySelector('#daytime')?.value||12);
  const active=()=>fireworks||petals.length||fireflies.length||mist||star||bird||fishSchool.length||lanternsActive;
  function texture(w,h,draw){
    if(typeof h==='function'){draw=h;h=w;}
    const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return c;
  }
  function prepareTextures(){
    mistPuffTexture=texture(192,192,(c,s)=>{
      const cx=s*.5,cy=s*.5;
      const g=c.createRadialGradient(cx,cy,0,cx,cy,s*.48);
      g.addColorStop(0,'rgba(232,244,246,.38)');
      g.addColorStop(.28,'rgba(224,238,242,.24)');
      g.addColorStop(.62,'rgba(215,232,236,.09)');
      g.addColorStop(.88,'rgba(208,226,230,.02)');
      g.addColorStop(1,'rgba(200,220,225,0)');
      c.fillStyle=g;c.fillRect(0,0,s,s);
      const lobes=[
        {x:cx-s*.14,y:cy-s*.08,r:s*.32,a:.15},
        {x:cx+s*.14,y:cy-s*.06,r:s*.30,a:.13},
        {x:cx+s*.04,y:cy+s*.12,r:s*.34,a:.14},
        {x:cx-s*.08,y:cy+s*.10,r:s*.28,a:.11}
      ];
      lobes.forEach(l=>{
        const lg=c.createRadialGradient(l.x,l.y,0,l.x,l.y,l.r);
        lg.addColorStop(0,`rgba(230,243,246,${l.a})`);
        lg.addColorStop(.5,`rgba(218,234,238,${l.a*.5})`);
        lg.addColorStop(1,'rgba(210,228,230,0)');
        c.fillStyle=lg;c.beginPath();c.arc(l.x,l.y,l.r,0,Math.PI*2);c.fill();
      });
    });
    glowTexture=texture(64,(c,s)=>{const g=c.createRadialGradient(s*.5,s*.5,0,s*.5,s*.5,s*.48);g.addColorStop(0,'rgba(255,244,153,.9)');g.addColorStop(.18,'rgba(221,239,137,.48)');g.addColorStop(1,'rgba(194,230,125,0)');c.fillStyle=g;c.fillRect(0,0,s,s);});
  }
  function resize(){
    width=innerWidth;height=innerHeight;const ratio=Math.min(devicePixelRatio||1,coarse.matches?1:1.25);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);canvas.style.width=width+'px';canvas.style.height=height+'px';ctx.setTransform(ratio,0,0,ratio,0,0);
    prepareTextures();
  }
  function start(){if(!frame&&!document.hidden&&!reduced.matches&&!saveData){last=0;frame=requestAnimationFrame(draw);}}
  function stop(){cancelAnimationFrame(frame);frame=0;last=0;}
  function spawnPetals(){
    const event=LakeNature.profile('petals',{mobile:coarse.matches,weather}),birthTime=now();
    petals=Array.from({length:event.count},(_,i)=>{
      const isInitial=i<Math.floor(event.count*0.6);
      const depth=.3+Math.random()*.7;
      const birth=isInitial?birthTime:(birthTime+Math.floor(i/3)*event.arrivalGap+Math.random()*450);
      const y=isInitial?(-20+Math.random()*height*.43):(-20-Math.random()*35);
      return {x:Math.random()*width,y,landing:height*(.54+Math.random()*.18),birth,drift:event.pace||1,phase:event.phase+Math.random()*2,size:2+depth*6,depth,speed:10+depth*24,vx:0,vy:0,end:birth+35000};
    });start();
  }
  function createMistParticle(x,t,isInitial=false){
    const mobile=width<700;
    const lifespan=9000+Math.random()*11000;
    const birth=isInitial?(t-Math.random()*lifespan):t;
    const radius=(mobile?65:95)+Math.random()*(mobile?70:120);
    const baseY=height*(.38+Math.random()*.18);
    return {
      x:x!==undefined?x:(-radius*2+Math.random()*width*.2),
      y:baseY,baseY,radius,
      vx:(mobile?14:20)+Math.random()*(mobile?16:24),
      rot:Math.random()*Math.PI*2,
      vRot:(Math.random()-.5)*.08,
      alpha:.20+Math.random()*.16,
      phase:Math.random()*Math.PI*2,
      pulseSpeed:.0006+Math.random()*.0006,
      birth,lifespan
    };
  }
  function spawnMist(){
    const t=now(),mobile=width<700,count=mobile?38:58,particles=[];
    for(let i=0;i<count;i++){
      const initialX=Math.random()*(width+300)-150;
      particles.push(createMistParticle(initialX,t,true));
    }
    mist={start:t,end:t+42000,particles};
    start();
  }
  function spawnStar(){
    const birth=now()+200;
    star={start:birth,end:birth+2800,x:-width*.08,y:height*(.06+Math.random()*.05),tx:width*1.22,ty:height*(.20+Math.random()*.07),length:Math.min(170,width*.17)};start();
  }
  function spawnFireflies(){
    const end=now()+24000,count=coarse.matches?6:10;
    fireflies=Array.from({length:count},()=>({x:Math.random()*width,y:height*(.5+Math.random()*.32),phase:Math.random()*7,end}));start();
  }
  function spawnBird(){bird={start:now(),end:now()+45000};dispatchEvent(new CustomEvent('birds:spawn'));start();}
  function spawnKoi(){
    const event=LakeNature.profile('fish',{mobile:coarse.matches,weather});
    const dir=event.direction,fromLeft=dir>0,count=event.count;
    const startX = fromLeft ? -60 : (width + 60);
    const baseY = height * (0.63 + Math.random() * 0.16);

    fishSchool = Array.from({ length: count }, (_, i) => {
      const isLeader = i === 0;
      const baseLen = (isLeader ? 46 : 32) + Math.random()*14;
      const len = width < 700 ? baseLen * 0.8 : baseLen;
      const wid = len * 0.38;
      const depth = 0.22 + Math.random() * 0.55;
      const offsetX = isLeader ? 0 : (-dir * (event.spacing*i + Math.random()*18));
      const offsetY = isLeader ? 0 : ((i % 2 === 1 ? 1 : -1) * (8+i*5+Math.random()*8)*event.spread);
      return {
        isLeader,
        slotX:offsetX,slotY:offsetY,pace:event.pace,
        x: startX + offsetX,
        y: baseY + offsetY,
        len,
        wid,
        depth,
        targetDepth: depth,
        heading: fromLeft ? 0 : Math.PI,
        targetHeading: fromLeft ? 0 : Math.PI,
        dir,
        speedMult: 1.0,
        swimPhase: Math.random() * Math.PI * 2,
        tailFreq: 3.8 + Math.random() * 1.4,
        burstTimer: now() + 2000 + Math.random() * 3000,
        rippleTimer: now() + 2000 + Math.random() * 4000,
        variant: i % 3,
        phase: i * 1.5,
        startleUntil: 0,
        startleAngle: fromLeft ? 0 : Math.PI,
        end: now() + 45000 + i * 1500
      };
    });
    start();
  }
  function spawnLanterns(){
    lanternsActive=true;
    dispatchEvent(new CustomEvent('lanterns:spawn'));
    start();
  }
  function spawnFireworks(){
    if(reduced.matches||saveData)return;
    const birth=now(),count=coarse.matches?3:4+Math.floor(Math.random()*2);
    const colors=['255,204,128','242,170,184','165,209,242','198,221,163'];
    fireworks=Array.from({length:count},(_,i)=>({
      start:birth+i*(1600+Math.random()*600),x:.22+Math.random()*.56,y:.09+Math.random()*.12,
      color:colors[Math.floor(Math.random()*colors.length)],burst:false,
      sparks:Array.from({length:coarse.matches?32:52},(_,j)=>({angle:j*2.39996+Math.random()*.10,speed:.07+Math.random()*.13,life:2.2+Math.random()*1.3,phase:Math.random()*6.28}))
    }));
    lastFireworks=birth;start();
  }
  function drawFireworks(t){
    if(!fireworks)return;
    ctx.save();ctx.globalCompositeOperation='lighter';
    const size=Math.min(width,height),night=hour()<6||hour()>19,brightness=night?1:.68;
    for(const shell of fireworks){
      const age=(t-shell.start)/1000;if(age<0)continue;
      const x=shell.x*width,y=shell.y*height;
      if(age<1.25){
        const p=age/1.25,headY=height*.415+(y-height*.415)*(1-Math.pow(1-p,1.6));
        const trail=ctx.createLinearGradient(x,headY,x,headY+26);trail.addColorStop(0,'rgba(255,216,154,.7)');trail.addColorStop(1,'rgba(255,177,96,0)');
        ctx.strokeStyle=trail;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,headY);ctx.lineTo(x-2,headY+26);ctx.stroke();continue;
      }
      if(!shell.burst){shell.burst=true;dispatchEvent(new CustomEvent('fireworks:burst',{detail:{x:shell.x}}));}
      const elapsed=age-1.25;
      for(const spark of shell.sparks){
        if(elapsed>spark.life)continue;
        const drag=(1-Math.exp(-elapsed*.85))/.85,travel=spark.speed*size*drag;
        const sx=x+Math.cos(spark.angle)*travel,sy=y+Math.sin(spark.angle)*travel+elapsed*elapsed*size*.018;
        const fade=Math.pow(Math.max(0,1-elapsed/spark.life),1.6)*brightness;
        const shimmer=.78+.22*Math.sin(elapsed*14+spark.phase);
        if(sy<height*.405){
          ctx.strokeStyle=`rgba(${shell.color},${fade*shimmer})`;ctx.lineWidth=elapsed<.2?1.4:.9;
          ctx.beginPath();ctx.moveTo(sx-Math.cos(spark.angle)*3,sy-Math.sin(spark.angle)*3-1);ctx.lineTo(sx,sy);ctx.stroke();
        }
        const ry=height*.431+(height*.431-sy)*.7;
        if(ry>height*.431&&ry<height){
          const shift=Math.sin(ry*.12-t*.0018)*3;
          ctx.strokeStyle=`rgba(${shell.color},${fade*.105})`;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(sx+shift-2,ry);ctx.lineTo(sx+shift+2,ry);ctx.stroke();
        }
      }
    }
    ctx.restore();
    if(fireworks.every(shell=>t>shell.start+4800)){fireworks=null;updateMenuState();}
  }
  const spawners={fireworks:spawnFireworks,petals:spawnPetals,mist:spawnMist,star:spawnStar,fireflies:spawnFireflies,bird:spawnBird,koi:spawnKoi,lanterns:spawnLanterns};
  function clearLife(){
    fireworks=null;    petals=[];fireflies=[];mist=null;star=null;bird=null;fishSchool=[];lanternsActive=false;
    dispatchEvent(new CustomEvent('birds:clear'));
    dispatchEvent(new CustomEvent('lanterns:clear'));
    ctx.clearRect(0,0,width,height);
    if(!active()){stop();ctx.clearRect(0,0,width,height);}
  }
  function clearEffect(name){
    if(name==='fireworks')fireworks=null;
    else if(name==='petals')petals=[];
    else if(name==='mist')mist=null;
    else if(name==='star')star=null;
    else if(name==='fireflies')fireflies=[];
    else if(name==='bird'){bird=null;dispatchEvent(new CustomEvent('birds:clear'));}
    else if(name==='koi'){fishSchool=[];}
    else if(name==='lanterns'){lanternsActive=false;dispatchEvent(new CustomEvent('lanterns:clear'));}
    if(!active()){stop();ctx.clearRect(0,0,width,height);}
  }
  function isEffectActive(name){
    if(name==='fireworks')return fireworks!==null;
    if(name==='petals')return petals.length>0;
    if(name==='mist')return mist!==null;
    if(name==='star')return star!==null;
    if(name==='fireflies')return fireflies.length>0;
    if(name==='bird')return bird!==null;
    if(name==='koi')return fishSchool.length>0;
    if(name==='lanterns')return lanternsActive;
    return false;
  }
  function toggleEffect(name){
    if(isEffectActive(name)){
      clearEffect(name);
      return false;
    }else{
      if(spawners[name]){
        spawners[name]();
        start();
      }
      return true;
    }
  }
  function eligible(){
    const h=hour(),clear=weather==='clear',list=[];
    if(clear&&scene==='fuji'&&h>7&&h<18)list.push('petals');
    if((clear||weather==='rain')&&h>4.5&&h<8.5)list.push('mist','mist');
    if(clear&&(h>21||h<4.5))list.push('star','star');
    if(clear&&h>20&&h<24)list.push('fireflies','fireflies');
    if(clear&&h>6&&h<19)list.push('bird');
    if(h>6&&h<20&&weather!=='storm')list.push('koi','koi');
    if((clear||weather==='rain')&&(h>18||h<5.5))list.push('lanterns','lanterns');
    if(clear&&(h>20||h<5)&&now()-lastFireworks>180000&&!document.body.classList.contains('quiet-mode'))list.push('fireworks');
    return list;
  }
  function schedule(){
    clearTimeout(scheduleTimer);scheduleTimer=setTimeout(()=>{
      if(mode!=='natural'||document.hidden||reduced.matches||saveData)return;
      const choices=eligible();if(!active()&&choices.length&&Math.random()<.38)spawners[choices[Math.floor(Math.random()*choices.length)]]();schedule();
    },22000+Math.random()*24000);
  }
  function petalShape(p,t){
    ctx.save();
    ctx.translate(p.x,p.y);
    if(p.landed){
      // Floating on the lake surface: foreshortened horizontal resting orientation
      const rock=Math.sin(t*0.0016+p.phase)*0.18;
      ctx.rotate(p.phase+rock);

      // Delicate surface meniscus / contact shadow on the water plane
      ctx.fillStyle='rgba(2,26,34,0.22)';
      ctx.beginPath();
      ctx.ellipse(0,1.2,p.size*1.15,p.size*0.42,0,0,Math.PI*2);
      ctx.fill();

      // Petal resting flat on the water plane
      ctx.scale(1,0.44);
      const shade=ctx.createLinearGradient(-p.size,0,p.size,p.size);
      shade.addColorStop(0,'#fff3ef');
      shade.addColorStop(0.48,'#f5cbd0');
      shade.addColorStop(1,'#c8879f');

      const fade=p.floatEnd?Math.max(0,Math.min(1,(p.floatEnd-t)/3500)):1;
      ctx.globalAlpha=(0.52+p.depth*0.38)*fade;
      ctx.fillStyle=shade;
    }else{
      // Tumbling through the air
      const turn=t*0.0018+p.phase;
      ctx.rotate(Math.sin(turn*0.7)*1.8+p.phase);
      ctx.scale(Math.max(0.08,Math.abs(Math.cos(turn))),1);
      const shade=ctx.createLinearGradient(-p.size,0,p.size,p.size);
      shade.addColorStop(0,'#fff3ef');
      shade.addColorStop(0.48,'#f5cbd0');
      shade.addColorStop(1,'#c8879f');
      const airFade=p.end?Math.max(0,Math.min(1,(p.end-t)/1500)):1;
      ctx.globalAlpha=(0.45+p.depth*0.4)*airFade;
      ctx.fillStyle=shade;
    }
    ctx.beginPath();
    ctx.moveTo(0,-p.size*1.15);
    ctx.bezierCurveTo(p.size*0.78,-p.size*0.72,p.size*0.9,p.size*0.24,0,p.size*1.12);
    ctx.bezierCurveTo(-p.size*0.72,p.size*0.35,-p.size*0.92,-p.size*0.5,0,-p.size*1.15);
    ctx.fill();
    ctx.restore();
  }
  function drawPetals(t,dt){
    petals=petals.filter(p=>!p.landed?(t<p.end&&p.x<width+24):(t<p.floatEnd&&p.x<width+24));
    for(const p of petals){
      if(t<p.birth)continue;
      if(!p.landed){
        if(pointer){const dx=p.x-pointer.x,dy=p.y-pointer.y,d=Math.hypot(dx,dy);if(d<90){p.vx+=dx/(d||1)*1.8;p.vy+=dy/(d||1)*1.2;}}
        p.vx*=.96;p.vy*=.96;
        p.x+=(9*p.drift+Math.sin(t*0.001+p.phase)*18+p.vx)*dt;
        p.y+=(p.speed+Math.cos(t*0.002+p.phase)*9+p.vy)*dt;
        if(p.x>width+12)p.x=-12;
        if(p.y>=p.landing){
          p.landed=true;
          p.landedAt=t;
          p.floatEnd=t+24000+Math.random()*16000;
          dispatchEvent(new CustomEvent('lake:ripple',{detail:{x:p.x,y:p.landing,strength:0.075+p.depth*0.045}}));
        }
      }else{
        // Gently floating and bobbing on the water surface with current
        p.y=p.landing+Math.sin(t*0.0018+p.phase)*2.2;
        p.x+=(3.8+Math.sin(t*0.001+p.phase)*5.0+p.vx)*dt;
        p.vx*=.95;
        if(pointer){const dx=p.x-pointer.x,dy=p.y-pointer.y,d=Math.hypot(dx,dy);if(d<110){p.vx+=dx/(d||1)*2.2;}}
      }
      petalShape(p,t);
    }
  }
  function drawMist(t,dt){
    if(!mist||!mist.particles)return;
    if(t>mist.end){mist=null;return;}
    const masterFade=Math.min(1,(t-mist.start)/4000,(mist.end-t)/5000);
    const mobile=width<700;
    for(const p of mist.particles){
      const age=t-p.birth;
      const normLife=age/p.lifespan;
      if(normLife>=1||p.x>width+p.radius*2){
        if(t<mist.end){
          p.birth=t;
          p.lifespan=8500+Math.random()*11500;
          p.radius=(mobile?65:95)+Math.random()*(mobile?70:120);
          p.x=-p.radius*2-Math.random()*80;
          p.baseY=height*(.38+Math.random()*.18);
          p.vx=(mobile?14:20)+Math.random()*(mobile?16:24);
          p.rot=Math.random()*Math.PI*2;
          p.vRot=(Math.random()-.5)*.08;
        }else{
          continue;
        }
      }
      p.x+=p.vx*dt;
      p.rot+=p.vRot*dt;
      const wave=Math.sin(t*p.pulseSpeed+p.phase)*(height*.015);
      p.y=p.baseY+wave;
      const currentR=p.radius*(1+Math.sin(t*p.pulseSpeed*1.4+p.phase)*.15);
      if(pointer){
        const dx=p.x-pointer.x,dy=p.y-pointer.y,dist=Math.hypot(dx,dy);
        if(dist<130){
          const push=(1-dist/130)*1.5;
          p.x+=(dx/(dist||1))*push*12;
          p.baseY+=(dy/(dist||1))*push*5;
        }
      }
      const pFade=Math.sin(Math.max(0,Math.min(1,normLife))*Math.PI);
      const alpha=Math.max(0,masterFade)*p.alpha*pFade;
      if(alpha>.005){
        ctx.save();
        ctx.translate(p.x,p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha=alpha;
        ctx.drawImage(mistPuffTexture,-currentR,-currentR,currentR*2,currentR*2);
        ctx.restore();
      }
    }
    ctx.globalAlpha=1;
  }
  function drawStar(t){
    if(!star||t<star.start)return;if(t>star.end){star=null;return;}
    const p=(t-star.start)/(star.end-star.start),fade=Math.min(1,p*12);
    const x=star.x+(star.tx-star.x)*p,y=star.y+(star.ty-star.y)*p;
    const angle=Math.atan2(star.ty-star.y,star.tx-star.x),dx=Math.cos(angle)*star.length,dy=Math.sin(angle)*star.length;
    const g=ctx.createLinearGradient(x-dx,y-dy,x,y);g.addColorStop(0,'rgba(148,198,235,0)');g.addColorStop(.72,`rgba(196,227,249,${fade*.4})`);g.addColorStop(1,`rgba(250,252,255,${fade*.9})`);
    ctx.strokeStyle=g;ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(x-dx,y-dy);ctx.lineTo(x,y);ctx.stroke();
    ctx.save();ctx.globalCompositeOperation='lighter';
    const halo=ctx.createRadialGradient(x,y,0,x,y,7);halo.addColorStop(0,`rgba(231,246,255,${fade*.7})`);halo.addColorStop(1,'rgba(180,220,255,0)');ctx.fillStyle=halo;ctx.fillRect(x-7,y-7,14,14);
    for(let i=1;i<12;i++){const q=i/12;ctx.fillStyle=`rgba(189,222,247,${fade*(1-q)*.22})`;ctx.fillRect(x-dx*q,y-dy*q+Math.sin(i*17+t*.002)*q*3,1,1);}
    // A faint, wave-broken echo on the lake.
    ctx.strokeStyle=`rgba(190,223,245,${fade*.065})`;ctx.lineWidth=.7;
    for(let i=0;i<6;i++){const q=i/6,rx=x-dx*q,ry=height*.431+(height*.431-y+dy*q)*.7;ctx.beginPath();ctx.moveTo(rx+Math.sin(t*.002+i)*2,ry);ctx.lineTo(rx-5,ry);ctx.stroke();}
    ctx.restore();
  }
  function drawFireflies(t){
    fireflies=fireflies.filter(f=>t<f.end);
    for(const f of fireflies){
      f.x+=Math.sin(t*.0007+f.phase)*.12;
      f.y+=Math.cos(t*.0005+f.phase)*.08;
      const fade=f.end?Math.max(0,Math.min(1,(f.end-t)/1200)):1;
      const pulse=(.18+.55*Math.max(0,Math.sin(t*.002+f.phase)))*fade;
      ctx.globalAlpha=pulse;
      ctx.drawImage(glowTexture,f.x-15,f.y-15,30,30);
    }
    ctx.globalAlpha=1;
  }
  const FISH_N = 14;
  const spineBuf = Array.from({ length: FISH_N }, () => ({ x: 0, y: 0, w: 0, u: 0 }));
  const leftBuf = Array.from({ length: FISH_N }, () => ({ x: 0, y: 0, nx: 0, ny: 0 }));
  const rightBuf = Array.from({ length: FISH_N }, () => ({ x: 0, y: 0, nx: 0, ny: 0 }));

  const fishImage=document.createElement('canvas'),fishContext=fishImage.getContext('2d');
  const fishSize=128,fishRatio=Math.min(devicePixelRatio||1,coarse.matches?1:1.5);
  fishImage.width=fishImage.height=fishSize*fishRatio;
  function renderSingleFish(ctx,f,t){
    if(!fishContext)return renderFishShape(ctx,f,t);
    fishContext.setTransform(fishRatio,0,0,fishRatio,0,0);
    fishContext.clearRect(0,0,fishSize,fishSize);
    fishContext.globalAlpha=1;fishContext.globalCompositeOperation='source-over';
    renderFishShape(fishContext,{...f,x:fishSize/2,y:fishSize/2},t);
    // Water absorbs contrast and adds moving caustic light over the whole silhouette.
    fishContext.globalCompositeOperation='source-atop';
    fishContext.fillStyle=`rgba(38,100,118,${.12+f.depth*.2})`;
    fishContext.fillRect(0,0,fishSize,fishSize);
    fishContext.strokeStyle=`rgba(176,218,220,${.07*(1-f.depth)})`;fishContext.lineWidth=1.2;
    for(let i=0;i<4;i++){
      const y=(i*32+t*.012)%fishSize;
      fishContext.beginPath();fishContext.moveTo(0,y);fishContext.bezierCurveTo(40,y-11,82,y+13,fishSize,y-5);fishContext.stroke();
    }
    fishContext.globalCompositeOperation='source-over';
    ctx.save();ctx.globalAlpha*=.90-f.depth*.24;
    // Tiny horizontal refraction bands make the water visibly pass above the fish.
    for(let y=0;y<fishSize;y+=4){
      const shift=Math.sin((f.y+y)*.09-t*.0017)*(.25+f.depth*.55);
      ctx.drawImage(fishImage,0,y*fishRatio,fishImage.width,4*fishRatio,f.x-fishSize/2+shift,f.y-fishSize/2+y,fishSize,4);
    }
    ctx.restore();
  }

  function renderFishShape(ctx, f, t) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.heading);

    const waveAmp = f.wid * 0.44 * Math.min(1.8, f.speedMult);

    for (let j = 0; j < FISH_N; j++) {
      const u = j / (FISH_N - 1);
      const x = (0.46 - u) * f.len;
      const y = Math.sin(f.swimPhase - u * 3.5) * (waveAmp * Math.pow(u, 1.85));
      let w = 0;
      // Broad shoulders taper continuously to a narrow caudal peduncle.
      w = f.wid * (0.48 * Math.pow(Math.sin(Math.PI * u), 0.8) * (1 - u * 0.65) + 0.035);
      if(j===0)w=f.wid*.08;
      const s = spineBuf[j];
      s.x = x; s.y = y; s.w = w; s.u = u;
    }

    for (let j = 0; j < FISH_N; j++) {
      const prev = spineBuf[Math.max(0, j - 1)];
      const next = spineBuf[Math.min(FISH_N - 1, j + 1)];
      const tx = next.x - prev.x;
      const ty = next.y - prev.y;
      const len = Math.hypot(tx, ty) || 1;
      const nx = -ty / len;
      const ny = tx / len;
      const sw = spineBuf[j].w;
      const sx = spineBuf[j].x;
      const sy = spineBuf[j].y;

      const lp = leftBuf[j];
      lp.x = sx + nx * sw; lp.y = sy + ny * sw; lp.nx = nx; lp.ny = ny;

      const rp = rightBuf[j];
      rp.x = sx - nx * sw; rp.y = sy - ny * sw; rp.nx = -nx; rp.ny = -ny;
    }

    const depthAlpha = Math.max(0.35, 1.0 - f.depth * 0.42);

    // 1. Soft underwater shadow on the lake bed
    ctx.save();
    ctx.translate(0, 5 + f.depth * 14);
    ctx.fillStyle = `rgba(2, 22, 30, ${(0.22 - f.depth * 0.11) * depthAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, f.len * 0.44, f.wid * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Translucent Pectoral Fins
    const flap = Math.sin(f.swimPhase * 0.8) * 0.24;
    const pecL = leftBuf[3];
    const pecR = rightBuf[3];
    const pecLen = f.len * 0.17;
    const pecWid = f.wid * 0.23;

    // Left pectoral fin
    ctx.save();
    ctx.translate(pecL.x, pecL.y);
    ctx.rotate(Math.atan2(pecL.ny, pecL.nx) + 0.35 + flap);
    const pecGradL = ctx.createLinearGradient(0, 0, pecLen, 0);
    pecGradL.addColorStop(0, `rgba(180, 215, 228, ${0.45 * depthAlpha})`);
    pecGradL.addColorStop(1, `rgba(220, 242, 250, ${0.08 * depthAlpha})`);
    ctx.fillStyle = pecGradL;
    ctx.beginPath();
    ctx.moveTo(0,0);ctx.quadraticCurveTo(pecLen*.5,-pecWid,pecLen,pecWid*.35);ctx.quadraticCurveTo(pecLen*.55,pecWid,0,0);
    ctx.fill();
    ctx.restore();

    // Right pectoral fin
    ctx.save();
    ctx.translate(pecR.x, pecR.y);
    ctx.rotate(Math.atan2(pecR.ny, pecR.nx) - 0.35 - flap);
    const pecGradR = ctx.createLinearGradient(0, 0, pecLen, 0);
    pecGradR.addColorStop(0, `rgba(180, 215, 228, ${0.45 * depthAlpha})`);
    pecGradR.addColorStop(1, `rgba(220, 242, 250, ${0.08 * depthAlpha})`);
    ctx.fillStyle = pecGradR;
    ctx.beginPath();
    ctx.moveTo(0,0);ctx.quadraticCurveTo(pecLen*.5,-pecWid,pecLen,pecWid*.35);ctx.quadraticCurveTo(pecLen*.55,pecWid,0,0);
    ctx.fill();
    ctx.restore();

    // 3. Bifurcated Caudal Fin (Forked Tail)
    const tail = spineBuf[FISH_N - 1];
    const prevTail = spineBuf[FISH_N - 2];
    const tAng = Math.atan2(tail.y - prevTail.y, tail.x - prevTail.x);
    const tailLen = f.len * 0.25;
    const upperX = tail.x + Math.cos(tAng) * tailLen - Math.sin(tAng) * (tailLen * 0.65);
    const upperY = tail.y + Math.sin(tAng) * tailLen + Math.cos(tAng) * (tailLen * 0.65);
    const notchX = tail.x + Math.cos(tAng) * (tailLen * 0.44);
    const notchY = tail.y + Math.sin(tAng) * (tailLen * 0.44);
    const lowerX = tail.x + Math.cos(tAng) * tailLen + Math.sin(tAng) * (tailLen * 0.65);
    const lowerY = tail.y + Math.sin(tAng) * tailLen - Math.cos(tAng) * (tailLen * 0.65);

    const tailGrad = ctx.createLinearGradient(tail.x, tail.y, notchX, notchY);
    tailGrad.addColorStop(0, `rgba(45, 65, 75, ${0.75 * depthAlpha})`);
    tailGrad.addColorStop(0.5, `rgba(90, 125, 140, ${0.48 * depthAlpha})`);
    tailGrad.addColorStop(1, `rgba(160, 205, 220, ${0.18 * depthAlpha})`);

    ctx.fillStyle = tailGrad;
    ctx.beginPath();
    ctx.moveTo(tail.x, tail.y - 1.0);
    ctx.quadraticCurveTo(tail.x - tailLen * 0.32, tail.y - tailLen * 0.38, upperX, upperY);
    ctx.quadraticCurveTo(notchX - 1.5, notchY, notchX, notchY);
    ctx.quadraticCurveTo(notchX - 1.5, notchY, lowerX, lowerY);
    ctx.quadraticCurveTo(tail.x - tailLen * 0.32, tail.y + tailLen * 0.38, tail.x, tail.y + 1.0);
    ctx.closePath();
    ctx.fill();

    // Delicate tail rays
    ctx.strokeStyle = `rgba(200, 230, 242, ${0.28 * depthAlpha})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(tail.x, tail.y); ctx.lineTo(upperX, upperY);
    ctx.moveTo(tail.x, tail.y); ctx.lineTo(notchX, notchY);
    ctx.moveTo(tail.x, tail.y); ctx.lineTo(lowerX, lowerY);
    ctx.stroke();

    // 4. Smooth Organic Fish Body Contour
    ctx.beginPath();
    ctx.moveTo(spineBuf[0].x, spineBuf[0].y);
    for (let j = 0; j < FISH_N - 1; j++) {
      const midX = (leftBuf[j].x + leftBuf[j + 1].x) * 0.5;
      const midY = (leftBuf[j].y + leftBuf[j + 1].y) * 0.5;
      ctx.quadraticCurveTo(leftBuf[j].x, leftBuf[j].y, midX, midY);
    }
    ctx.lineTo(leftBuf[FISH_N - 1].x, leftBuf[FISH_N - 1].y);
    ctx.lineTo(tail.x, tail.y);
    ctx.lineTo(rightBuf[FISH_N - 1].x, rightBuf[FISH_N - 1].y);
    for (let j = FISH_N - 1; j > 0; j--) {
      const midX = (rightBuf[j].x + rightBuf[j - 1].x) * 0.5;
      const midY = (rightBuf[j].y + rightBuf[j - 1].y) * 0.5;
      ctx.quadraticCurveTo(rightBuf[j].x, rightBuf[j].y, midX, midY);
    }
    ctx.lineTo(spineBuf[0].x, spineBuf[0].y);
    ctx.closePath();

    // Body shading: dorsal spine darker, lateral flanks pearlescent silvery-cyan
    const bodyGrad = ctx.createLinearGradient(0, -f.wid * 0.55, 0, f.wid * 0.55);
    if (f.variant === 1) {
      bodyGrad.addColorStop(0, `rgba(88, 108, 114, ${0.82 * depthAlpha})`);
      bodyGrad.addColorStop(0.32, `rgba(48, 56, 44, ${0.92 * depthAlpha})`);
      bodyGrad.addColorStop(0.5, `rgba(32, 40, 36, ${0.98 * depthAlpha})`);
      bodyGrad.addColorStop(0.68, `rgba(48, 56, 44, ${0.92 * depthAlpha})`);
      bodyGrad.addColorStop(1, `rgba(88, 108, 114, ${0.82 * depthAlpha})`);
    } else if (f.variant === 2) {
      bodyGrad.addColorStop(0, `rgba(145, 175, 188, ${0.85 * depthAlpha})`);
      bodyGrad.addColorStop(0.35, `rgba(52, 68, 76, ${0.90 * depthAlpha})`);
      bodyGrad.addColorStop(0.5, `rgba(36, 48, 54, ${0.96 * depthAlpha})`);
      bodyGrad.addColorStop(0.65, `rgba(52, 68, 76, ${0.90 * depthAlpha})`);
      bodyGrad.addColorStop(1, `rgba(145, 175, 188, ${0.85 * depthAlpha})`);
    } else {
      bodyGrad.addColorStop(0, `rgba(95, 125, 138, ${0.85 * depthAlpha})`);
      bodyGrad.addColorStop(0.35, `rgba(42, 54, 60, ${0.92 * depthAlpha})`);
      bodyGrad.addColorStop(0.5, `rgba(28, 38, 44, ${0.98 * depthAlpha})`);
      bodyGrad.addColorStop(0.65, `rgba(42, 54, 60, ${0.92 * depthAlpha})`);
      bodyGrad.addColorStop(1, `rgba(95, 125, 138, ${0.85 * depthAlpha})`);
    }
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Continuous dorsal pigment, shaded into the flanks instead of repeated spots.
    ctx.save();ctx.clip();
    const pigment=ctx.createLinearGradient(f.len*.4,0,-f.len*.45,0);
    pigment.addColorStop(0,'rgba(157,173,152,0)');
    pigment.addColorStop(.3,f.variant===1?`rgba(150,121,61,${depthAlpha*.3})`:`rgba(146,174,177,${depthAlpha*.23})`);
    pigment.addColorStop(1,'rgba(92,135,145,0)');
    ctx.fillStyle=pigment;ctx.fillRect(-f.len,-f.wid,f.len*2,f.wid*2);ctx.restore();
    ctx.strokeStyle=`rgba(15,35,40,${depthAlpha*.65})`;ctx.lineWidth=.7;
    for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(spineBuf[2].x,side*spineBuf[2].w*.7);ctx.quadraticCurveTo(spineBuf[3].x-2,side*spineBuf[3].w*.65,spineBuf[3].x,side*spineBuf[3].w);ctx.stroke();}

    // 5. Subtle Pearlescent Lateral Line / Dorsal Shimmer
    ctx.strokeStyle = `rgba(195, 228, 240, ${0.35 * depthAlpha})`;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(spineBuf[1].x, spineBuf[1].y);
    for (let j = 2; j < FISH_N - 2; j++) {
      ctx.lineTo(spineBuf[j].x, spineBuf[j].y);
    }
    ctx.stroke();

    // 6. Natural Operculum (gill slit) & Eyes
    const eyeStation = 1;
    const eyeL = leftBuf[eyeStation];
    const eyeR = rightBuf[eyeStation];
    ctx.fillStyle = `rgba(18, 28, 34, ${0.92 * depthAlpha})`;
    ctx.beginPath();
    ctx.arc(eyeL.x, eyeL.y, 0.85, 0, Math.PI * 2);
    ctx.arc(eyeR.x, eyeR.y, 0.85, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(215, 240, 248, ${0.65 * depthAlpha})`;
    ctx.beginPath();
    ctx.arc(eyeL.x + 0.2, eyeL.y, 0.35, 0, Math.PI * 2);
    ctx.arc(eyeR.x + 0.2, eyeR.y, 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawFish(t, dt) {
    if (!fishSchool.length) return;
    const leader = fishSchool[0];
    const minY = height * 0.58;
    const maxY = height * 0.88;

    for (let i = 0; i < fishSchool.length; i++) {
      const f = fishSchool[i];
      const baseAngle = f.dir > 0 ? 0 : Math.PI;

      // 1. Steering & school cruising
      if (f.isLeader) {
        if (t > f.burstTimer) {
          f.burstTimer = t + 2800 + Math.random() * 3200;
          f.speedMult = 1.15 + Math.random() * 0.25;
          f.targetDepth = 0.25 + Math.random() * 0.45;
        }
        const wander = Math.sin(t * 0.0012 + f.phase) * 0.22;
        f.targetHeading = baseAngle + wander;
      } else {
        const slotX = leader.x + f.slotX;
        const slotY = leader.y + f.slotY + Math.sin(t * 0.0015 + f.phase) * 6;
        const dx = slotX - f.x;
        const dy = slotY - f.y;
        f.targetHeading = Math.atan2(dy * 1.5, f.dir * 45 + dx * 0.7);
        f.targetDepth = leader.depth + (i % 2 === 1 ? 0.08 : -0.08);
        const lag = (slotX - f.x) * f.dir;
        f.speedMult = Math.max(0.75, Math.min(1.45, 1.0 + lag * 0.012));
      }

      // 2. Lake boundary deflection (instant non-accumulating repulsion)
      let boundaryDeflect = 0;
      if (f.y < minY + 35) {
        boundaryDeflect = ((minY + 35 - f.y) / 35) * 0.55;
      } else if (f.y > maxY - 35) {
        boundaryDeflect = -((f.y - (maxY - 35)) / 35) * 0.55;
      }
      if (f.dir > 0) f.targetHeading += boundaryDeflect;
      else f.targetHeading -= boundaryDeflect;

      // 3. Pointer startle reflex (authentic 2D radial evasion)
      if (pointer) {
        const pdx = f.x - pointer.x;
        const pdy = f.y - pointer.y;
        const pdist = Math.hypot(pdx, pdy);
        const R = 135;
        if (pdist < R) {
          const urgency = 1 - (pdist / R);
          f.startleUntil = t + 750 + urgency * 550;
          f.speedMult = Math.max(f.speedMult, 2.0 + urgency * 1.4);
          f.targetDepth = Math.min(0.88, f.depth + 0.35);

          // Direct 2D evasion vector away from cursor
          let fleeVx = pdx / (pdist || 1);
          let fleeVy = pdy / (pdist || 1);

          // Shore deflection: if near shoreline or bottom, redirect evasion along open water
          if (f.y < minY + 45) {
            fleeVy += ((minY + 45 - f.y) / 45) * 1.4;
          } else if (f.y > maxY - 45) {
            fleeVy -= ((f.y - (maxY - 45)) / 45) * 1.4;
          }

          f.startleAngle = Math.atan2(fleeVy, fleeVx);

          // Startle tail ripple when near water surface
          if (f.depth < 0.40 && t > f.rippleTimer && f.speedMult > 1.6) {
            f.rippleTimer = t + 1200 + Math.random() * 2000;
            const tailX = f.x - Math.cos(f.heading) * (f.len * 0.4);
            const tailY = f.y - Math.sin(f.heading) * (f.len * 0.4);
            dispatchEvent(new CustomEvent('lake:ripple', { detail: { x: tailX, y: tailY, strength: 0.055, audible:false } }));
          }
        }
      }

      const isStartled = t < f.startleUntil;
      if (isStartled) {
        f.targetHeading = f.startleAngle;
      }

      // 4. Smooth agile heading & depth interpolation
      let dH = f.targetHeading - f.heading;
      while (dH > Math.PI) dH -= Math.PI * 2;
      while (dH < -Math.PI) dH += Math.PI * 2;
      const turnRate = isStartled ? 7.5 : 3.8;
      f.heading += dH * Math.min(1, turnRate * dt);

      f.depth += (f.targetDepth - f.depth) * Math.min(1, 1.4 * dt);
      f.depth = Math.max(0.12, Math.min(0.88, f.depth));

      // 5. Forward movement along heading vector
      const speed = Math.max(32, (44 + f.len * 0.28) * f.speedMult * f.pace);
      f.x += Math.cos(f.heading) * speed * dt;
      f.y += Math.sin(f.heading) * speed * dt;

      // Soft shore reflection so fish can never get pinned against boundary
      if (f.y <= minY) {
        f.y = minY;
        if (Math.sin(f.heading) < 0) f.heading = -f.heading;
      } else if (f.y >= maxY) {
        f.y = maxY;
        if (Math.sin(f.heading) > 0) f.heading = -f.heading;
      }

      f.speedMult += (1.0 - f.speedMult) * Math.min(1, 1.8 * dt);
      const beatSpeed = f.tailFreq * Math.max(0.65, f.speedMult);
      f.swimPhase += beatSpeed * dt * Math.PI * 2;

      // A restrained wake follows the tail; deeper fish disturb the surface less.
      if (t > f.rippleTimer) {
        f.rippleTimer = t + (coarse.matches?950:650) + Math.random()*450;
        const tailX=f.x-Math.cos(f.heading)*f.len*.48,tailY=f.y-Math.sin(f.heading)*f.len*.48;
        if(tailX>0&&tailX<width)dispatchEvent(new CustomEvent('lake:ripple',{detail:{x:tailX,y:tailY,strength:(.012+.035*(1-f.depth))*Math.min(1.5,f.speedMult),radius:.007,audible:false}}));
      }

      // 7. Render fish
      ctx.globalAlpha=Math.max(0,Math.min(1,(f.end-t)/1800));
      renderSingleFish(ctx, f, t);ctx.globalAlpha=1;
    }

    // Despawn check
    const allExited = fishSchool.every(f => (f.dir > 0 ? f.x > width + 80 : f.x < -80) || t > f.end);
    if (allExited) {
      fishSchool = [];
      dispatchEvent(new CustomEvent('koi:end'));
      updateMenuState();
    }
  }

  function drawBird(t,dt){
    if(bird&&t>bird.end)bird=null;
  }
  function draw(){
    frame=0;if(document.hidden||reduced.matches||saveData)return;
    const t=now();frame=requestAnimationFrame(draw);if(t-last<14)return;const dt=Math.min(.05,(t-last||16)/1000);last=t;ctx.clearRect(0,0,width,height);
    drawFireworks(t);drawMist(t,dt);drawPetals(t,dt);drawStar(t);drawFireflies(t);drawFish(t,dt);drawBird(t,dt);if(!active()){stop();ctx.clearRect(0,0,width,height);}
  }
  function point(event){pointer={x:event.clientX,y:event.clientY};clearTimeout(point.timer);point.timer=setTimeout(()=>{pointer=null;},400);}
  function weatherChanged(next){
    weather=next;
    if(next==='storm'){
      petals.forEach(p=>{p.end=Math.min(p.end,now()+2000);if(p.floatEnd)p.floatEnd=Math.min(p.floatEnd,now()+2000);});
      fireflies.forEach(f=>{f.end=Math.min(f.end,now()+1500);});
      star=null;
      mist=null;
      // In storm, if birds are flying, gracefully fade them out over 1.5s via CSS opacity transition
      if(bird)dispatchEvent(new CustomEvent('birds:clear'));
    }else if(next==='rain'||next==='snow'){
      petals.forEach(p=>{p.end=Math.min(p.end,now()+2500);if(p.floatEnd)p.floatEnd=Math.min(p.floatEnd,now()+2500);});
      fireflies.forEach(f=>{f.end=Math.min(f.end,now()+1800);});
      star=null;
      // In rain or snow, active birds do NOT vanish midway! They fly naturally across the sky until they exit off-screen.
      // Koi continue swimming naturally below the surface in rain and snow!
    }
    updateMenuState();
  }
  resize();addEventListener('resize',resize,{passive:true});addEventListener('pointermove',point,{passive:true});addEventListener('pointerdown',point,{passive:true});
  addEventListener('lake:scene',event=>{scene=event.detail.key||scene;if(scene==='cosmos')['petals','star','bird'].forEach(clearEffect);updateMenuState();});addEventListener('weather:change',event=>weatherChanged(event.detail.weather));
  addEventListener('life:clear',clearLife);addEventListener('life:spawn',event=>{const spawn=spawners[event.detail?.effect];if(spawn){spawn();start();updateMenuState();}});
  addEventListener('birds:ready',()=>{if(bird)dispatchEvent(new CustomEvent('birds:spawn'));});addEventListener('birds:end',()=>{bird=null;updateMenuState();});
  addEventListener('koi:spawn',spawnKoi);addEventListener('koi:clear',()=>{clearEffect('koi');updateMenuState();});
  addEventListener('koi:end',()=>{fishSchool=[];updateMenuState();});addEventListener('lanterns:end',()=>{lanternsActive=false;updateMenuState();});
  function suspendLife(){lifeClock.pause();stop();clearTimeout(scheduleTimer);pointer=null;}
  function resumeLife(){
    if(document.hidden||reduced.matches||saveData)return;
    lifeClock.resume();stop(); // Discard any stale RAF handle restored from the back-forward cache.
    if(active())start();if(mode==='natural')schedule();
  }
  document.addEventListener('visibilitychange',()=>document.hidden?suspendLife():resumeLife());
  addEventListener('pagehide',suspendLife);addEventListener('pageshow',resumeLife);
  reduced.addEventListener('change',()=>reduced.matches?suspendLife():resumeLife());
  let mode='natural';
  const picker=document.querySelector('.atmosphere-picker');
  const naturalBtn=picker?.querySelector('[data-mode="natural"]');
  const cosmosEffects=new Set(['koi','mist','fireflies','lanterns','fireworks']);
  function updateMenuState(){
    if(naturalBtn){
      naturalBtn.setAttribute('aria-pressed',String(mode==='natural'));
      naturalBtn.classList.toggle('active',mode==='natural');
    }
    picker?.querySelectorAll('[data-effect]').forEach(btn=>{
      const unavailable=scene==='cosmos'&&!cosmosEffects.has(btn.dataset.effect);
      btn.disabled=unavailable;btn.title=unavailable?'Unavailable in Cosmos':'';
      btn.setAttribute('aria-pressed',String(isEffectActive(btn.dataset.effect)));
    });
    picker?.querySelectorAll('[data-weather]').forEach(btn=>{
      const unavailable=scene==='cosmos'&&btn.dataset.weather!=='clear';
      btn.disabled=unavailable;btn.title=unavailable?'Cosmos remains clear':'';
      btn.setAttribute('aria-pressed',String(btn.dataset.weather===weather));
    });

    // Compute active motion load to notify user if multiple heavy layers are running
    let activeScore = fireworks?1.2:0;
    if (weather === 'rain' || weather === 'snow') activeScore += 1.0;
    else if (weather === 'storm') activeScore += 2.0;

    if (petals.length > 0) activeScore += 1.0;
    if (mist !== null) activeScore += 1.0;
    if (fishSchool.length > 0) activeScore += 1.0;
    if (bird !== null) activeScore += 1.2;
    if (lanternsActive) activeScore += 1.4;
    if (fireflies.length > 0) activeScore += 0.8;

    const isHighLoad = activeScore >= 3.6;
    const hint = picker?.querySelector('.atmosphere-perf-hint');
    if (hint) {
      hint.classList.toggle('visible', isHighLoad);
    }
  }
  picker?.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.disabled)return;
    if(button.dataset.mode==='natural'){
      mode='natural';clearLife();
      dispatchEvent(new CustomEvent('weather:mode',{detail:{mode:'natural'}}));
      schedule();updateMenuState();return;
    }
    if(button.dataset.weather){
      mode='custom';clearTimeout(scheduleTimer);
      dispatchEvent(new CustomEvent('weather:set',{detail:{weather:button.dataset.weather}}));
      updateMenuState();return;
    }
    if(button.dataset.effect){
      mode='custom';clearTimeout(scheduleTimer);
      toggleEffect(button.dataset.effect);
      updateMenuState();return;
    }
  });
  document.addEventListener('pointerdown',event=>{if(picker?.open&&!picker.contains(event.target))picker.open=false;},{passive:true});
  if(!reduced.matches&&!saveData){
    if(forced==='all')Object.values(spawners).forEach((spawn,index)=>setTimeout(spawn,index*650));
    else if(spawners[forced])spawners[forced]();
    schedule();
  }
})();
