// A light layer of rain on glass; pointer gestures temporarily wipe it clear.
(() => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.id = 'window-rain';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;opacity:0;transition:opacity 1.8s ease';
  document.body.appendChild(canvas);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData;
  let wet = document.body.classList.contains('raining');
  let width = 0, height = 0, frame = 0, last = 0, pointer = null, drops = [];

  function resize() {
    width = innerWidth; height = innerHeight;
    const scale = Math.min(devicePixelRatio || 1, 1.25);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const count = Math.min(150, Math.max(45, Math.round(width * height / 9500)));
    drops = Array.from({length: count}, () => ({
      x: Math.random() * width, y: Math.random() * height,
      radius: 1.4 + Math.pow(Math.random(), 2) * 6,
      alpha: 0, delay: Math.random() * 3,
      speed: Math.random() < .18 ? 3 + Math.random() * 6 : 0
    }));
    pointer = null;
  }

  function draw(now) {
    frame = 0;
    if (!wet || document.hidden || reduced.matches || saveData) return;
    frame = requestAnimationFrame(draw);
    if (last && now - last < 33) return;
    const dt = last ? Math.min((now - last) / 1000, .1) : 0;
    last = now;
    ctx.clearRect(0, 0, width, height);
    for (const drop of drops) {
      drop.delay = Math.max(0, drop.delay - dt);
      if (!drop.delay) drop.alpha = Math.min(1, drop.alpha + dt / 3);
      if (pointer && Math.hypot(drop.x - pointer.x, drop.y - pointer.y) < 52 + drop.radius) {
        drop.alpha = 0; drop.delay = 2;
      }
      drop.y += drop.speed * dt * drop.alpha;
      if (drop.y > height + 12) { drop.y = -12; drop.x = Math.random() * width; }
      if (drop.alpha < .01) continue;
      const r = drop.radius, stretch = drop.speed ? 1.45 : 1.12;
      ctx.save();
      ctx.translate(drop.x, drop.y); ctx.scale(1, stretch);
      ctx.globalAlpha = drop.alpha;
      const lens = ctx.createRadialGradient(-r * .25, -r * .3, 0, 0, 0, r);
      lens.addColorStop(0, 'rgba(230,246,250,.035)');
      lens.addColorStop(.65, 'rgba(5,24,32,.015)');
      lens.addColorStop(.88, 'rgba(4,20,28,.20)');
      lens.addColorStop(1, 'rgba(214,239,246,.16)');
      ctx.fillStyle = lens;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(229,249,255,.32)'; ctx.lineWidth = .65;
      ctx.beginPath(); ctx.arc(-r * .07, -r * .05, r * .72, Math.PI * 1.12, Math.PI * 1.65); ctx.stroke();
      ctx.restore();
    }
  }

  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = 0; pointer = null;
    const enabled = wet && !document.hidden && !reduced.matches && !saveData;
    canvas.style.opacity = enabled ? '1' : '0';
    if (enabled) frame = requestAnimationFrame(draw);
  }

  function wipe(event) {
    if (!wet || document.hidden || reduced.matches || saveData) return;
    const next = {x: event.clientX, y: event.clientY};
    const from = pointer || next;
    const dx = next.x - from.x, dy = next.y - from.y, length = dx * dx + dy * dy;
    for (const drop of drops) {
      const t = length ? Math.max(0, Math.min(1, ((drop.x - from.x) * dx + (drop.y - from.y) * dy) / length)) : 0;
      if (Math.hypot(drop.x - from.x - dx * t, drop.y - from.y - dy * t) < 52 + drop.radius) {
        drop.alpha = 0;
        drop.delay = 2 + Math.random() * 2;
      }
    }
    pointer = next;
  }

  addEventListener('pointermove', wipe, {passive: true});
  addEventListener('pointerdown', wipe, {passive: true});
  addEventListener('pointerup', event => { if (event.pointerType !== 'mouse') pointer = null; }, {passive: true});
  addEventListener('pointercancel', () => { pointer = null; });
  document.documentElement.addEventListener('pointerleave', () => { pointer = null; });
  addEventListener('blur', () => { pointer = null; });
  addEventListener('weather:change', event => {
    wet = event.detail.weather === 'rain' || event.detail.weather === 'storm';
    sync();
  });
  addEventListener('resize', resize, {passive: true});
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; });
  addEventListener('pageshow', sync);
  resize(); sync();
})();
