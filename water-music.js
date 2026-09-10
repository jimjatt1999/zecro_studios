(() => {
  const music=document.querySelector('#ambient-music');
  const lake=document.querySelector('#lake-audio');
  const rain=document.querySelector('#rain-audio');
  const musicButton=document.querySelector('#music');
  const label=document.querySelector('#music-label');
  const icon=document.querySelector('#music-state');
  const tracks=[
    {title:'Water No Get Enemy',src:'assets/water-has-no-enemy.mp3'},
    {title:'Gymnopédie No. 1',src:'assets/gymnopedie-no-1.mp3'},
    {title:'Study and Relax',src:'assets/study-and-relax.ogg'},
    {title:'Gnossienne No. 1',src:'assets/gnossienne-no-1.ogg'},
    {title:'Moonlight Sonata',src:'assets/moonlight-sonata.ogg'},
    {title:'3 am West End',src:'assets/3-am-west-end.ogg'},
    {title:'Backed Vibes',src:'assets/backed-vibes-clean.ogg'},
    {title:'Long Trail',src:'assets/long-trail.mp3'}
  ];
  const featured = tracks[0];
  const pool = tracks.slice(1);
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  tracks.splice(0, tracks.length, featured, ...pool);
  let index=0,musicWanted=true,natureWanted=true,raining=document.body.classList.contains('raining'),unlocked=false,cueDuckTimer=0,splashDucking=false;
  let cueContext,noiseBuffer,sloshBuffer=null,sloshLoading=false,lakeBuffer=null,lakeSource=null,lakeGain=null,lakeLoading=false,lastCue=0,birdTimers=[];
  music.src=tracks[index].src;
  music.volume=.11;lake.volume=.014;rain.volume=.058;
  const lakeLevel=()=>music.paused?.022:.014;
  function setLakeLevel(level=lakeLevel(),seconds=.7){
    lake.volume=level;
    if(!lakeGain||!cueContext)return;
    const at=cueContext.currentTime;
    lakeGain.gain.cancelScheduledValues(at);
    lakeGain.gain.setValueAtTime(lakeGain.gain.value,at);
    lakeGain.gain.linearRampToValueAtTime(level,at+seconds);
  }
  function render(){label.textContent=music.paused?'Play music':tracks[index].title;icon.textContent=music.paused?'▷':'Ⅱ';musicButton.setAttribute('aria-pressed',String(!music.paused));if(!splashDucking)setLakeLevel();}
  async function safePlay(audio){try{await audio.play();return true}catch{return false}}
  function ensureLakeLoop(){
    if(!lakeBuffer||lakeSource||!cueContext)return;
    lakeSource=cueContext.createBufferSource();lakeSource.buffer=lakeBuffer;lakeSource.loop=true;lakeSource.connect(lakeGain);lakeSource.start();
  }
  async function playLake(){
    if(lakeBuffer&&cueContext?.state==='running'){
      ensureLakeLoop();lake.pause();setLakeLevel(lakeLevel(),1.2);return true;
    }
    return safePlay(lake);
  }
  async function startSound(){const results=await Promise.all([musicWanted?safePlay(music):true,natureWanted?playLake():true,natureWanted&&raining?safePlay(rain):true]);unlocked=results.every(Boolean);document.body.classList.toggle('sound-locked',!unlocked);render();return unlocked;}
  function stopNature(){lake.pause();rain.pause();setLakeLevel(0,.35);}
  async function changeTrack(delta){index=(index+delta+tracks.length)%tracks.length;music.src=tracks[index].src;label.textContent=tracks[index].title;if(musicWanted)await startSound();else render();}
  musicButton.addEventListener('click',async()=>{musicWanted=music.paused;if(musicWanted)await startSound();else{music.pause();if(natureWanted)await playLake();render();}});
  document.querySelector('#previous-track').addEventListener('click',()=>changeTrack(-1));
  document.querySelector('#next-track').addEventListener('click',()=>changeTrack(1));
  music.addEventListener('ended',()=>changeTrack(1));
  music.addEventListener('play',render);music.addEventListener('pause',render);
  addEventListener('weather:rain',event=>{raining=event.detail.raining;if(!natureWanted)return;if(raining)safePlay(rain);else rain.pause();});
  startSound();
  const unlock=async event=>{
    prepareWaterSynth();
    if(event.target.closest?.('.controls'))return;
    if(unlocked||await startSound()){removeEventListener('pointerdown',unlock,true);removeEventListener('keydown',unlock,true);}
  };
  addEventListener('pointerdown',unlock,true);addEventListener('keydown',unlock,true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){music.pause();stopNature();}else if(unlocked)startSound();});
  function seamlessLoop(buffer,overlapSeconds=1.5){
    const overlap=Math.min(Math.floor(buffer.sampleRate*overlapSeconds),Math.floor(buffer.length*.12));
    if(overlap<2)return buffer;
    const length=buffer.length-overlap,loop=cueContext.createBuffer(buffer.numberOfChannels,length,buffer.sampleRate);
    for(let channel=0;channel<buffer.numberOfChannels;channel++){
      const input=buffer.getChannelData(channel),output=loop.getChannelData(channel);
      output.set(input.subarray(0,length));
      for(let i=0;i<overlap;i++){
        const mix=i/(overlap-1);
        output[i]=input[length+i]*(1-mix)+input[i]*mix;
      }
    }
    return loop;
  }
  async function loadLakeBuffer(){
    if(lakeBuffer||lakeLoading||!cueContext)return;
    lakeLoading=true;
    try{
      const response=await fetch('assets/lake-water.ogg');
      const decoded=await cueContext.decodeAudioData(await response.arrayBuffer());
      lakeBuffer=seamlessLoop(decoded);
      if(natureWanted&&!document.hidden&&cueContext.state==='running'){
        ensureLakeLoop();lake.pause();setLakeLevel(lakeLevel(),1.5);
      }
    }catch(err){
      // The original media loop remains available as a fallback.
    }finally{
      lakeLoading=false;
    }
  }
  async function loadSloshBuffer(){
    if(sloshBuffer||sloshLoading||!cueContext)return;
    sloshLoading=true;
    try{
      const resp=await fetch('assets/water-slosh.ogg');
      const buf=await resp.arrayBuffer();
      sloshBuffer=await cueContext.decodeAudioData(buf);
    }catch(err){
      // Graceful fallback to synthesized noise
    }finally{
      sloshLoading=false;
    }
  }
  function prepareWaterSynth(){
    if(cueContext)return;
    const AudioContext=window.AudioContext||window.webkitAudioContext;cueContext=new AudioContext();lakeGain=cueContext.createGain();lakeGain.gain.value=0;lakeGain.connect(cueContext.destination);
    noiseBuffer=cueContext.createBuffer(1,cueContext.sampleRate,cueContext.sampleRate);
    const samples=noiseBuffer.getChannelData(0);let smooth=0;
    for(let i=0;i<samples.length;i++){smooth=smooth*.72+(Math.random()*2-1)*.28;samples[i]=smooth;}
    loadSloshBuffer();loadLakeBuffer();
  }
  function birdCall(direction=1,delay=0){
    if(!natureWanted||document.hidden||document.body.classList.contains('quiet-mode')||!cueContext||cueContext.state!=='running')return;
    const at=cueContext.currentTime+delay,pan=cueContext.createStereoPanner?cueContext.createStereoPanner():null,filter=cueContext.createBiquadFilter(),gain=cueContext.createGain();
    filter.type='bandpass';filter.frequency.value=1450;filter.Q.value=.8;
    gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.0072,at+.08);gain.gain.exponentialRampToValueAtTime(.0001,at+.72);
    if(pan){pan.pan.setValueAtTime(direction>0?-.6:.6,at);pan.pan.linearRampToValueAtTime(direction>0?-.25:.25,at+.72);gain.connect(pan);pan.connect(cueContext.destination);}else gain.connect(cueContext.destination);
    for(let i=0;i<2;i++){
      const tone=cueContext.createOscillator();tone.type=i?'sine':'triangle';tone.frequency.setValueAtTime((i?720:940)*(1+Math.random()*.05),at);tone.frequency.exponentialRampToValueAtTime(i?590:760,at+.26);tone.frequency.exponentialRampToValueAtTime(i?680:880,at+.62);tone.detune.value=i?7:-5;tone.connect(filter);tone.start(at);tone.stop(at+.75);
    }
    filter.connect(gain);
  }
  addEventListener('birds:flight',event=>{
    birdTimers.forEach(clearTimeout);birdTimers=[];
    const direction=event.detail?.direction||1;
    [900,4300,8900].forEach((delay,index)=>birdTimers.push(setTimeout(()=>birdCall(direction,index*.04),delay+Math.random()*650)));
  });
  addEventListener('birds:end',()=>{birdTimers.forEach(clearTimeout);birdTimers=[];});
  // A distant impact uses the same opt-in sound state as the lake.
  function distantBoom(event){
    if(!natureWanted||document.hidden||document.body.classList.contains('quiet-mode'))return;
    prepareWaterSynth();if(cueContext.state!=='running')return;
    const firework=event.type==='fireworks:burst',size=Math.max(.7,Math.min(1.2,event.detail.size||1));
    const at=cueContext.currentTime+(firework?.12+Math.random()*.18:0),source=cueContext.createBufferSource(),filter=cueContext.createBiquadFilter(),gain=cueContext.createGain();
    source.buffer=noiseBuffer;source.loop=true;filter.type='lowpass';
    source.playbackRate.value=firework?.75+Math.random()*.4:1;
    filter.frequency.setValueAtTime(firework?380+Math.random()*220:650,at);filter.frequency.exponentialRampToValueAtTime(65,at+2.4);
    gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(firework?.042*size:.12,at+.04);gain.gain.exponentialRampToValueAtTime(.0001,at+(firework?1.2+size*.7:2.5));
    const pan=cueContext.createStereoPanner();pan.pan.value=Math.max(-.8,Math.min(.8,event.detail.x*2-1));
    source.connect(filter);filter.connect(gain);gain.connect(pan);pan.connect(cueContext.destination);source.start(at);source.stop(at+2.6);
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();pan.disconnect();};
  }
  addEventListener('cosmos:impact',distantBoom);
  addEventListener('fireworks:burst',distantBoom);
  addEventListener('water:splash',event=>{
    if(!natureWanted||performance.now()-lastCue<65)return;lastCue=performance.now();
    splashDucking=true;setLakeLevel(.008,.06);clearTimeout(cueDuckTimer);cueDuckTimer=setTimeout(()=>{splashDucking=false;setLakeLevel(lakeLevel(),.45);},340);
    prepareWaterSynth();if(cueContext.state==='suspended')cueContext.resume();
    const strength=Math.min(1,event.detail.strength),depth=event.detail.depth||.7,at=cueContext.currentTime;
    const output=cueContext.createGain(),pan=cueContext.createStereoPanner?cueContext.createStereoPanner():null;
    if(pan){
      pan.pan.value=Math.max(-0.95,Math.min(0.95,(event.detail.x-.5)*1.4));
      output.connect(pan);pan.connect(cueContext.destination);
    }else{
      output.connect(cueContext.destination);
    }
    if(sloshBuffer){
      const src=cueContext.createBufferSource(),sloshGain=cueContext.createGain(),sloshFilter=cueContext.createBiquadFilter();
      src.buffer=sloshBuffer;
      src.playbackRate.value=.88+Math.random()*.24+strength*.1;
      sloshFilter.type='lowpass';
      sloshFilter.frequency.value=2400+strength*2200;
      const maxOffset=Math.max(0,sloshBuffer.duration-.7);
      const offset=Math.random()*maxOffset;
      const duration=.28+strength*.32;
      const peak=.08+strength*.18;
      sloshGain.gain.setValueAtTime(.0001,at);
      sloshGain.gain.exponentialRampToValueAtTime(peak,at+.025);
      sloshGain.gain.exponentialRampToValueAtTime(.0001,at+duration);
      src.connect(sloshFilter);sloshFilter.connect(sloshGain);sloshGain.connect(output);
      src.start(at,offset,duration);src.stop(at+duration+.05);
    }else{
      const wash=cueContext.createBufferSource(),band=cueContext.createBiquadFilter(),low=cueContext.createBiquadFilter(),washGain=cueContext.createGain();wash.buffer=noiseBuffer;wash.playbackRate.value=.82+Math.random()*.38;band.type='bandpass';band.frequency.value=520+strength*900+(1-depth)*420;band.Q.value=.55;low.type='lowpass';low.frequency.value=1800+strength*1700;washGain.gain.setValueAtTime(.0001,at);washGain.gain.exponentialRampToValueAtTime(.03+strength*.06,at+.012);washGain.gain.exponentialRampToValueAtTime(.0001,at+.16+strength*.18);wash.connect(band);band.connect(low);low.connect(washGain);washGain.connect(output);wash.start(at,Math.random()*.55,.42);wash.stop(at+.43);
    }
    const bubbles=strength>.2?2:1;
    for(let i=0;i<bubbles;i++){
      const bubble=cueContext.createOscillator(),bubbleGain=cueContext.createGain(),start=at+.018+i*.03+Math.random()*.02;
      bubble.type='sine';
      bubble.frequency.setValueAtTime(320+Math.random()*260+strength*100,start);
      bubble.frequency.exponentialRampToValueAtTime(140+Math.random()*80,start+.07);
      bubbleGain.gain.setValueAtTime(.0001,start);
      bubbleGain.gain.exponentialRampToValueAtTime(.015+strength*.022,start+.008);
      bubbleGain.gain.exponentialRampToValueAtTime(.0001,start+.085);
      bubble.connect(bubbleGain);bubbleGain.connect(output);bubble.start(start);bubble.stop(start+.09);
    }
  });
  render();
})();
