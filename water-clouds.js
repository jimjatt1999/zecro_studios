(() => {
  'use strict';
  const canvas=document.querySelector('#cloud-layer');
  if(!canvas)return;
  const ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const coarse=matchMedia('(pointer: coarse)');
  const saveData=navigator.connection?.saveData;
  const image=new Image();
  const crops=[
    [32,12,345,332],
    [355,10,600,360],
    [25,350,425,345],
    [445,360,540,380]
  ];
  let clouds=[],frame=0,last=0,width=innerWidth,height=innerHeight,pointer=null;

  function makeCloud(index){
    const mobile=width<700;
    const scale=mobile?[.76,.92,1.08][index%3]:[.48,.62,.78,1.02][index%4];
    return {
      crop:crops[index%crops.length],
      x:(index/(mobile?3:4))*width-width*.22+Math.random()*width*.14,
      y:height*([.02,.12,.22,.06][index%4]),w:width*scale,
      speed:(mobile?2.1:2.8)+index*.55,alpha:[.13,.10,.075,.055][index%4],
      dx:0,dy:0,vx:0,vy:0,phase:Math.random()*Math.PI*2
    };
  }
  function resize(){
    width=innerWidth;height=innerHeight;
    const ratio=Math.min(devicePixelRatio||1,coarse.matches?1:1.25);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    canvas.style.width=width+'px';canvas.style.height=height+'px';
    ctx.setTransform(ratio,0,0,ratio,0,0);
    clouds=Array.from({length:coarse.matches?3:4},(_,index)=>makeCloud(index));
    draw(performance.now(),true);
  }
  function daylight(){
    const hour=Number(document.querySelector('#daytime')?.value||12);
    return .34+.66*Math.max(0,Math.sin((hour-6)/24*Math.PI*2));
  }
  function react(cloud){
    if(!pointer||pointer.y>height*.58)return;
    const cx=cloud.x+cloud.dx+cloud.w*.5,cy=cloud.y+cloud.dy+cloud.w*.22;
    const rx=cloud.w*.55,ry=cloud.w*.23;
    const nx=(cx-pointer.x)/rx,ny=(cy-pointer.y)/ry,distance=nx*nx+ny*ny;
    if(distance<1){const force=(1-distance)*.42;cloud.vx+=nx*force;cloud.vy+=ny*force*.65;}
  }
  function paint(now){
    ctx.clearRect(0,0,width,height);
    const light=daylight(),weather=document.body.classList.contains('raining')?1.24:1;
    clouds.forEach((cloud,index)=>{
      const [sx,sy,sw,sh]=cloud.crop;
      react(cloud);
      cloud.vx+=-cloud.dx*.00045;cloud.vy+=-cloud.dy*.0007;
      cloud.vx*=.935;cloud.vy*=.92;cloud.dx+=cloud.vx;cloud.dy+=cloud.vy;
      cloud.x+=cloud.speed/30;
      const drawnHeight=cloud.w*(sh/sw);
      if(cloud.x+cloud.dx>width+cloud.w*.15)cloud.x=-cloud.w-cloud.dx;
      ctx.globalAlpha=cloud.alpha*light*weather;
      const breathe=Math.sin(now*.00016+cloud.phase)*height*.005;
      ctx.drawImage(image,sx,sy,sw,sh,cloud.x+cloud.dx,cloud.y+cloud.dy+breathe,cloud.w,drawnHeight);
      if(index===0&&cloud.x>0){
        ctx.globalAlpha=cloud.alpha*light*weather*.7;
        ctx.drawImage(image,sx,sy,sw,sh,cloud.x+cloud.dx-cloud.w-width*.15,cloud.y+cloud.dy+breathe,cloud.w,drawnHeight);
      }
    });
    ctx.globalAlpha=1;
  }
  function draw(now,once=false){
    if(!once)frame=requestAnimationFrame(draw);
    if(!image.complete||!image.naturalWidth||(!once&&now-last<33))return;
    last=now;paint(now);
  }
  function start(){if(!frame&&!document.hidden&&!reduced.matches&&!saveData)frame=requestAnimationFrame(draw);}
  function stop(){cancelAnimationFrame(frame);frame=0;}
  function point(event){pointer={x:event.clientX,y:event.clientY};clearTimeout(point.timer);point.timer=setTimeout(()=>{pointer=null;},160);}
  image.onload=()=>{resize();start();};
  image.src='assets/clouds-transparent.png';
  addEventListener('resize',resize,{passive:true});
  addEventListener('pointermove',point,{passive:true});
  addEventListener('pointerdown',point,{passive:true});
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  reduced.addEventListener('change',()=>{stop();if(reduced.matches)paint(performance.now());else start();});
})();
