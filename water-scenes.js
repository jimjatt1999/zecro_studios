(() => {
  const mobile=matchMedia('(max-width: 700px)');
  const scenes={yotei:{desktop:'assets/yotei-lake-desktop.jpg',mobile:'assets/yotei-lake-mobile.jpg',shore:.52},fuji:{desktop:'assets/fuji-lake-desktop.jpg',mobile:'assets/fuji-lake-mobile.jpg',shore:.45},alps:{desktop:'assets/water-preview.jpg',mobile:'assets/water-preview.jpg',shore:.43}};
  let current='fuji';
  function select(key){const scene=scenes[key];if(!scene)return;current=key;document.querySelectorAll('.scene-switcher button').forEach(button=>{const active=button.dataset.scene===key;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});const image=document.querySelector('#lake-image'),source=image.closest('picture')?.querySelector('source');if(source)source.srcset=scene.mobile;image.src=scene.desktop;const src=mobile.matches?scene.mobile:scene.desktop;dispatchEvent(new CustomEvent('lake:scene',{detail:{key,src,shore:scene.shore}}));}
  document.querySelector('.scene-switcher').onclick=event=>{const button=event.target.closest('button[data-scene]');if(button)select(button.dataset.scene);};
  mobile.addEventListener('change',()=>select(current));
  select('fuji');
})();
