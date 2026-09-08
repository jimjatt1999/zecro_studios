(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const boat = document.createElement('button');
  boat.type = 'button'; boat.className = 'paper-boat'; boat.hidden = true;
  boat.setAttribute('aria-label', 'Open a paper note to Jimi');
  boat.setAttribute('aria-haspopup', 'dialog');
  boat.innerHTML = `<svg viewBox="0 0 100 80" aria-hidden="true">
    <defs>
      <linearGradient id="boat-paper" x2=".25" y2="1"><stop stop-color="#faf4e2"/><stop offset=".55" stop-color="#e1dbc8"/><stop offset="1" stop-color="#a5b1aa"/></linearGradient>
      <linearGradient id="boat-fold" x2="1" y2=".8"><stop stop-color="#b5b6aa"/><stop offset=".48" stop-color="#ede7d6"/><stop offset="1" stop-color="#d3cbb5"/></linearGradient>
      <linearGradient id="boat-inside" x2="0" y2="1"><stop stop-color="#8f998f"/><stop offset="1" stop-color="#586c66"/></linearGradient>
      <filter id="boat-fibres" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="8"/><feColorMatrix type="saturate" values="0"/><feComposite in2="SourceGraphic" operator="in"/><feBlend in="SourceGraphic" mode="soft-light"/></filter>
      <g id="boat-folded-paper">
        <path d="M7 43 L44 32 L94 43 L52 55 Z" fill="url(#boat-inside)"/>
        <path d="M23 46 L47 16 L77 46 L52 52 Z" fill="url(#boat-paper)"/>
        <path d="M47 16 L52 52 L77 46 Z" fill="url(#boat-fold)"/>
        <path d="M7 43 Q26 48 52 53 L94 43 L75 60 Q51 64 28 60 Z" fill="url(#boat-paper)"/>
        <path d="M52 53 L94 43 L75 60 L52 62 Z" fill="url(#boat-fold)"/>
        <path d="M7 43 L28 60 L52 53" fill="none" stroke="#a4a99b" stroke-width=".5"/>
        <path d="M8 43 L52 53 L93 43 M47 17 L52 50" fill="none" stroke="#fff9e9" stroke-width=".8" opacity=".8"/>
        <path d="M29 58 Q52 61 74 58 L75 60 Q51 64 28 60 Z" fill="#506f69" opacity=".25"/>
        <path d="M32 41 L44 24 M58 55 L78 49" stroke="#fffdf0" stroke-width=".4" opacity=".35"/>
      </g>
      <linearGradient id="boat-reflection-fade" x2="0" y2="1"><stop stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient>
      <mask id="boat-reflection-mask"><rect x="0" y="61" width="100" height="19" fill="url(#boat-reflection-fade)"/></mask>
    </defs>
    <ellipse cx="52" cy="62" rx="28" ry="2.2" fill="#092c31" opacity=".35"/>
    <g mask="url(#boat-reflection-mask)" opacity=".16"><use href="#boat-folded-paper" transform="translate(1 85) scale(1 -.38)"/></g>
    <use href="#boat-folded-paper" filter="url(#boat-fibres)"/>
    <path d="M26 61 Q52 65 77 60" fill="none" stroke="#d2e9df" stroke-width=".65" opacity=".32"/>
  </svg>`;
  const note = document.createElement('dialog');
  note.className = 'boat-note'; note.setAttribute('aria-labelledby', 'boat-note-title');
  note.innerHTML = `<div class="paper-fold paper-fold-left" aria-hidden="true"></div><div class="paper-fold paper-fold-right" aria-hidden="true"></div><div class="paper-fold paper-fold-top" aria-hidden="true"></div>
    <div class="paper-writing"><button class="boat-note-close" type="button" aria-label="Close note">×</button>
    <h2 id="boat-note-title">A little hello.</h2>
    <p>Glad you found this little boat. Have a project in mind, or just something to share? Leave me a note.<br>— Jimi</p>
    <form><label for="boat-message">Your message</label><textarea id="boat-message" name="message" required maxlength="2000" placeholder="Hi Jimi…"></textarea>
    <button class="boat-send" type="submit">Send via email ↗</button>
    <small>Opens your email app with your note filled in. You can review it and send it there.</small></form></div>`;
  document.body.append(boat, note);
  let age = 0, last = 0, frame = 0, timer = 0, active = false, lastWake = 0;
  let storm = document.body.classList.contains('snowing'), paused = false;
  const duration = 65000;
  const launch = document.createElement('button');
  launch.type = 'button'; launch.textContent = 'Paper boat';
  launch.dataset.boat = 'toggle';
  launch.setAttribute('aria-pressed', 'false');
  document.querySelector('[data-effect="lanterns"]')?.parentElement.appendChild(launch);
  function updateLaunch() {
    launch.setAttribute('aria-pressed', String(active));
    launch.disabled = storm;
    launch.title = storm ? 'Available in clear weather or rain' : '';
  }
  launch.addEventListener('click', () => {
    clearTimeout(timer);
    if (active) {
      active = false; boat.hidden = true;
      cancelAnimationFrame(frame); frame = 0;
      schedule();
    } else {
      appear();
      // A manual launch should be visible immediately, already on the water.
      age = duration * .2; position();
    }
    updateLaunch();
  });
  function schedule(delay = 90000 + Math.random() * 60000) {
    clearTimeout(timer);
    if (!document.hidden && !storm && !navigator.connection?.saveData) timer = setTimeout(appear, delay);
  }
  function appear() {
    if (document.hidden || storm || active) return;
    active = true; age = 0; boat.hidden = false; last = 0; lastWake = 0;
    updateLaunch();
    position(); if (!reduced.matches) frame = requestAnimationFrame(draw);
  }
  function position() {
    const p = reduced.matches ? .72 : Math.min(1, age / duration);
    const x = -90 + p * (innerWidth + 180);
    const y = innerHeight * .76 + (reduced.matches ? 0 : Math.sin(age * .00027) * 10 + Math.sin(age * .0017) * 2);
    const roll = reduced.matches ? -1 : Math.sin(age * .0012) * 1.6 + Math.sin(age * .00043) * .8;
    const pitch = reduced.matches ? 1 : 1 + Math.sin(age * .0009) * .018;
    boat.style.transform = `translate(${x}px,${y}px) rotate(${roll}deg) scaleY(${pitch})`;
    boat.style.opacity = String(Math.min(1, p * 12, (1 - p) * 12));
  }
  function draw(time) {
    frame = 0;
    if (!active || document.hidden || reduced.matches) return;
    if (last && !paused && !note.open) age += Math.min(time - last, 60);
    last = time; position();
    if (!paused && !note.open && age - lastWake > 420) {
      lastWake = age;
      const rect = boat.getBoundingClientRect();
      // Contact points on either side of the stern drive the existing lake simulation.
      const x = rect.left + rect.width * .3, y = rect.top + rect.height * .77;
      if (x > 0 && x < innerWidth) {
        [-3, 3].forEach(offset => dispatchEvent(new CustomEvent('lake:ripple', {
          detail: {x, y: y + offset, strength: .022, radius: .004, audible: false}
        })));
      }
    }
    if (age >= duration) { active = false; boat.hidden = true; updateLaunch(); schedule(); return; }
    frame = requestAnimationFrame(draw);
  }
  boat.addEventListener('pointerenter', () => { paused = true; });
  boat.addEventListener('pointerleave', () => { paused = false; });
  boat.addEventListener('focus', () => { paused = true; });
  boat.addEventListener('blur', () => { paused = false; });
  boat.addEventListener('click', () => {
    if (note.open) return;
    const rect = boat.getBoundingClientRect();
    note.style.setProperty('--boat-origin-x', `${rect.left + rect.width / 2 - innerWidth / 2}px`);
    note.style.setProperty('--boat-origin-y', `${rect.top + rect.height / 2 - innerHeight / 2}px`);
    note.showModal();
  });
  note.querySelector('.boat-note-close').addEventListener('click', () => note.close());
  note.addEventListener('click', event => { if (event.target === note) {
    const rect = note.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) note.close();
  }});
  note.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const input = note.querySelector('textarea'), message = input.value.trim();
    if (!message) { input.setCustomValidity('Write a little message first.'); input.reportValidity(); return; }
    location.href = `mailto:jimjatt1999@gmail.com?subject=${encodeURIComponent('A note from your paper boat')}&body=${encodeURIComponent(message)}`;
  });
  note.querySelector('textarea').addEventListener('input', event => event.target.setCustomValidity(''));
  addEventListener('weather:change', event => {
    storm = event.detail.weather === 'storm' || event.detail.weather === 'snow';
    if (storm && !note.open) { active = false; boat.hidden = true; cancelAnimationFrame(frame); frame = 0; }
    if (storm) clearTimeout(timer); else if (!active) schedule(22000);
    updateLaunch();
  });
  function resume() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    if (document.hidden) { clearTimeout(timer); return; }
    if (active) { position(); if (!reduced.matches) frame = requestAnimationFrame(draw); }
    else schedule(22000);
  }
  document.addEventListener('visibilitychange', resume);
  reduced.addEventListener('change', resume);
  addEventListener('resize', () => { if (active) position(); });
  addEventListener('pagehide', () => { clearTimeout(timer); cancelAnimationFrame(frame); frame = 0; });
  addEventListener('pageshow', resume);
  updateLaunch(); schedule(22000);
})();
