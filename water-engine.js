/* Original renderer: GPU heightfield, refraction, and reflected landscape. */
(() => {
  'use strict';
  const canvas = document.querySelector('#water');
  const notice = document.querySelector('#notice');
  const motion = document.createElement('button');
  const stats = document.createElement('output');
  const verify = document.createElement('button');
  const testResult = document.createElement('output');
  const slider = document.querySelector('#daytime');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(pointer: coarse)').matches;
  const N = mobile ? 192 : 256;
  const budget = mobile ? 1600000 : 4200000;
  let paused = reduced.matches, ready = false, handle = 0, time = 0;
  let last = 0, accumulator = 0, frames = 0, steps = 0, measuredAt = 0;
  let fps = 0, quality = 1, slowWindows = 0, activeUntil = 0, drops = [];
  let day = 12, state = 0, verification = false, liveTime = true, sceneShore = .45, sceneType = 1, cosmosDayReady = false;
  let wind = 0.55, windTarget = 0.55;
  // Cloud travel is continuous, independent of both the clock hour and water physics.
  let cloudTime=0,cloudSpeed=1,cloudBoost=1,lastCloudInput=-Infinity;
  function accelerateClouds(previousHour,nextHour,now){
    if(reduced.matches||paused)return;
    const distance=Math.abs(nextHour-previousHour);
    if(distance<.001)return;
    cloudBoost=Math.min(32,8+distance*12);
    lastCloudInput=now;
  }
  function advanceClouds(dt,now){
    if(reduced.matches||paused){cloudSpeed=1;cloudBoost=1;return;}
    const scrubbing=now-lastCloudInput<220;
    const target=scrubbing?cloudBoost:1;
    cloudSpeed+=(target-cloudSpeed)*(1-Math.exp(-dt*(scrubbing?9:1.8)));
    cloudTime+=dt*cloudSpeed*(.7+wind);
  }
  let redrawClock = () => {};
  const tokyoClock = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  function updateClock(){
    if(liveTime){const parts=Object.fromEntries(tokyoClock.formatToParts(new Date()).map(p=>[p.type,p.value]));day=Number(parts.hour)+Number(parts.minute)/60+Number(parts.second)/3600;slider.value=String(day);}
    const minutes=Math.floor(day*60)%1440;
    document.querySelector('#clock').textContent=`${Math.floor(minutes/60)%12||12}:${String(minutes%60).padStart(2,'0')} ${minutes<720?'AM':'PM'}`;
    document.querySelector('#time-mode').textContent=liveTime?'Tokyo · Live':'Exploring';
    document.querySelector('.time-control').classList.toggle('manual',!liveTime);
    redrawClock();
  }
  slider.addEventListener('input',()=>{liveTime=false;const next=Number(slider.value);accelerateClouds(day,next,performance.now());day=next;updateClock();});
  document.querySelector('#live-time').onclick=()=>{liveTime=true;updateClock();};
  document.querySelector('#close-time').onclick=()=>{document.querySelector('.time-control').open=false;};
  updateClock();setInterval(()=>{if(!document.hidden&&liveTime)updateClock();},1000);
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  const fail = error => {
    ready = false; cancelAnimationFrame(handle); canvas.style.opacity = 0;
    notice.textContent = 'Water renderer unavailable. Showing a still image. ' + error;
    stats.textContent = 'Renderer failed'; motion.disabled = true;
    verify.disabled = true;
  };
  if (!gl) { fail('This browser needs WebGL 2.'); return; }
  try {
    const vertex = `#version 300 es
      precision highp float;
      out vec2 uv;
      void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
    function program(fragment) {
      const p = gl.createProgram();
      for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, '#version 300 es\nprecision highp float;\nin vec2 uv;out vec4 color;\n' + fragment]]) {
        const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));
        gl.attachShader(p, s); gl.deleteShader(s);
      }
      gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(p));
      return { p, u: name => gl.getUniformLocation(p, name) };
    }
    // Two signed 16-bit channels packed into RGBA8. No float-target extension required.
    const packing = `
      vec2 unpackState(vec4 t){vec4 b=floor(t*255.+.5);return vec2(b.r*256.+b.g,b.b*256.+b.a)/65535.*2.-1.;}
      vec4 packState(vec2 v){vec2 q=floor(clamp(v*.5+.5,0.,1.)*65535.+.5);return vec4(floor(q.x/256.),mod(q.x,256.),floor(q.y/256.),mod(q.y,256.))/255.;}
      uniform sampler2D waves;
      float heightAt(vec2 p){return unpackState(texture(waves,clamp(p,vec2(0.),vec2(1.)))).x;}
    `;
    const simulation = program(packing + `
      uniform float cell;uniform vec4 drop;
      void main(){
        vec2 v=unpackState(texture(waves,uv));
        float lap=heightAt(uv+vec2(cell,0.))+heightAt(uv-vec2(cell,0.))+heightAt(uv+vec2(0.,cell))+heightAt(uv-vec2(0.,cell))-4.*v.x;
        v.y=(v.y+lap*.23)*.992;v.x+=v.y;
        float edge=min(min(uv.x,uv.y),min(1.-uv.x,1.-uv.y));v*=mix(.80,1.,smoothstep(0.,.065,edge));
        float d=length(uv-drop.xy)/max(drop.z,.001);
        v.x+=drop.w*exp(-d*d*3.);
        color=packState(v);
      }`);
    const render = program(packing + `
      float smoothHeight(vec2 p){
        vec2 size=vec2(textureSize(waves,0));vec2 grid=p*size-.5;
        vec2 base=(floor(grid)+.5)/size;vec2 f=fract(grid);vec2 d=1./size;
        return mix(mix(heightAt(base),heightAt(base+vec2(d.x,0.)),f.x),mix(heightAt(base+vec2(0.,d.y)),heightAt(base+d),f.x),f.y);
      }
      uniform sampler2D landscape,dayLandscape;uniform vec2 resolution;uniform float seconds,cloudSeconds,hour,cell,shore,sceneType,wind,cosmosBlend,mountainLife;
      const float PI=3.14159265;
      float cloudNoise(vec2 p){
        vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        vec3 k=vec3(127.1,311.7,43758.5453);
        return mix(mix(fract(sin(dot(i,k.xy))*k.z),fract(sin(dot(i+vec2(1,0),k.xy))*k.z),f.x),mix(fract(sin(dot(i+vec2(0,1),k.xy))*k.z),fract(sin(dot(i+vec2(1),k.xy))*k.z),f.x),f.y);
      }
      vec3 sceneAt(vec2 st){
        vec3 c=texture(landscape,st).rgb;
        if(sceneType>2.5)c=mix(c,texture(dayLandscape,st).rgb,cosmosBlend);
        return c;
      }
      vec3 starLayer(vec3 background,vec2 st){
        float night=sceneType>2.5?1.-cosmosBlend:1.-smoothstep(-.18,.06,sin((hour-6.)*PI/12.));
        if(night<.001||st.y>.13)return background;
        vec2 p=st*vec2(130.,75.),cellId=floor(p);
        float seed=fract(sin(dot(cellId,vec2(127.1,311.7)))*43758.5453);
        if(seed<.973)return background;
        vec2 center=vec2(fract(seed*173.),fract(seed*319.))*.6+.2;
        float radius=max(.10+fract(seed*51.)*.045,fwidth(p.x)*.85);
        float disc=1.-smoothstep(0.,radius,length(fract(p)-center));
        // Independent slow shimmer and a faint faster flutter; stars never blink off.
        float pulse=.68+.22*sin(seconds*(.4+fract(seed*37.)*.7)+seed*83.)
          +.10*sin(seconds*(1.7+fract(seed*91.)*1.3)+seed*149.);
        float edge=1.-smoothstep(.08,.13,st.y);
        vec3 tint=mix(vec3(.72,.84,1.),vec3(1.,.91,.75),fract(seed*63.));
        // Compensate for the landscape's night exposure so stellar light stays visible.
        vec3 exposure=sceneType>2.5?vec3(1.):mix(vec3(1.),vec3(.22,.32,.48),night);
        return background+tint/exposure*disc*pulse*night*edge*.95;
      }
      vec3 cloudLayer(vec3 background,vec2 st){
        background=starLayer(background,st);
        // Procedural clouds have no image edges and continue into the fitted mobile sky.
        // Keep their lower edge above the photographed mountain silhouettes.
        if(sceneType>2.5||st.y>=.20)return background;
        vec2 p=st*vec2(4.8,14.)-vec2(cloudSeconds*.024,0.);
        float broad=cloudNoise(p+vec2(0.,sin(cloudSeconds*.018)*.18));
        float detail=cloudNoise(p*2.03+vec2(cloudSeconds*.008,-cloudSeconds*.006));
        float fine=cloudNoise(p*4.07-vec2(cloudSeconds*.012,0.));
        float density=broad*.58+detail*.29+fine*.13;
        float weatherCover=clamp((wind-.55)*.07,-.02,.07);
        float body=smoothstep(.40-weatherCover,.70,density);
        float skyMask=1.-smoothstep(.12,.20,st.y);
        float light=smoothstep(.28,.75,broad*.65+detail*.35);
        vec3 cloudColor=mix(vec3(.53,.63,.73),vec3(.94,.96,.97),light);
        return mix(background,cloudColor,body*skyMask*.65);
      }
      // Bend crowns around fixed roots. Each stand has its own phase, while
      // a slower traveling gust connects the motion across the forest.
      float treeSway(vec2 st){
        // Keep the landscape completely stable behind distant walkers.
        if(sceneType>2.5||mountainLife>.5)return 0.;
        float fromCenter=abs(st.x-.5)*2.;
        float top=.365;
        float base=shore-.012;
        float horizontal=1.;
        if(sceneType<.5){
          // Yotei: taller foreground trees wrap around both sides of the lake.
          top=mix(.425,.355,smoothstep(.58,1.,fromCenter));
        }else if(sceneType>1.5){
          // Alps: the visible conifers live on the outer banks, not the valley.
          top=mix(.405,.315,smoothstep(.55,1.,fromCenter));
          horizontal=smoothstep(.48,.70,fromCenter);
        }
        float crown=smoothstep(top-.025,top+.008,st.y);
        float grounded=1.-smoothstep(base-.045,base,st.y);
        float height=1.-smoothstep(top,base,st.y);
        vec3 source=texture(landscape,clamp(st,vec2(.002),vec2(.998))).rgb;
        float luminance=dot(source,vec3(.2126,.7152,.0722));
        float green=source.g-max(source.r,source.b);
        float vegetation=max(smoothstep(.005,.075,green),(1.-smoothstep(.12,.34,luminance))*.72);
        return crown*grounded*height*horizontal*vegetation;
      }
      // Image-space shoreline: preserve the mountain's proportions above the water.
      vec3 landscapeAt(vec2 st){
        // Continue the sky softly above the fitted photograph, without stretching stars.
        if(st.y<.002){
          vec3 edge=sceneAt(vec2(clamp(st.x,.002,.998),.002));
          vec3 zenith=sceneAt(vec2(.5,.002));
          return cloudLayer(mix(edge,zenith,1.-exp(min(0.,st.y)*14.)),st);
        }
        st=clamp(st,vec2(.002),vec2(.998,shore-.002));
        float trees=treeSway(st);
        if(trees<.001||wind<.001)return cloudLayer(sceneAt(st),st);
        float gust=.75+.30*sin(st.x*9.-seconds*.7)+.22*sin(seconds*.31+st.x*4.);
        float stand=st.x*180.;
        float phase=sin(floor(stand)*12.9898)*4.;
        float nextPhase=sin((floor(stand)+1.)*12.9898)*4.;
        phase=mix(phase,nextPhase,smoothstep(0.,1.,fract(stand)));
        float bend=sin(seconds*1.05+phase)*.68+sin(seconds*.43+phase*.7)*.28;
        float flutter=sin(seconds*3.2+st.x*310.+st.y*85.)*.16;
        // A few pixels of crown travel, not a translation of the whole image.
        st.x+=(bend*gust+flutter)*.0045*trees*wind;
        st.y+=sin(seconds*2.1+phase)*.00028*trees*wind*gust;
        return cloudLayer(sceneAt(st),st);
      }
      vec2 sceneUV(vec2 screen){
        float aspect=resolution.x/resolution.y;
        if(aspect<1.)return vec2(screen.x,shore+(screen.y-.431)*1.78/aspect);
        return vec2((screen.x-.5)*min(1.,aspect/1.78)+.5,screen.y*shore/.431);
      }
      vec3 lighting(vec3 c){
        // Cosmos remains a deep-space scene as the shared Tokyo clock changes.
        if(sceneType>2.5)return c;
        float sun=sin((hour-6.)*PI/12.);
        float daylight=smoothstep(-.15,.3,sun);
        float dusk=exp(-pow(sun/.24,2.));
        return c*mix(vec3(.22,.32,.48),vec3(1.),daylight)*mix(vec3(1.),vec3(1.25,.69,.40),dusk*.65);
      }
      vec3 sky(vec3 r){
        float aspect=resolution.x/resolution.y;
        vec2 st=vec2(.5+r.x/max(r.z,.15)/(1.3*aspect),.43-r.y/max(r.z,.15)/1.35);
        st=sceneUV(st);
        vec3 image=landscapeAt(st);
        if(sceneType>2.5)return image;
        vec3 highSky=mix(vec3(.48,.67,.8),vec3(.19,.42,.64),clamp(r.y,0.,1.));
        return lighting(mix(image,highSky,smoothstep(.55,1.,r.y)));
      }
      vec2 slope(vec2 p){
        // Traveling waves supply continuous breeze; the grid supplies interacting splashes.
        vec2 s=vec2(0.);
        float swell=sin(dot(p,vec2(.31,.24))-seconds*.35);
        float phase=dot(p,vec2(.12,.99))*7.2-seconds*1.7+swell*.65;
        s+=vec2(.12,.99)*.038*cos(phase)/(1.+fwidth(phase));
        phase=dot(p,vec2(.72,.69))*12.3-seconds*2.3+swell;
        s+=vec2(.72,.69)*.026*cos(phase)/(1.+fwidth(phase));
        phase=dot(p,vec2(-.8,.6))*20.-seconds*3.1;
        s+=vec2(-.8,.6)*.016*cos(phase)/(1.+fwidth(phase));
        phase=dot(p,vec2(.9,.2))*33.-seconds*4.;
        s+=vec2(.9,.2)*.009*cos(phase)/(1.+fwidth(phase));
        vec2 q=(p-vec2(-20.,-4.))/40.;
        if(all(greaterThan(q,vec2(cell)))&&all(lessThan(q,vec2(1.-cell)))){
          s+=vec2(smoothHeight(q+vec2(cell,0.))-smoothHeight(q-vec2(cell,0.)),smoothHeight(q+vec2(0.,cell))-smoothHeight(q-vec2(0.,cell)))/(80.*cell);
        }
        return s;
      }
      void main(){
        vec2 screen=vec2(uv.x,1.-uv.y);float aspect=resolution.x/resolution.y;
        vec3 ray=normalize(vec3((screen.x-.5)*1.3*aspect,(.43-screen.y)*1.35,1.));
        if(screen.y<=.431){
          vec2 st=sceneUV(screen);
          color=vec4(lighting(landscapeAt(st)),1.);return;
        }
        vec3 eye=vec3(0.,1.6,-3.);
        vec3 point=eye+ray*(-eye.y/ray.y);
        vec2 gradient=slope(point.xz);
        vec3 normal=normalize(vec3(-gradient.x,1.,-gradient.y));
        vec3 reflected=reflect(ray,normal);
        vec3 reflection=sky(reflected);
        // Keep snowy peaks reflected, but absorb their sharp whites into the lake.
        reflection=min(reflection,vec3(.46,.57,.61));
        reflection=mix(reflection,vec3(.035,.20,.23),.24);
        float fresnel=.02037+.97963*pow(1.-max(dot(-ray,normal),0.),5.);
        vec3 transmitted=refract(ray,normal,1./1.333);
        float depth=1.4+min(point.z*.045,3.);
        vec2 bed=point.xz+transmitted.xz*(depth/max(.2,-transmitted.y));
        vec2 st=vec2(.5+.47*sin(bed.x*.095),.86+.125*sin(bed.y*.13));
        vec3 stones=texture(landscape,st).rgb;
        vec3 absorption=exp(-vec3(.32,.11,.065)*depth);
        vec3 water=lighting(stones*absorption+vec3(.018,.12,.14)*(1.-absorption));
        float elevation=sin((hour-6.)*PI/12.);
        vec3 sun=normalize(vec3(cos((hour-6.)*PI/12.)*.7,max(.08,elevation),.8));
        float glint=pow(max(dot(reflected,sun),0.),260.)*smoothstep(-.03,.12,elevation);
        vec3 tint=mix(vec3(1.,.48,.2),vec3(1.,.96,.86),smoothstep(0.,.65,elevation));
        vec3 result=mix(water,reflection,clamp(fresnel+.025,0.,.82))+tint*glint*.42;
        float distanceFade=smoothstep(35.,190.,point.z);
        result=mix(result,lighting(landscapeAt(vec2((screen.x-.5)*min(1.,aspect/1.78)+.5,shore-.002))),distanceFade);
        color=vec4(result,1.);
      }`);
    const makeTarget = () => {
      const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, N, N);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const framebuffer = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw Error('Wave framebuffer is incomplete.');
      gl.clearColor(128/255, 0, 128/255, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      return { texture, framebuffer };
    };
    const targets = [makeTarget(), makeTarget()];
    gl.disable(gl.DITHER);
    const photo = gl.createTexture(),dayPhoto=gl.createTexture();
    function bind(texture, unit) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, texture); }
    bind(dayPhoto,2);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,1,1,0,gl.RGB,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0]));
    const simU = Object.fromEntries(['waves','cell','drop'].map(k => [k,simulation.u(k)]));
    const drawU = Object.fromEntries(['waves','landscape','dayLandscape','cell','seconds','cloudSeconds','hour','resolution','shore','sceneType','wind','cosmosBlend','mountainLife'].map(k => [k,render.u(k)]));
    let mountainLifeActive=false;
    function simulate(drop = [0,0,.01,0]) {
      const next = 1-state; gl.useProgram(simulation.p); gl.bindFramebuffer(gl.FRAMEBUFFER, targets[next].framebuffer); gl.viewport(0,0,N,N);
      bind(targets[state].texture,0);gl.uniform1i(simU.waves,0);gl.uniform1f(simU.cell,1/N);gl.uniform4fv(simU.drop,drop);
      gl.drawArrays(gl.TRIANGLES,0,3);state=next;steps++;
    }
    function draw() {
      if (!ready) return;
      gl.useProgram(render.p);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);
      bind(targets[state].texture,0);bind(photo,1);bind(dayPhoto,2);gl.uniform1i(drawU.waves,0);gl.uniform1i(drawU.landscape,1);gl.uniform1i(drawU.dayLandscape,2);
      const sun=Math.max(0,Math.sin((day-6)*Math.PI/12)),fade=Math.min(1,Math.max(0,(sun-.02)/.58)),cosmosBlend=cosmosDayReady?fade*fade*(3-2*fade):0;
      gl.uniform1f(drawU.cell,1/N);gl.uniform1f(drawU.seconds,time);gl.uniform1f(drawU.cloudSeconds,cloudTime);gl.uniform1f(drawU.hour,day);gl.uniform1f(drawU.shore,sceneShore);gl.uniform1f(drawU.sceneType,sceneType);gl.uniform1f(drawU.wind,reduced.matches?0:wind);gl.uniform1f(drawU.cosmosBlend,cosmosBlend);gl.uniform1f(drawU.mountainLife,mountainLifeActive?1:0);gl.uniform2f(drawU.resolution,canvas.width,canvas.height);
      gl.drawArrays(gl.TRIANGLES,0,3);
    }
    function resize() {
      const scale=Math.min(devicePixelRatio,2,Math.sqrt(budget/(innerWidth*innerHeight)))*quality;
      canvas.width=Math.max(1,Math.round(innerWidth*scale));canvas.height=Math.max(1,Math.round(innerHeight*scale));draw();
    }
    function updateMotion() {
      motion.textContent=paused?'Resume water':'Pause water';motion.setAttribute('aria-pressed',String(paused));
      if(paused)stats.textContent='Paused · tap Resume water to animate';
    }
    function stop(){cancelAnimationFrame(handle);handle=0;last=0;accumulator=0;}
    function start(){if(ready&&!paused&&!document.hidden&&!handle){measuredAt=performance.now();frames=0;handle=requestAnimationFrame(tick);}}
    function tick(now){
      handle=requestAnimationFrame(tick);
      const dt=last?Math.min((now-last)/1000,.05):1/60;last=now;time+=dt;accumulator+=dt;
      wind+=(windTarget-wind)*Math.min(1,dt*.42);
      advanceClouds(dt,now);
      if(time<activeUntil || drops.length){let count=0;while(accumulator>=1/60&&count++<3){simulate(drops.shift());accumulator-=1/60;}}else accumulator=0;
      draw();frames++;
      if(now-measuredAt>1200){
        fps=frames*1000/(now-measuredAt);frames=0;measuredAt=now;
        stats.textContent=`${fps.toFixed(0)} FPS · ${canvas.width} × ${canvas.height}\n${N} × ${N} wave grid · ${steps} simulation steps\n${paused?'Paused':'Running'} · ${Math.round(quality*100)}% render scale`;
        if(fps<45)slowWindows++;else slowWindows=0;
        if(slowWindows>=2&&quality>.6){quality=Math.max(.6,quality-.1);slowWindows=0;resize();}
      }
    }
    function splash(x,y,strength=.3,radius=.013,audible=true){
      if(!ready||paused||y/innerHeight<.455)return;
      const dy=(.43-y/innerHeight)*1.35,travel=-1.6/dy;
      const px=(x/innerWidth-.5)*1.3*(innerWidth/innerHeight)*travel,pz=-3+travel;
      const u=(px+20)/40,v=(pz+4)/40;if(u<.02||u>.98||v<.02||v>.98)return;
      if(drops.length<8)drops.push([u,v,Math.max(.003,Math.min(.025,radius)),Math.max(0,Math.min(.6,strength))]);activeUntil=time+12;
      if(audible)dispatchEvent(new CustomEvent('water:splash',{detail:{strength,x:x/innerWidth,depth:y/innerHeight}}));
    }
    let dragging=false,lastTouch=0;
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;canvas.setPointerCapture(e.pointerId);splash(e.clientX,e.clientY,.42);});
    canvas.addEventListener('pointermove',e=>{if(dragging&&performance.now()-lastTouch>40){splash(e.clientX,e.clientY,.14);lastTouch=performance.now();}});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>dragging=false);
    addEventListener('lake:ripple',event=>{const {x,y,strength=.12,radius=.013,audible=true}=event.detail||{};if([x,y,strength,radius].every(Number.isFinite))splash(x,y,strength,radius,audible);});
    redrawClock=draw;
    motion.onclick=()=>{paused=!paused;updateMotion();paused?stop():start();};
    reduced.addEventListener('change',()=>{paused=reduced.matches;updateMotion();paused?stop():start();});
    addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else{updateClock();start();}});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stop();fail('Graphics context lost. Reload to retry.');});
    canvas.addEventListener('webglcontextrestored',()=>location.reload());
    // Explicit, on-demand GPU pixel checks; never run readPixels during normal animation.
    function snapshot(){draw();const pixels=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;}
    function difference(a,b){let changes=0;for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>8)changes++;return changes;}
    verify.onclick=()=>{
      if(!ready||verification)return;verification=true;stop();
      const oldTime=time,oldDay=day,oldCloudTime=cloudTime;
      try{
        const a=snapshot();time+=1;cloudTime+=1;const moving=difference(a,snapshot());
        simulate([.5,.16,.018,.5]);for(let i=0;i<18;i++)simulate();const before=snapshot();
        for(let i=0;i<18;i++)simulate();const splashPixels=difference(before,snapshot());
        day=0;const night=snapshot();day=12;const dayPixels=difference(night,snapshot());
        const error=gl.getError();
        testResult.textContent=`${moving>0&&splashPixels>0&&dayPixels>0&&error===0?'PASS':'FAIL'}\nBreeze: ${moving} changed pixels\nSplash propagation: ${splashPixels}\nDay/night: ${dayPixels}\nWebGL error: ${error}`;
      }finally{time=oldTime;cloudTime=oldCloudTime;day=oldDay;activeUntil=time+12;verification=false;draw();start();}
    };
    const image=new Image();image.onload=()=>{
      try{bind(photo,1);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
        ready=true;resize();if(gl.getError()!==gl.NO_ERROR)throw Error('GPU setup failed');canvas.style.opacity=1;updateMotion();start();
      }catch(e){fail(e.message);}
    };image.onerror=()=>fail('Lake texture could not load.');
    const dayImage=new Image();dayImage.onload=()=>{bind(dayPhoto,2);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,dayImage);cosmosDayReady=true;draw();};
    addEventListener('weather:change',event=>{
      windTarget=({clear:.55,rain:.9,snow:.32,storm:1.55})[event.detail?.weather]??.55;
    });
    addEventListener('mountain-life:change',event=>{mountainLifeActive=!!event.detail?.active;draw();});
    addEventListener('lake:scene',event=>{
      sceneShore=event.detail.shore;
      sceneType=({yotei:0,fuji:1,alps:2,cosmos:3})[event.detail.key]??1;
      cosmosDayReady=false;if(event.detail.daySrc)dayImage.src=event.detail.daySrc;
      image.src=event.detail.src;
    });
    image.src=matchMedia('(max-width: 700px)').matches?'assets/fuji-lake-mobile.jpg':'assets/fuji-lake-desktop.jpg';
    updateMotion();
  } catch(error) { console.error(error);fail(error.message); }
})();
