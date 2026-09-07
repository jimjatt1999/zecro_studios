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
  let day = 12, state = 0, verification = false, liveTime = true, sceneShore = .45;
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
  slider.addEventListener('input',()=>{liveTime=false;day=Number(slider.value);updateClock();});
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
      uniform sampler2D landscape;uniform vec2 resolution;uniform float seconds,hour,cell,shore;
      const float PI=3.14159265;
      // Image-space shoreline: preserve the mountain's proportions above the water.
      vec3 landscapeAt(vec2 st){
        st=clamp(st,vec2(.002),vec2(.998,shore-.002));
        float banks=smoothstep(.23,.43,abs(st.x-.5));
        float grass=smoothstep(.42,.48,st.y)*(1.-smoothstep(shore-.012,shore,st.y))*banks;
        float wind=sin(st.x*65.-seconds*1.1)+.35*sin(st.x*131.-seconds*1.8);
        st.x+=wind*.0015*grass;
        return texture(landscape,st).rgb;
      }
      vec3 lighting(vec3 c){
        float sun=sin((hour-6.)*PI/12.);
        float daylight=smoothstep(-.15,.3,sun);
        float dusk=exp(-pow(sun/.24,2.));
        return c*mix(vec3(.22,.32,.48),vec3(1.),daylight)*mix(vec3(1.),vec3(1.25,.69,.40),dusk*.65);
      }
      vec3 sky(vec3 r){
        float aspect=resolution.x/resolution.y;
        vec2 st=vec2(.5+r.x/max(r.z,.15)/(1.3*aspect),.43-r.y/max(r.z,.15)/1.35);
        st.x=(st.x-.5)*min(1.,aspect/1.78)+.5;
        st.y*=shore/.431;
        vec3 image=landscapeAt(st);
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
        vec2 q=(p-vec2(-20.,0.))/40.;
        if(all(greaterThan(q,vec2(cell)))&&all(lessThan(q,vec2(1.-cell)))){
          s+=vec2(smoothHeight(q+vec2(cell,0.))-smoothHeight(q-vec2(cell,0.)),smoothHeight(q+vec2(0.,cell))-smoothHeight(q-vec2(0.,cell)))/(80.*cell);
        }
        return s;
      }
      void main(){
        vec2 screen=vec2(uv.x,1.-uv.y);float aspect=resolution.x/resolution.y;
        vec3 ray=normalize(vec3((screen.x-.5)*1.3*aspect,(.43-screen.y)*1.35,1.));
        if(screen.y<=.431){
          vec2 st=vec2((screen.x-.5)*min(1.,aspect/1.78)+.5,screen.y*shore/.431);
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
    const photo = gl.createTexture();
    function bind(texture, unit) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, texture); }
    const simU = Object.fromEntries(['waves','cell','drop'].map(k => [k,simulation.u(k)]));
    const drawU = Object.fromEntries(['waves','landscape','cell','seconds','hour','resolution','shore'].map(k => [k,render.u(k)]));
    function simulate(drop = [0,0,.01,0]) {
      const next = 1-state; gl.useProgram(simulation.p); gl.bindFramebuffer(gl.FRAMEBUFFER, targets[next].framebuffer); gl.viewport(0,0,N,N);
      bind(targets[state].texture,0);gl.uniform1i(simU.waves,0);gl.uniform1f(simU.cell,1/N);gl.uniform4fv(simU.drop,drop);
      gl.drawArrays(gl.TRIANGLES,0,3);state=next;steps++;
    }
    function draw() {
      if (!ready) return;
      gl.useProgram(render.p);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);
      bind(targets[state].texture,0);bind(photo,1);gl.uniform1i(drawU.waves,0);gl.uniform1i(drawU.landscape,1);
      gl.uniform1f(drawU.cell,1/N);gl.uniform1f(drawU.seconds,time);gl.uniform1f(drawU.hour,day);gl.uniform1f(drawU.shore,sceneShore);gl.uniform2f(drawU.resolution,canvas.width,canvas.height);
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
      if(time<activeUntil || drops.length){let count=0;while(accumulator>=1/60&&count++<3){simulate(drops.shift());accumulator-=1/60;}}else accumulator=0;
      draw();frames++;
      if(now-measuredAt>1200){
        fps=frames*1000/(now-measuredAt);frames=0;measuredAt=now;
        stats.textContent=`${fps.toFixed(0)} FPS · ${canvas.width} × ${canvas.height}\n${N} × ${N} wave grid · ${steps} simulation steps\n${paused?'Paused':'Running'} · ${Math.round(quality*100)}% render scale`;
        if(fps<45)slowWindows++;else slowWindows=0;
        if(slowWindows>=2&&quality>.6){quality=Math.max(.6,quality-.1);slowWindows=0;resize();}
      }
    }
    function splash(x,y,strength=.3){
      if(!ready||paused||y/innerHeight<.455)return;
      const dy=(.43-y/innerHeight)*1.35,travel=-1.6/dy;
      const px=(x/innerWidth-.5)*1.3*(innerWidth/innerHeight)*travel,pz=-3+travel;
      const u=(px+20)/40,v=pz/40;if(u<.02||u>.98||v<.02||v>.98)return;
      if(drops.length<8)drops.push([u,v,.013,strength]);activeUntil=time+12;
      dispatchEvent(new CustomEvent('water:splash',{detail:{strength,x:x/innerWidth,depth:y/innerHeight}}));
    }
    let dragging=false,lastTouch=0;
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;canvas.setPointerCapture(e.pointerId);splash(e.clientX,e.clientY,.42);});
    canvas.addEventListener('pointermove',e=>{if(dragging&&performance.now()-lastTouch>40){splash(e.clientX,e.clientY,.14);lastTouch=performance.now();}});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>dragging=false);
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
      const oldTime=time,oldDay=day;
      try{
        const a=snapshot();time+=1;const moving=difference(a,snapshot());
        simulate([.5,.16,.018,.5]);for(let i=0;i<18;i++)simulate();const before=snapshot();
        for(let i=0;i<18;i++)simulate();const splashPixels=difference(before,snapshot());
        day=0;const night=snapshot();day=12;const dayPixels=difference(night,snapshot());
        const error=gl.getError();
        testResult.textContent=`${moving>0&&splashPixels>0&&dayPixels>0&&error===0?'PASS':'FAIL'}\nBreeze: ${moving} changed pixels\nSplash propagation: ${splashPixels}\nDay/night: ${dayPixels}\nWebGL error: ${error}`;
      }finally{time=oldTime;day=oldDay;activeUntil=time+12;verification=false;draw();start();}
    };
    const image=new Image();image.onload=()=>{
      try{bind(photo,1);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
        ready=true;resize();if(gl.getError()!==gl.NO_ERROR)throw Error('GPU setup failed');canvas.style.opacity=1;updateMotion();start();
      }catch(e){fail(e.message);}
    };image.onerror=()=>fail('Lake texture could not load.');
    addEventListener('lake:scene',event=>{sceneShore=event.detail.shore;image.src=event.detail.src;});
    image.src=matchMedia('(max-width: 700px)').matches?'assets/fuji-lake-mobile.jpg':'assets/fuji-lake-desktop.jpg';
    updateMotion();
  } catch(error) { console.error(error);fail(error.message); }
})();
