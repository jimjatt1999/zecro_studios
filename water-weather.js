(() => {
  const canvas=document.querySelector('#rain-layer'),ctx=canvas.getContext('2d',{alpha:true});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),saveData=navigator.connection?.saveData;
  let particles=[],frame=0,weather='clear',scene='fuji',last=0,timer=0,flashTimer=0;
  function resize(){const scale=Math.min(devicePixelRatio,1.25);canvas.width=Math.round(innerWidth*scale);canvas.height=Math.round(innerHeight*scale);canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';ctx.setTransform(scale,0,0,scale,0,0);const count=innerWidth<700?38:78;particles=Array.from({length:count},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,l:8+Math.random()*18,s:8+Math.random()*12,a:.12+Math.random()*.24,r:1+Math.random()*2.2,w:Math.random()*6.28}));}
  function stop(){cancelAnimationFrame(frame);frame=0;ctx.clearRect(0,0,innerWidth,innerHeight);}
  function draw(now){if(weather==='clear')return;frame=requestAnimationFrame(draw);if(now-last<32)return;last=now;ctx.clearRect(0,0,innerWidth,innerHeight);
    for(const p of particles){if(weather==='snow'){ctx.fillStyle=`rgba(241,248,249,${Math.min(.72,p.a*1.8)})`;ctx.beginPath();ctx.arc(p.x+Math.sin(p.y*.012+p.w)*9,p.y,p.r,0,Math.PI*2);ctx.fill();p.y+=.7+p.s*.08;p.x-=.08;}else{ctx.lineWidth=.65;ctx.strokeStyle=`rgba(210,231,236,${p.a})`;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-2,p.y+p.l);ctx.stroke();p.y+=p.s;p.x-=.7;}if(p.y>innerHeight+20){p.y=-20;p.x=Math.random()*innerWidth;}}
  }
  function flash(){if(weather!=='storm')return;document.body.classList.remove('lightning');requestAnimationFrame(()=>document.body.classList.add('lightning'));setTimeout(()=>document.body.classList.remove('lightning'),720);flashTimer=setTimeout(flash,3500+Math.random()*9000);}
  function setWeather(next){weather=next;document.body.classList.toggle('raining',next==='rain'||next==='storm');document.body.classList.toggle('snowing',next==='snow');dispatchEvent(new CustomEvent('weather:rain',{detail:{raining:next==='rain'||next==='storm'}}));dispatchEvent(new CustomEvent('weather:change',{detail:{weather:next}}));clearTimeout(flashTimer);document.body.classList.remove('lightning');if(next==='storm')flashTimer=setTimeout(flash,900+Math.random()*2400);stop();if(next!=='clear'&&!reduced.matches&&!saveData){last=0;frame=requestAnimationFrame(draw);}}
  function chooseWeather(){
    const hour=Number(document.querySelector('#daytime')?.value||12),night=hour<6||hour>20;
    const snowChance=scene==='yotei'?.045:scene==='alps'?.025:.01;
    const roll=Math.random(),stormChance=night?.045:.025,rainChance=night?.36:.30;
    if(roll<stormChance)return 'storm';
    if(roll<stormChance+rainChance)return 'rain';
    if(roll<stormChance+rainChance+snowChance)return 'snow';
    return 'clear';
  }
  function schedule(){clearTimeout(timer);const active=weather!=='clear';timer=setTimeout(()=>{setWeather(active?'clear':chooseWeather());schedule();},active?15000+Math.random()*22000:20000+Math.random()*36000);}
  resize();addEventListener('resize',resize);addEventListener('lake:scene',event=>{scene=event.detail.key||scene;});addEventListener('weather:set',event=>{const next=event.detail?.weather;if(['clear','rain','snow','storm'].includes(next)){clearTimeout(timer);setWeather(next);}});addEventListener('weather:mode',event=>{if(event.detail?.mode==='natural'){setWeather(chooseWeather());schedule();}else{clearTimeout(timer);}});document.addEventListener('visibilitychange',()=>document.hidden?stop():(weather!=='clear'&&(frame=requestAnimationFrame(draw))));
  if(!reduced.matches&&!saveData){const params=new URLSearchParams(location.search),forced=params.get('weather')||(params.get('rain')==='1'?'rain':'');setWeather(['rain','snow','storm'].includes(forced)?forced:'clear');if(!forced)schedule();}
})();
