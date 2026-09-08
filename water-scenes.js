(() => {
  const mobile=matchMedia('(max-width: 700px)');
  const scenes={
    yotei:{desktop:'assets/yotei-lake-desktop.jpg',mobile:'assets/yotei-lake-mobile.jpg',winterDesktop:'assets/yotei-lake-winter-desktop.jpg',winterMobile:'assets/yotei-lake-winter-mobile.jpg',shore:.52},
    fuji:{desktop:'assets/fuji-lake-desktop.jpg',mobile:'assets/fuji-lake-mobile.jpg',winterDesktop:'assets/fuji-lake-winter-desktop.jpg',winterMobile:'assets/fuji-lake-winter-mobile.jpg',shore:.45},
    alps:{desktop:'assets/water-preview.jpg',mobile:'assets/water-preview.jpg',winterDesktop:'assets/alps-lake-winter-desktop.jpg',winterMobile:'assets/alps-lake-winter-mobile.jpg',shore:.43}
  };
  const baseImage=document.querySelector('#lake-image'),winterImage=document.querySelector('#winter-image');
  let current='fuji',winter=false,transitionTimer=0;
  function src(scene,isWinter){return mobile.matches?(isWinter?scene.winterMobile:scene.mobile):(isWinter?scene.winterDesktop:scene.desktop);}
  function announce(scene){dispatchEvent(new CustomEvent('lake:scene',{detail:{key:current,src:src(scene,winter),shore:scene.shore,winter}}));}
  function select(key){
    const scene=scenes[key];if(!scene)return;current=key;
    document.querySelectorAll('.scene-switcher button').forEach(button=>{const active=button.dataset.scene===key;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    const source=baseImage.closest('picture')?.querySelector('source');if(source)source.srcset=scene.mobile;
    baseImage.src=scene.desktop;
    if(winter){winterImage.src=src(scene,true);winterImage.onload=()=>announce(scene);}else announce(scene);
  }
  function season(snowing){
    if(winter===snowing)return;winter=snowing;clearTimeout(transitionTimer);
    const scene=scenes[current];document.body.classList.add('season-shift');
    if(snowing){
      winterImage.onload=()=>{transitionTimer=setTimeout(()=>{announce(scene);document.body.classList.remove('season-shift');},1800);};
      winterImage.src=src(scene,true);
    }else transitionTimer=setTimeout(()=>{announce(scene);setTimeout(()=>document.body.classList.remove('season-shift'),900);},1200);
  }
  document.querySelector('.scene-switcher').onclick=event=>{const button=event.target.closest('button[data-scene]');if(button)select(button.dataset.scene);};
  mobile.addEventListener('change',()=>select(current));
  addEventListener('weather:change',event=>season(event.detail.weather==='snow'));
  select('fuji');
})();
