// Distant activity follows image-space paths, projected exactly like the lake's scenery.
(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(pointer: coarse)');
  const clock=LakeNature.clock(),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  if(!ctx)return;
  canvas.setAttribute('aria-hidden','true');canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1';
  document.querySelector('#water').after(canvas);
  const button=document.querySelector('[data-mountain-life]');
  const routes={
    fuji:{shore:.45,climb:[[.57,.342],[.50,.325],[.54,.304],[.47,.289],[.50,.273],[.44,.254]],lower:[[.12,.432],[.18,.434],[.23,.432],[.29,.437]]},
    yotei:{shore:.52,climb:[[.60,.387],[.54,.360],[.57,.336],[.53,.309],[.55,.283]],lower:[[.36,.427],[.40,.431],[.44,.429],[.48,.434]]},
    alps:{shore:.43,climb:[[.265,.338],[.25,.314],[.29,.295],[.275,.279],[.30,.260]],lower:[[.065,.414],[.11,.419],[.16,.422],[.20,.424]]}
  };
  let key='fuji',winter=document.body.classList.contains('snowing'),weather='clear',enabled=true,w=innerWidth,h=innerHeight,frame=0,last=0,walkers=[];
  function project(x,y){const aspect=w/h,shore=routes[key].shore;return aspect<1?{x:x*w,y:(.431+(y-shore)*aspect/1.78)*h}:{x:(.5+(x-.5)/Math.min(1,aspect/1.78))*w,y:y*.431/shore*h};}
  function pointOn(path,p){
    const lengths=path.slice(1).map((point,i)=>Math.hypot(point[0]-path[i][0],(point[1]-path[i][1])/1.78));
    let distance=p*lengths.reduce((a,b)=>a+b,0);
    for(let i=0;i<lengths.length;i++){
      if(distance<=lengths[i]||i===lengths.length-1){const q=Math.min(1,distance/lengths[i]);return {x:path[i][0]+(path[i+1][0]-path[i][0])*q,y:path[i][1]+(path[i+1][1]-path[i][1])*q,dir:Math.sign(path[i+1][0]-path[i][0])||1};}
      distance-=lengths[i];
    }
  }
  function populate(){
    walkers=[];if(!routes[key])return;
    for(let party=0;party<3;party++){
      const count=mobile.matches?3:4+Math.floor(Math.random()*3),duration=230+Math.random()*110,offset=Math.random(),direction=Math.random()<.25?-1:1;
      for(let i=0;i<count;i++)walkers.push({path:'climb',offset:(offset+i*.016)%1,duration,direction,phase:Math.random()*6.28,color:['#536273','#765d50','#485b59'][party],horse:false});
    }
    for(let i=0;i<(mobile.matches?2:4);i++)walkers.push({path:'lower',offset:.12+i*.045,duration:180,direction:1,phase:Math.random()*6.28,color:'#665b50',horse:i===(mobile.matches?1:2)});
  }
  function available(){const hour=Number(document.querySelector('#daytime')?.value??12);return !!routes[key]&&!winter&&weather!=='storm'&&weather!=='snow'&&hour>6&&hour<19;}
  function stop(){cancelAnimationFrame(frame);frame=0;last=0;ctx.clearRect(0,0,w,h);}
  function sync(){
    const allowed=available();button.disabled=!allowed;button.title=allowed?'Distant walkers and lower-trail horses':'Visible in daylight on clear mountain paths';button.setAttribute('aria-pressed',String(enabled&&allowed));
    dispatchEvent(new CustomEvent('mountain-life:change',{detail:{active:enabled&&allowed}}));
    if(!enabled||!allowed||document.hidden||reduced.matches||navigator.connection?.saveData){stop();return;}
    if(!frame)frame=requestAnimationFrame(draw);
  }
  function figure(x,y,size,horse,phase,dir,color,alpha){
    ctx.save();ctx.translate(x,y);ctx.scale(size*dir,size);ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineWidth=.38;ctx.lineCap='round';
    const step=Math.sin(phase)*.3;
    if(horse){
      ctx.beginPath();ctx.ellipse(0,-.9,.95,.35,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.moveTo(.6,-.9);ctx.lineTo(.94,-1.6);ctx.lineTo(1.3,-1.5);ctx.moveTo(-.8,-.9);ctx.lineTo(-1.25,-.6);ctx.stroke();
      for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*.6,-.8);ctx.lineTo(side*.6+step*side,0);ctx.stroke();}
    }else{
      ctx.beginPath();ctx.arc(0,-1.8,.3,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.moveTo(0,-1.45);ctx.lineTo(.08,-.7);ctx.moveTo(.08,-.7);ctx.lineTo(-.25+step,0);ctx.moveTo(.08,-.7);ctx.lineTo(.3-step,0);ctx.moveTo(0,-1.25);ctx.lineTo(.4+step,-.7);ctx.stroke();
      ctx.fillRect(-.3,-1.45,.3,.5); // Backpack, readable only on the nearer trail.
    }
    ctx.restore();
  }
  function draw(timestamp){
    frame=0;if(!enabled||!available()||document.hidden||reduced.matches)return;
    frame=requestAnimationFrame(draw);if(timestamp-last<40)return;last=timestamp;
    ctx.clearRect(0,0,w,h);const time=clock.now()/1000;
    for(const person of walkers){
      // Shared walking/rest cadence keeps small parties together.
      const cycle=person.duration*.12,walk=cycle*.88,elapsed=Math.floor(time/cycle)*walk+Math.min(time%cycle,walk);
      const p=((person.offset+person.direction*elapsed/person.duration)%1+1)%1;
      const point=pointOn(routes[key][person.path],p),screen=project(point.x,point.y);
      if(screen.x<-8||screen.x>w+8||screen.y<0||screen.y>h*.431)continue;
      const near=person.path==='lower',size=Math.max(.4,Math.min(near?1.7:1.1,w*(near?.00105:.00065)));
      const fade=Math.min(1,p/.035,(1-p)/.035),alpha=(near?.60:.46)*fade;
      figure(screen.x,screen.y,size,person.horse,elapsed*5+person.phase,point.dir*person.direction,person.color,alpha);
    }
  }
  function resize(){w=innerWidth;h=innerHeight;const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);stop();sync();}
  button.addEventListener('click',()=>{enabled=!enabled;sync();});
  addEventListener('lake:scene',event=>{key=event.detail.key;winter=!!event.detail.winter;populate();stop();sync();});
  addEventListener('weather:change',event=>{weather=event.detail.weather;sync();});
  document.querySelector('#daytime').addEventListener('input',sync);
  function suspend(){clock.pause();stop();}
  function resume(){if(document.hidden)return;clock.resume();stop();sync();}
  document.addEventListener('visibilitychange',()=>document.hidden?suspend():resume());
  addEventListener('pagehide',suspend);addEventListener('pageshow',resume);
  reduced.addEventListener('change',()=>reduced.matches?suspend():resume());
  addEventListener('resize',resize);setInterval(sync,1000);
  if(document.hidden||reduced.matches)clock.pause();populate();resize();
})();
