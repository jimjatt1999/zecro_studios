(() => {
  const canvas=document.querySelector('#rain-layer'),ctx=canvas.getContext('2d',{alpha:true});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),saveData=navigator.connection?.saveData;
  let lastImpact=0,impacts=[];
  let particles=[],frame=0,weather='clear',scene='fuji',last=0,timer=0,flashTimer=0;
  const lc=document.createElement('canvas');lc.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:5';if(document.body?.appendChild)document.body.appendChild(lc);else if(document.body?.append)document.body.append(lc);const lx=lc.getContext('2d');let boltSegs=[],boltAlpha=0,boltRaf=0;
  function resize(){const scale=Math.min(devicePixelRatio,1.25);canvas.width=Math.round(innerWidth*scale);canvas.height=Math.round(innerHeight*scale);canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';ctx.setTransform(scale,0,0,scale,0,0);const count=innerWidth<700?38:78;particles=Array.from({length:count},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,l:8+Math.random()*18,s:8+Math.random()*12,a:.12+Math.random()*.24,r:1+Math.random()*2.2,w:Math.random()*6.28,landing:innerHeight*(.56+Math.random()*.4)}));}
  function stop(){impacts=[];cancelAnimationFrame(frame);frame=0;ctx.clearRect(0,0,innerWidth,innerHeight);}
  function draw(now){if(weather==='clear')return;frame=requestAnimationFrame(draw);if(now-last<32)return;const step=last?Math.min(2,(now-last)/33.333):1;last=now;ctx.clearRect(0,0,innerWidth,innerHeight);
    for(const p of particles){if(weather==='snow'){ctx.fillStyle=`rgba(241,248,249,${Math.min(.72,p.a*1.8)})`;ctx.beginPath();ctx.arc(p.x+Math.sin(p.y*.012+p.w)*9,p.y,p.r,0,Math.PI*2);ctx.fill();p.y+=(.35+p.r*.38)*step;p.x+=(Math.sin(now*.00025+p.w)*.2-.08)*step;}else{ctx.lineWidth=.65;ctx.strokeStyle=`rgba(210,231,236,${p.a})`;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-2,p.y+p.l);ctx.stroke();p.y+=p.s*step;p.x-=.7*step;}if(p.y>=p.landing){
      if(now-lastImpact>(weather==='snow'?120:70)){
        lastImpact=now;const x=p.x+(weather==='snow'?Math.sin(p.y*.012+p.w)*9:0);
        dispatchEvent(new CustomEvent('lake:ripple',{detail:{x,y:p.landing,strength:weather==='snow'?.014:.035,radius:weather==='snow'?.004:.006,audible:false}}));
        if(impacts.length<12)impacts.push({x,y:p.landing,birth:now,snow:weather==='snow'});
      }
      p.y=-20;p.x=Math.random()*innerWidth;p.landing=innerHeight*(.56+Math.random()*.4);
    }}
    impacts=impacts.filter(p=>now-p.birth<750);
    for(const p of impacts){const age=(now-p.birth)/750;ctx.strokeStyle=`rgba(219,237,242,${(1-age)*(p.snow?.12:.19)})`;ctx.lineWidth=.6;ctx.beginPath();ctx.ellipse(p.x,p.y,1+age*6,.5+age*1.7,0,0,Math.PI*2);ctx.stroke();}

  }
  let strikeStart=0,strikeX=0,restrike=0,cloudOnly=false;
  function buildSegs(x1,y1,x2,y2,depth,spread,out,weight=1){
    if(depth===0){out.push([x1,y1,x2,y2,weight]);return;}
    const mx=(x1+x2)/2+(Math.random()-.5)*spread,my=(y1+y2)/2+(Math.random()-.5)*spread*.15;
    buildSegs(x1,y1,mx,my,depth-1,spread*.53,out,weight);
    buildSegs(mx,my,x2,y2,depth-1,spread*.53,out,weight*.97);
    if(depth>3&&Math.random()<.48){
      const bx=mx+(Math.random()-.5)*spread*1.4,by=Math.min(innerHeight*.34,my+(y2-my)*(.3+Math.random()*.6));
      buildSegs(mx,my,bx,by,depth-2,spread*.4,out,weight*.38);
    }
  }
  function drawBoltLayer(segs,width,style,blur,color){lx.strokeStyle=style;lx.shadowBlur=blur;lx.shadowColor=color;for(const[ax,ay,bx,by,weight]of segs){lx.lineWidth=Math.max(.25,width*weight);lx.beginPath();lx.moveTo(ax,ay);lx.lineTo(bx,by);lx.stroke();}}
  function renderBolt(alpha,progress=1){
    const sc=Math.min(devicePixelRatio||1,1.5),w=Math.round(innerWidth*sc),h=Math.round(innerHeight*sc);
    if(lc.width!==w||lc.height!==h){lc.width=w;lc.height=h;}
    lx.setTransform(sc,0,0,sc,0,0);lx.clearRect(0,0,innerWidth,innerHeight);lx.save();
    lx.globalAlpha=alpha;lx.globalCompositeOperation='lighter';
    const glow=lx.createRadialGradient(strikeX,innerHeight*.07,0,strikeX,innerHeight*.07,innerWidth*.35);
    glow.addColorStop(0,'rgba(184,205,255,.19)');glow.addColorStop(.4,'rgba(135,162,226,.065)');glow.addColorStop(1,'rgba(120,151,215,0)');
    lx.fillStyle=glow;lx.fillRect(0,0,innerWidth,innerHeight*.4);
    if(!cloudOnly){
      // Reveal the faint leader first; return strokes reuse the exact channel.
      const visible=boltSegs.filter(seg=>seg[1]<innerHeight*.34*progress);
      lx.lineCap='round';
      drawBoltLayer(visible,4,'rgba(143,176,255,.18)',16,'rgba(125,163,255,.6)');
      drawBoltLayer(visible,1.8,'rgba(199,218,255,.6)',5,'rgba(184,208,255,.75)');
      drawBoltLayer(visible,.75,'rgba(252,251,255,.98)',0,'transparent');
      lx.shadowBlur=0;
      const reflection=lx.createRadialGradient(strikeX,innerHeight*.61,0,strikeX,innerHeight*.61,innerHeight*.25);
      reflection.addColorStop(0,'rgba(174,204,255,.07)');reflection.addColorStop(1,'rgba(174,204,255,0)');
      lx.fillStyle=reflection;lx.fillRect(0,innerHeight*.431,innerWidth,innerHeight*.569);
    }
    lx.restore();
  }
  function fadeBolt(time){
    if(weather!=='storm'||document.hidden||reduced.matches){lx.clearRect(0,0,lc.width,lc.height);boltRaf=0;return;}
    const age=time-strikeStart;
    if(age>850){lx.clearRect(0,0,lc.width,lc.height);boltRaf=0;return;}
    const first=age<65?.12:Math.exp(-(age-65)/65);
    const second=restrike&&age>restrike?.48*Math.exp(-(age-restrike)/85):0;
    renderBolt(Math.min(1,first+second),Math.min(1,age/65));
    boltRaf=requestAnimationFrame(fadeBolt);
  }
  function strikeBolt(){
    strikeX=innerWidth*(.2+Math.random()*.6);cloudOnly=Math.random()<.28;
    boltSegs=[];buildSegs(strikeX,-10,strikeX+(Math.random()-.5)*innerWidth*.2,innerHeight*(.24+Math.random()*.09),7,innerWidth*.17,boltSegs);
    cancelAnimationFrame(boltRaf);strikeStart=performance.now();restrike=Math.random()<.45?220+Math.random()*130:0;
    boltRaf=requestAnimationFrame(fadeBolt);
  }
  function flash(){if(weather!=='storm'||document.hidden||reduced.matches)return;strikeBolt();flashTimer=setTimeout(flash,6500+Math.random()*12000);}
  function setWeather(next){weather=next;document.body.classList.toggle('raining',next==='rain'||next==='storm');document.body.classList.toggle('snowing',next==='snow');dispatchEvent(new CustomEvent('weather:rain',{detail:{raining:next==='rain'||next==='storm'}}));dispatchEvent(new CustomEvent('weather:change',{detail:{weather:next}}));clearTimeout(flashTimer);document.body.classList.remove('lightning');if(next==='storm'&&!reduced.matches)flashTimer=setTimeout(flash,900+Math.random()*2400);stop();if(next!=='clear'&&!reduced.matches&&!saveData){last=0;frame=requestAnimationFrame(draw);}}
  function chooseWeather(){
    if(scene==='cosmos')return 'clear';
    const hour=Number(document.querySelector('#daytime')?.value||12),night=hour<6||hour>20;
    const snowChance=scene==='yotei'?.045:scene==='alps'?.025:.01;
    const roll=Math.random(),stormChance=night?.045:.025,rainChance=night?.36:.30;
    if(roll<stormChance)return 'storm';
    if(roll<stormChance+rainChance)return 'rain';
    if(roll<stormChance+rainChance+snowChance)return 'snow';
    return 'clear';
  }
  function schedule(){clearTimeout(timer);const active=weather!=='clear';timer=setTimeout(()=>{setWeather(active?'clear':chooseWeather());schedule();},active?15000+Math.random()*22000:20000+Math.random()*36000);}
  resize();addEventListener('resize',resize);addEventListener('lake:scene',event=>{scene=event.detail.key||scene;if(scene==='cosmos'&&weather!=='clear')setWeather('clear');});addEventListener('weather:set',event=>{const next=event.detail?.weather;if(['clear','rain','snow','storm'].includes(next)&&!(scene==='cosmos'&&next!=='clear')){clearTimeout(timer);setWeather(next);}});addEventListener('weather:mode',event=>{if(event.detail?.mode==='natural'){setWeather(chooseWeather());schedule();}else{clearTimeout(timer);}});document.addEventListener('visibilitychange',()=>{stop();clearTimeout(flashTimer);document.body.classList.remove('lightning');if(!document.hidden&&weather!=='clear'&&!reduced.matches&&!saveData){last=0;frame=requestAnimationFrame(draw);if(weather==='storm')flashTimer=setTimeout(flash,4000);}});
  reduced.addEventListener('change',()=>{stop();clearTimeout(flashTimer);document.body.classList.remove('lightning');if(!reduced.matches&&!saveData&&weather!=='clear'&&!document.hidden){last=0;frame=requestAnimationFrame(draw);if(weather==='storm')flashTimer=setTimeout(flash,4000);}});
  if(!reduced.matches&&!saveData){const params=new URLSearchParams(location.search),forced=params.get('weather')||(params.get('rain')==='1'?'rain':'');setWeather(['rain','snow','storm'].includes(forced)?forced:'clear');if(!forced)schedule();}
})();
