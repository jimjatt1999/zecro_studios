(() => {
  const canvas = document.getElementById('water');
  const motion = document.getElementById('motion');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches || Boolean(navigator.connection?.saveData);
  let ready = false, frame = 0, elapsed = 0, previous = 0;
  const gl = canvas.getContext('webgl', {alpha:false, antialias:false, depth:false, powerPreference:'low-power'});
  const updateMotion = () => { motion.textContent = paused ? 'Resume water' : 'Pause water'; motion.setAttribute('aria-pressed', String(paused)); };
  updateMotion();
  function stop(){cancelAnimationFrame(frame);frame=0;previous=0;}
  if(gl){
    try {
      const shader = (type, source) => { const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s; };
      const program=gl.createProgram();
      gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}'));
      gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`
        precision mediump float;
        varying vec2 uv;
        uniform sampler2D scene;
        uniform vec2 crop;
        uniform float time;
        void main(){
          vec2 p=(vec2(uv.x,1.-uv.y)-.5)*crop+.5;
          float depth=max(0.,(p.y-.46)/.54);
          float mask=smoothstep(0.,.12,depth);
          float y=log(1.+depth*9.);
          float a=sin(y*38.-time*1.1+p.x*13.);
          float b=sin(y*63.+time*.8-p.x*21.);
          vec2 shift=vec2(sin(y*29.+time*.65+p.x*17.)*.0014,(a+b*.45)*.0018)*mask*(.15+depth);
          vec3 color=texture2D(scene,clamp(p+shift,vec2(.001),vec2(.999))).rgb;
          color+=vec3(.008,.011,.012)*a*mask*depth;
          gl_FragColor=vec4(color,1.);
        }
      `));
      gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Water shader link failed');gl.useProgram(program);
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
      const time=gl.getUniformLocation(program,'time'),crop=gl.getUniformLocation(program,'crop');
      const picture=new Image();
      function resize(){
        const scale=Math.min(devicePixelRatio,1.25,1400/innerWidth,1000/innerHeight);
        canvas.width=Math.round(innerWidth*scale);canvas.height=Math.round(innerHeight*scale);gl.viewport(0,0,canvas.width,canvas.height);
        const ratio=innerWidth/innerHeight/(picture.width/picture.height);
        gl.uniform2f(crop,Math.min(1,ratio),Math.min(1,1/ratio));draw();
      }
      function draw(){if(ready){gl.uniform1f(time,elapsed);gl.drawArrays(gl.TRIANGLES,0,6);}}
      function tick(now){frame=requestAnimationFrame(tick);if(now-previous<32)return;elapsed+=previous?Math.min((now-previous)/1000,.1):0;previous=now;draw();}
      function start(){if(ready&&!paused&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);}
      picture.onload=()=>{const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,picture);ready=true;resize();canvas.style.opacity=1;start();};
      picture.src='assets/water-preview.jpg';
      addEventListener('resize',resize);
      motion.onclick=()=>{paused=!paused;updateMotion();paused?stop():start();};
      reduced.addEventListener('change',()=>{paused=reduced.matches;updateMotion();paused?stop():start();});
      document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
      canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();stop();canvas.style.opacity=0;motion.hidden=true;});
    }catch(error){console.warn('Static lake fallback:',error);motion.hidden=true;}
  }else motion.hidden=true;
  const clock=document.getElementById('clock');
  const updateClock=()=>clock.textContent=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',hour:'numeric',minute:'2-digit'}).format(new Date());
  updateClock();setInterval(updateClock,1000);
  // Original procedural ambient score: no remote audio or downloads.
  const music=document.getElementById('music');let audio,master,timer,playing=false,step=0;
  function phrase(){
    const chords=[[146.83,220,293.66,369.99],[130.81,196,261.63,329.63],[164.81,246.94,329.63,392],[110,164.81,220,329.63]];
    chords[step++%chords.length].forEach((frequency,index)=>{
      const oscillator=audio.createOscillator(),gain=audio.createGain(),at=audio.currentTime+index*.7;
      oscillator.type='sine';oscillator.frequency.value=frequency;oscillator.detune.value=index*2-3;
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.055,at+2.5);gain.gain.exponentialRampToValueAtTime(.0001,at+12);
      oscillator.connect(gain);gain.connect(master);oscillator.start(at);oscillator.stop(at+13);
    });
  }
  music.onclick=async()=>{
    music.disabled=true;
    try{
      if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=.6;master.connect(audio.destination);}
      if(playing){clearInterval(timer);await audio.suspend();playing=false;}
      else{await audio.resume();if(audio.state!=='running')throw Error('Audio unavailable');phrase();timer=setInterval(phrase,9000);playing=true;}
      document.getElementById('music-label').textContent=playing?'Pause music':'Play music';document.getElementById('music-icon').textContent=playing?'Ⅱ':'▷';music.setAttribute('aria-pressed',String(playing));
    }catch{document.getElementById('notice').textContent='Music couldn’t start. Please try tapping again.';}finally{music.disabled=false;}
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)music.click();});
})();
