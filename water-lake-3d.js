// 3D Floating Elements for Lake Fuji / Yōtei / Alps
// Features: 3D Floating Lanterns (Tōrō nagashi, candlelight flicker, buoyancy bobbing)
import * as THREE from 'three';

(() => {
  'use strict';

  const canvas = document.querySelector('#lake-3d-layer');
  if (!canvas) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  const saveData = navigator.connection?.saveData;

  let renderer = null;
  let scene = null;
  let camera = null;
  let hemiLight = null;
  let dirLight = null;

  let width = innerWidth;
  let height = innerHeight;
  let horizontal = 16;
  let vertical = 10;

  let animFrame = 0;
  let lastTime = performance.now();
  let pointerPos = { x: -9999, y: -9999, worldX: 0, worldY: 0, lastMoved: 0 };

  let lanterns = [];
  let lanternsActive = false;

  // Soft glow texture for lantern reflection pool
  let glowTexture = null;
  function getGlowTexture() {
    if (glowTexture) return glowTexture;
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
    grad.addColorStop(0, 'rgba(255, 215, 110, 0.95)');
    grad.addColorStop(0.28, 'rgba(255, 160, 50, 0.55)');
    grad.addColorStop(0.65, 'rgba(255, 110, 25, 0.16)');
    grad.addColorStop(1, 'rgba(255, 90, 10, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    glowTexture = new THREE.CanvasTexture(c);
    glowTexture.colorSpace = THREE.SRGBColorSpace;
    return glowTexture;
  }

  // Shimmering vertical reflection column for water ripples
  let streakTexture = null;
  function getStreakTexture() {
    if (streakTexture) return streakTexture;
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 256;
    const ctx = c.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, 'rgba(255, 225, 130, 0.88)');
    grad.addColorStop(0.18, 'rgba(255, 175, 60, 0.58)');
    grad.addColorStop(0.55, 'rgba(255, 125, 30, 0.22)');
    grad.addColorStop(0.85, 'rgba(255, 90, 15, 0.06)');
    grad.addColorStop(1, 'rgba(255, 80, 10, 0)');

    ctx.fillStyle = grad;
    for (let y = 0; y < 256; y += 2) {
      const v = y / 256;
      const taper = Math.pow(1 - v * 0.72, 1.25);
      const span = (36 * taper) + Math.sin(y * 0.38) * 4.5;
      ctx.fillRect(64 - span, y, span * 2, 2);
    }

    streakTexture = new THREE.CanvasTexture(c);
    streakTexture.colorSpace = THREE.SRGBColorSpace;
    return streakTexture;
  }

  // Kanji calligraphy texture for lantern washi paper
  let washiTexture = null;
  function getWashiTexture() {
    if (washiTexture) return washiTexture;
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');

    // Warm washi paper fibers
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = 'rgba(230, 215, 190, 0.15)';
    for (let i = 0; i < 400; i++) {
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1);
    }

    // Kanji calligraphy: 「和」 (Wa - Harmony / Peace)
    ctx.font = '92px "Hiragino Mincho ProN", "Songti SC", "Yu Mincho", serif';
    ctx.fillStyle = 'rgba(55, 45, 38, 0.72)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('和', 128, 132);

    washiTexture = new THREE.CanvasTexture(c);
    washiTexture.colorSpace = THREE.SRGBColorSpace;
    return washiTexture;
  }

  // Initialize Three.js lake runtime
  function initThree() {
    if (renderer) return;

    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      premultipliedAlpha: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    scene = new THREE.Scene();

    camera = new THREE.OrthographicCamera(-8, 8, 5, -5, 0.1, 100);
    camera.position.set(0, 0, 15);
    camera.lookAt(0, 0, 0);

    // Lake ambient & sunlight
    hemiLight = new THREE.HemisphereLight(0xbbe0f0, 0x162c38, 1.6);
    scene.add(hemiLight);

    dirLight = new THREE.DirectionalLight(0xfffaea, 1.8);
    dirLight.position.set(-4, 6, 10);
    scene.add(dirLight);

    resize();
  }

  function resize() {
    if (!renderer || !camera) return;
    width = innerWidth;
    height = innerHeight;

    vertical = 10;
    horizontal = vertical * width / Math.max(height, 1);

    camera.left = -horizontal / 2;
    camera.right = horizontal / 2;
    camera.top = vertical / 2;
    camera.bottom = -vertical / 2;
    camera.updateProjectionMatrix();

    const dpr = Math.min(window.devicePixelRatio || 1, coarse.matches ? 1.25 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
  }

  // Convert screen coordinates (pixels) to 3D world units
  function screenToWorld(sx, sy) {
    const wx = (sx / width - 0.5) * horizontal;
    const wy = (0.5 - sy / height) * vertical;
    return { x: wx, y: wy };
  }

  // Convert 3D world units to screen coordinates
  function worldToScreen(wx, wy) {
    const sx = (wx / horizontal + 0.5) * width;
    const sy = (0.5 - wy / vertical) * height;
    return { x: sx, y: sy };
  }

  let sharedGeoms = null;
  function getSharedGeoms() {
    if (sharedGeoms) return sharedGeoms;
    sharedGeoms = {
      base: new THREE.BoxGeometry(0.54, 0.06, 0.54),
      post: new THREE.BoxGeometry(0.024, 0.44, 0.024),
      topBarX: new THREE.BoxGeometry(0.48, 0.02, 0.024),
      topBarZ: new THREE.BoxGeometry(0.024, 0.02, 0.48),
      panel: new THREE.PlaneGeometry(0.44, 0.40),
      flame: new THREE.ConeGeometry(0.028, 0.08, 8),
      pool: new THREE.PlaneGeometry(1.9, 1.2),
      streak: new THREE.PlaneGeometry(1.0, 2.5)
    };
    return sharedGeoms;
  }

  // =========================================================================
  // 3D FLOATING WATER LANTERN BUILDER (Tōrō Nagashi)
  // Cedar float raft, washi paper walls with soft calligraphy, internal
  // flickering candlelight flame, and dual water reflection (ambient pool + shimmer streak).
  // =========================================================================
  function createLanternModel(scale = 1.0) {
    const group = new THREE.Group();
    const geoms = getSharedGeoms();

    // Cedar raft base
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x362319,
      roughness: 0.85,
      metalness: 0.05
    });
    const baseMesh = new THREE.Mesh(geoms.base, woodMaterial);
    baseMesh.position.y = 0.03;
    group.add(baseMesh);

    // 4 Corner upright wooden posts
    const postOffsets = [
      [0.23, 0.25, 0.23],
      [-0.23, 0.25, 0.23],
      [0.23, 0.25, -0.23],
      [-0.23, 0.25, -0.23]
    ];
    postOffsets.forEach(([px, py, pz]) => {
      const p = new THREE.Mesh(geoms.post, woodMaterial);
      p.position.set(px, py, pz);
      group.add(p);
    });

    // Top wooden perimeter frame
    const top1 = new THREE.Mesh(geoms.topBarX, woodMaterial); top1.position.set(0, 0.46, 0.23); group.add(top1);
    const top2 = new THREE.Mesh(geoms.topBarX, woodMaterial); top2.position.set(0, 0.46, -0.23); group.add(top2);
    const top3 = new THREE.Mesh(geoms.topBarZ, woodMaterial); top3.position.set(0.23, 0.46, 0); group.add(top3);
    const top4 = new THREE.Mesh(geoms.topBarZ, woodMaterial); top4.position.set(-0.23, 0.46, 0); group.add(top4);

    // Washi paper translucent panels with warm inner scattering
    const paperMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffcf5,
      emissive: 0xff8c20,
      emissiveIntensity: 1.18,
      roughness: 0.85,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide
    });

    const kanjiMaterial = new THREE.MeshStandardMaterial({
      map: getWashiTexture(),
      emissive: 0xff8c20,
      emissiveIntensity: 1.08,
      roughness: 0.85,
      transparent: true,
      opacity: 0.94,
      side: THREE.DoubleSide
    });

    // Front panel with calligraphy
    const panelFront = new THREE.Mesh(geoms.panel, kanjiMaterial);
    panelFront.position.set(0, 0.25, 0.225);
    group.add(panelFront);

    // Remaining 3 panels
    const panelBack = new THREE.Mesh(geoms.panel, paperMaterial);
    panelBack.position.set(0, 0.25, -0.225);
    panelBack.rotation.y = Math.PI;
    group.add(panelBack);

    const panelRight = new THREE.Mesh(geoms.panel, paperMaterial);
    panelRight.position.set(0.225, 0.25, 0);
    panelRight.rotation.y = Math.PI / 2;
    group.add(panelRight);

    const panelLeft = new THREE.Mesh(geoms.panel, paperMaterial);
    panelLeft.position.set(-0.225, 0.25, 0);
    panelLeft.rotation.y = -Math.PI / 2;
    group.add(panelLeft);

    // Internal Candlelight flame
    const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
    const flameMesh = new THREE.Mesh(geoms.flame, flameMaterial);
    flameMesh.position.set(0, 0.18, 0);
    group.add(flameMesh);

    // Warm amber PointLight
    const light = new THREE.PointLight(0xffa230, 2.6, 5.2, 1.7);
    light.position.set(0, 0.24, 0);
    group.add(light);

    // Water surface ambient glow pool (directly in camera view plane under the float raft)
    const poolMaterial = new THREE.MeshBasicMaterial({
      map: getGlowTexture(),
      transparent: true,
      opacity: 0.52,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const poolMesh = new THREE.Mesh(geoms.pool, poolMaterial);
    poolMesh.position.set(0, -0.32, -0.05);
    group.add(poolMesh);

    // Shimmering vertical water reflection column (in camera view plane extending downward into the lake)
    const streakMaterial = new THREE.MeshBasicMaterial({
      map: getStreakTexture(),
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const streakMesh = new THREE.Mesh(geoms.streak, streakMaterial);
    streakMesh.position.set(0, -1.22, -0.04);
    group.add(streakMesh);

    group.scale.set(scale, scale, scale);

    return {
      group,
      light,
      flameMesh,
      poolMesh,
      streakMesh,
      paperMaterial,
      kanjiMaterial,
      woodMaterial,
      poolMaterial,
      streakMaterial
    };
  }

  // =========================================================================
  // SPAWN & SIMULATION LOGIC: 3D FLOATING LANTERNS
  // =========================================================================
  function spawnLanterns() {
    initThree();
    clearLanterns();

    const count = coarse.matches ? 4 : 6;
    const startLeft = Math.random() > 0.4;
    const driftDir = startLeft ? 1 : -1;

    lanterns = Array.from({ length: count }, (_, i) => {
      const scale = 0.9 + Math.random() * 0.22;
      const model = createLanternModel(scale);

      const spawnX = (startLeft ? -horizontal * 0.45 : horizontal * 0.45) + (Math.random() - 0.5) * 4.0;
      const spawnY = -0.8 - Math.random() * 2.4; // Situated on the lake surface

      model.group.position.set(spawnX, spawnY, 0);
      scene.add(model.group);

      return {
        model,
        baseX: spawnX,
        baseY: spawnY,
        vx: driftDir * (0.04 + Math.random() * 0.05),
        vy: (Math.random() - 0.5) * 0.015,
        bobPhase: Math.random() * Math.PI * 2,
        rockPhase: Math.random() * Math.PI * 2,
        driftYaw: Math.random() * Math.PI * 2,
        yawSpeed: (Math.random() - 0.5) * 0.04,
        rippleTimer: performance.now() + 2000 + Math.random() * 5000,
        endT: performance.now() + 60000 + i * 2000
      };
    });

    lanternsActive = true;
    startLoop();
  }

  function clearLanterns() {
    lanterns.forEach(l => {
      scene.remove(l.model.group);
      l.model.paperMaterial.dispose();
      l.model.kanjiMaterial.dispose();
      l.model.woodMaterial.dispose();
      l.model.poolMaterial.dispose();
      l.model.streakMaterial.dispose();
      l.model.light.dispose();
    });
    lanterns = [];
    lanternsActive = false;
  }

  function clearAll() {
    clearLanterns();
  }

  // =========================================================================
  // MAIN SIMULATION & RENDER LOOP
  // =========================================================================
  function startLoop() {
    if (!animFrame && !reduced.matches && !saveData && lanternsActive) {
      lastTime = performance.now();
      animFrame = requestAnimationFrame(render);
    }
  }

  function stopLoop() {
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = 0;
    }
  }

  function render(now) {
    if (!lanternsActive) {
      stopLoop();
      return;
    }

    animFrame = requestAnimationFrame(render);

    const dt = Math.min(0.08, (now - lastTime) / 1000 || 0.016);
    lastTime = now;

    // Adjust lighting according to daytime slider
    const hour = Number(document.querySelector('#daytime')?.value || 12);
    const isNight = hour < 5.5 || hour > 19;
    const isDusk = (hour >= 17 && hour <= 19) || (hour >= 5 && hour <= 6.5);

    if (hemiLight && dirLight) {
      if (isNight) {
        hemiLight.intensity = 0.55;
        hemiLight.color.setHex(0x355268);
        dirLight.intensity = 0.45;
        dirLight.color.setHex(0x6e96b8);
      } else if (isDusk) {
        hemiLight.intensity = 1.1;
        hemiLight.color.setHex(0xd08a65);
        dirLight.intensity = 1.3;
        dirLight.color.setHex(0xffaa66);
      } else {
        hemiLight.intensity = 1.6;
        hemiLight.color.setHex(0xbbe0f0);
        dirLight.intensity = 1.8;
        dirLight.color.setHex(0xfffaea);
      }
    }

    // -----------------------------------------------------------------------
    // Update 3D Floating Lanterns
    // -----------------------------------------------------------------------
    if (lanternsActive && lanterns.length) {
      lanterns.forEach(l => {
        // Drift along the lake
        l.baseX += l.vx * dt;
        l.baseY += l.vy * dt;

        // Hydrodynamic buoyancy (multi-harmonic bobbing and rocking)
        const t = now * 0.001;
        const bobZ = Math.sin(t * 1.8 + l.bobPhase) * 0.035 + Math.cos(t * 2.8 + l.bobPhase) * 0.015;
        const rockX = Math.sin(t * 1.35 + l.rockPhase) * 0.04;
        const rockY = Math.cos(t * 1.6 + l.rockPhase) * 0.03;

        l.driftYaw += l.yawSpeed * dt;

        l.model.group.position.set(l.baseX, l.baseY, bobZ);
        l.model.group.rotation.set(rockX, l.driftYaw, rockY);

        // Keep reflection streak undulating with the water motion
        l.model.streakMesh.rotation.z = -rockY * 0.45 + Math.sin(t * 2.2 + l.bobPhase) * 0.03;
        l.model.streakMesh.position.x = Math.sin(t * 1.8 + l.rockPhase) * 0.02;

        // Candlelight organic flicker
        const flicker = 0.88 + 0.12 * Math.sin(t * 11.2) + 0.07 * Math.sin(t * 23.7 + 1.2) + 0.04 * Math.sin(t * 47.1);
        const nightFactor = isNight ? 1.45 : (isDusk ? 1.15 : 0.85);

        l.model.light.intensity = 2.6 * flicker * nightFactor;
        l.model.paperMaterial.emissiveIntensity = 1.18 * flicker * nightFactor;
        l.model.kanjiMaterial.emissiveIntensity = 1.08 * flicker * nightFactor;

        // Water reflection shimmer
        l.model.poolMesh.material.opacity = (isNight ? 0.65 : isDusk ? 0.45 : 0.25) * flicker;
        l.model.streakMesh.material.opacity = (isNight ? 0.68 : isDusk ? 0.48 : 0.28) * flicker;

        // Subtle flame micro-jitter
        l.model.flameMesh.position.x = Math.sin(t * 7.5) * 0.008;
        l.model.flameMesh.position.z = Math.cos(t * 9.2) * 0.008;

        // Gentle physical ripple as lantern drifts & bobs on lake surface
        if (now > l.rippleTimer) {
          l.rippleTimer = now + 4000 + Math.random() * 5000;
          const screenPos = worldToScreen(l.baseX, l.baseY);
          dispatchEvent(new CustomEvent('lake:ripple', {
            detail: { x: screenPos.x, y: screenPos.y, strength: 0.035 }
          }));
        }
      });

      // Check if lanterns drifted out
      const allDone = lanterns.every(l => Math.abs(l.baseX) > horizontal / 2 + 3.0 || now > l.endT);
      if (allDone) {
        clearLanterns();
        dispatchEvent(new CustomEvent('lanterns:end'));
      }
    }

    renderer.render(scene, camera);
  }

  // Pointer tracking for startle reflex
  function onPointerMove(e) {
    const sx = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const sy = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    pointerPos.x = sx;
    pointerPos.y = sy;
    const w = screenToWorld(sx, sy);
    pointerPos.worldX = w.x;
    pointerPos.worldY = w.y;
    pointerPos.lastMoved = performance.now();
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerMove, { passive: true });

  // Custom event listeners
  window.addEventListener('lanterns:spawn', spawnLanterns);
  window.addEventListener('lanterns:clear', clearLanterns);

  window.addEventListener('life:clear', clearAll);

  // Visibility and reduced motion
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopLoop();
    else if (lanternsActive) startLoop();
  });

  reduced.addEventListener('change', () => {
    if (reduced.matches) stopLoop();
    else if (lanternsActive) startLoop();
  });

  // Ready signal
  dispatchEvent(new CustomEvent('lake3d:ready'));
})();
