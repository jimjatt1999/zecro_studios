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
  music.src=tracks[index].src;
  music.volume=.11;lake.volume=.014;rain.volume=.058;
  const lakeLevel=()=>music.paused?.022:.014;
  function render(){label.textContent=music.paused?'Play music':tracks[index].title;icon.textContent=music.paused?'▷':'Ⅱ';musicButton.setAttribute('aria-pressed',String(!music.paused));if(!splashDucking)lake.volume=lakeLevel();}
  async function safePlay(audio){try{await audio.play();return true}catch{return false}}
  async function startSound(){const results=await Promise.all([musicWanted?safePlay(music):true,natureWanted?safePlay(lake):true,natureWanted&&raining?safePlay(rain):true]);unlocked=results.every(Boolean);document.body.classList.toggle('sound-locked',!unlocked);render();return unlocked;}
  function stopNature(){lake.pause();rain.pause();}
  async function changeTrack(delta){index=(index+delta+tracks.length)%tracks.length;music.src=tracks[index].src;label.textContent=tracks[index].title;if(musicWanted)await startSound();else render();}
  musicButton.addEventListener('click',async()=>{musicWanted=music.paused;if(musicWanted)await startSound();else{music.pause();if(natureWanted)await safePlay(lake);render();}});
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
  let cueContext,noiseBuffer,sloshBuffer=null,sloshLoading=false,lastCue=0;
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
    const AudioContext=window.AudioContext||window.webkitAudioContext;cueContext=new AudioContext();
    noiseBuffer=cueContext.createBuffer(1,cueContext.sampleRate,cueContext.sampleRate);
    const samples=noiseBuffer.getChannelData(0);let smooth=0;
    for(let i=0;i<samples.length;i++){smooth=smooth*.72+(Math.random()*2-1)*.28;samples[i]=smooth;}
    loadSloshBuffer();
  }
  addEventListener('water:splash',event=>{
    if(!natureWanted||performance.now()-lastCue<65)return;lastCue=performance.now();
    splashDucking=true;lake.volume=.008;clearTimeout(cueDuckTimer);cueDuckTimer=setTimeout(()=>{splashDucking=false;lake.volume=lakeLevel();},340);
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
