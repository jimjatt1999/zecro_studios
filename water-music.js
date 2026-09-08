(() => {
  const music=document.querySelector('#ambient-music');
  const lake=document.querySelector('#lake-audio');
  const rain=document.querySelector('#rain-audio');
  const musicButton=document.querySelector('#music');
  const label=document.querySelector('#music-label');
  const icon=document.querySelector('#music-state');
  const tracks=[
    {title:'Gymnopédie No. 1',src:'assets/gymnopedie-no-1.mp3'},
    {title:'Study and Relax',src:'assets/study-and-relax.ogg'},
    {title:'Gnossienne No. 1',src:'assets/gnossienne-no-1.ogg'},
    {title:'Moonlight Sonata',src:'assets/moonlight-sonata.ogg'},
    {title:'3 am West End',src:'assets/3-am-west-end.ogg'},
    {title:'Backed Vibes',src:'assets/backed-vibes-clean.ogg'},
    {title:'Long Trail',src:'assets/long-trail.mp3'}
  ];
  for(let i=tracks.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[tracks[i],tracks[j]]=[tracks[j],tracks[i]];}
  try{const last=localStorage.getItem('lake:last-track');if(tracks.length>1&&tracks[0].src===last)[tracks[0],tracks[1]]=[tracks[1],tracks[0]];localStorage.setItem('lake:last-track',tracks[0].src);}catch{}
  let index=0,musicWanted=true,natureWanted=true,raining=document.body.classList.contains('raining'),unlocked=false,cueDuckTimer=0,splashDucking=false;
  music.src=tracks[index].src;
  music.volume=.14;lake.volume=.022;rain.volume=.072;
  const lakeLevel=()=>music.paused?.022:.014;
  function render(){label.textContent=music.paused?'Play music':tracks[index].title;icon.textContent=music.paused?'▷':'Ⅱ';musicButton.setAttribute('aria-pressed',String(!music.paused));if(!splashDucking)lake.volume=lakeLevel();}
  async function safePlay(audio){try{await audio.play();return true}catch{return false}}
  async function startSound(){const results=await Promise.all([musicWanted?safePlay(music):true,natureWanted?safePlay(lake):true,natureWanted&&raining?safePlay(rain):true]);unlocked=results.every(Boolean);render();return unlocked;}
  function stopNature(){lake.pause();rain.pause();}
  async function changeTrack(delta){index=(index+delta+tracks.length)%tracks.length;music.src=tracks[index].src;label.textContent=tracks[index].title;if(musicWanted)await safePlay(music);render();}
  musicButton.addEventListener('click',async()=>{musicWanted=music.paused;if(musicWanted)await safePlay(music);else music.pause();render();});
  document.querySelector('#previous-track').addEventListener('click',()=>changeTrack(-1));
  document.querySelector('#next-track').addEventListener('click',()=>changeTrack(1));
  music.addEventListener('ended',()=>changeTrack(1));
  music.addEventListener('play',render);music.addEventListener('pause',render);
  addEventListener('weather:rain',event=>{raining=event.detail.raining;if(!natureWanted)return;if(raining)safePlay(rain);else rain.pause();});
  startSound();
  const unlock=async event=>{if(event.target.closest?.('.controls'))return;if(unlocked||await startSound()){removeEventListener('pointerdown',unlock,true);removeEventListener('keydown',unlock,true);}};
  addEventListener('pointerdown',unlock,true);addEventListener('keydown',unlock,true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){music.pause();stopNature();}else if(unlocked)startSound();});
  let cueContext,noiseBuffer,lastCue=0;
  function prepareWaterSynth(){
    if(cueContext)return;
    const AudioContext=window.AudioContext||window.webkitAudioContext;cueContext=new AudioContext();
    noiseBuffer=cueContext.createBuffer(1,cueContext.sampleRate,cueContext.sampleRate);
    const samples=noiseBuffer.getChannelData(0);let smooth=0;
    for(let i=0;i<samples.length;i++){smooth=smooth*.72+(Math.random()*2-1)*.28;samples[i]=smooth;}
  }
  addEventListener('water:splash',event=>{
    if(!natureWanted||performance.now()-lastCue<75)return;lastCue=performance.now();
    splashDucking=true;lake.volume=.008;clearTimeout(cueDuckTimer);cueDuckTimer=setTimeout(()=>{splashDucking=false;lake.volume=lakeLevel();},320);
    prepareWaterSynth();cueContext.resume();
    const strength=Math.min(1,event.detail.strength),depth=event.detail.depth||.7,at=cueContext.currentTime;
    const output=cueContext.createGain(),pan=cueContext.createStereoPanner();pan.pan.value=(event.detail.x-.5)*1.35;output.connect(pan);pan.connect(cueContext.destination);
    const wash=cueContext.createBufferSource(),band=cueContext.createBiquadFilter(),low=cueContext.createBiquadFilter(),washGain=cueContext.createGain();wash.buffer=noiseBuffer;wash.playbackRate.value=.82+Math.random()*.38;band.type='bandpass';band.frequency.value=520+strength*900+(1-depth)*420;band.Q.value=.55;low.type='lowpass';low.frequency.value=1800+strength*1700;washGain.gain.setValueAtTime(.0001,at);washGain.gain.exponentialRampToValueAtTime(.018+strength*.045,at+.012);washGain.gain.exponentialRampToValueAtTime(.0001,at+.16+strength*.18);wash.connect(band);band.connect(low);low.connect(washGain);washGain.connect(output);wash.start(at,Math.random()*.55,.42);wash.stop(at+.43);
    const impact=cueContext.createOscillator(),impactGain=cueContext.createGain();impact.type='sine';impact.frequency.setValueAtTime(125+strength*75,at);impact.frequency.exponentialRampToValueAtTime(48+depth*22,at+.14);impactGain.gain.setValueAtTime(.0001,at);impactGain.gain.exponentialRampToValueAtTime(.012+strength*.024,at+.008);impactGain.gain.exponentialRampToValueAtTime(.0001,at+.18);impact.connect(impactGain);impactGain.connect(output);impact.start(at);impact.stop(at+.19);
    const bubbles=strength>.22?2:1;
    for(let i=0;i<bubbles;i++){const bubble=cueContext.createOscillator(),bubbleGain=cueContext.createGain(),start=at+.025+i*.035+Math.random()*.025;bubble.type='sine';bubble.frequency.setValueAtTime(330+Math.random()*260,start);bubble.frequency.exponentialRampToValueAtTime(150+Math.random()*70,start+.075);bubbleGain.gain.setValueAtTime(.0001,start);bubbleGain.gain.exponentialRampToValueAtTime(.007+strength*.009,start+.008);bubbleGain.gain.exponentialRampToValueAtTime(.0001,start+.09);bubble.connect(bubbleGain);bubbleGain.connect(output);bubble.start(start);bubble.stop(start+.1);}
  });
  render();
})();
