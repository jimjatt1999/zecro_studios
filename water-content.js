(() => {
  const panel=document.querySelector('#content-panel'),body=document.querySelector('#panel-body'),title=document.querySelector('#panel-title');
  const titles={'books.html':'Books','essays.html':'Writing','koe.html':'Koe','rinova.html':'Rinova','histories.html':'Daily History','wordhacker.html':'Word Hacker'};
  const icons={'koe.html':'assets/koe/koe-icon.png','rinova.html':'assets/rinova/rinova icon.png','histories.html':'assets/histories/historyicon.png','wordhacker.html':'assets/wordhacker/word_hackericon.png'};
  let controller;
  async function openPage(url){
    controller?.abort();controller=new AbortController();
    const signal=controller.signal;
    const file=url.pathname.split('/').pop();
    panel.classList.toggle('is-books-panel', file==='books.html');
    title.textContent=titles[file]||'Studio';
    body.textContent='Loading…';if(!panel.open)panel.showModal();
    title.tabIndex=-1;title.focus({preventScroll:true});
    try{
      const response=await fetch(url,{signal});if(!response.ok)throw Error('Page unavailable');
      const doc=new DOMParser().parseFromString(await response.text(),'text/html');
      doc.querySelectorAll('script,style,link,header,footer,.clock-module,.location-module,.meta-module').forEach(n=>n.remove());
      const content=doc.querySelector('.layout-grid')||doc.querySelector('main')||doc.body;
      content.querySelectorAll('[style]').forEach(n=>n.removeAttribute('style'));
      content.querySelectorAll('img').forEach(n=>{n.loading='lazy';n.decoding='async';});
      content.querySelectorAll('video').forEach(n=>{n.preload='none';n.removeAttribute('autoplay');n.controls=true;});
      if(signal.aborted)return;
      body.replaceChildren(...content.childNodes);body.scrollTop=0;
      const heading=body.querySelector('.app-title');
      if(heading&&icons[file]){
        body.querySelector('.koe-product-icon')?.remove();
        const row=document.createElement('div');row.className='panel-app-heading';
        const icon=document.createElement('img');icon.src=icons[file];icon.alt='';icon.width=48;icon.height=48;
        heading.textContent=titles[file];heading.before(row);row.append(icon,heading);
      }
      const actions=body.querySelector('.app-actions');
      if(actions){
        const legal=document.createElement('div');legal.className='panel-legal';
        actions.querySelectorAll('.privacy-link').forEach(link=>{link.textContent=/terms/i.test(link.textContent)?'Terms of use':'Privacy policy';legal.append(link);});
        if(legal.childNodes.length)actions.after(legal);
        actions.querySelectorAll('.download-btn').forEach(link=>{link.textContent=link.href.includes('apps.apple.com')?'View on App Store ↗':'Contact support ↗';});
      }
      if(url.pathname.endsWith('books.html'))document.dispatchEvent(new Event('studio:books-open'));
      if(url.hash){const target=body.querySelector('#'+CSS.escape(url.hash.slice(1)));target?.scrollIntoView();}
    }catch(error){if(error.name!=='AbortError')body.textContent='This page couldn’t load. Close and try again.';}
  }
  document.addEventListener('click',event=>{
    const link=event.target.closest('a');if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target==='_blank')return;
    if(panel.open&&panel.contains(link)&&link.getAttribute('href')?.startsWith('#')){
      const target=body.querySelector('#'+CSS.escape(link.hash.slice(1)));
      if(target){event.preventDefault();target.scrollIntoView({block:'start'});}return;
    }
    const url=new URL(link.href,location.href),file=url.pathname.split('/').pop();
    if(url.origin!==location.origin||!file.endsWith('.html')||file==='water-preview.html')return;
    if(file==='index.html'){
      if(link.classList.contains('old-site'))return;
      event.preventDefault();panel.close();return;
    }
    event.preventDefault();openPage(url);
  });
  document.querySelector('#close-panel').onclick=()=>panel.close();
  panel.addEventListener('click', event => { if (event.target === panel) panel.close(); });
  panel.addEventListener('close',()=>{panel.classList.remove('is-books-panel');controller?.abort();body.querySelectorAll('video,audio').forEach(n=>n.pause());});
  const enter=document.querySelector('.mobile-enter'),profile=document.querySelector('#profile');
  enter?.addEventListener('click',()=>{document.body.classList.add('entered');profile?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});
  addEventListener('scroll',()=>{document.body.classList.toggle('entered',scrollY>innerHeight*.2);},{passive:true});
})();
