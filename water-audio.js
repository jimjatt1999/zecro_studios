(() => {
  const button=document.querySelector('#music');let audio,playing=false,timer,master;
  function phrase(){
    [146.83,220,293.66,369.99].forEach((frequency,i)=>{
      const tone=audio.createOscillator(),gain=audio.createGain(),at=audio.currentTime+i*.8;
      tone.frequency.value=frequency;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.035,at+3);gain.gain.exponentialRampToValueAtTime(.0001,at+12);
      tone.connect(gain);gain.connect(master);tone.start(at);tone.stop(at+13);
      tone.onended=()=>{tone.disconnect();gain.disconnect();};
    });
  }
  button.onclick=async()=>{
    button.disabled=true;
    try{
      if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=.65;master.connect(audio.destination);}
      if(playing){clearInterval(timer);await audio.suspend();playing=false;}
      else{await audio.resume();if(audio.state!=='running')throw Error('Audio unavailable');phrase();timer=setInterval(phrase,10000);playing=true;}
      document.querySelector('#music-label').textContent=playing?'Pause music':'Play music';document.querySelector('#music-icon').textContent=playing?'Ⅱ':'▷';button.setAttribute('aria-pressed',String(playing));
    }catch{document.querySelector('#notice').textContent='Music could not start. Tap again to retry.';}finally{button.disabled=false;}
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)button.click();});
})();
