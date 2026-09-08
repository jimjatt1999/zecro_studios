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

  const lakeClock=LakeNature.clock();
  if(document.hidden||reduced.matches)lakeClock.pause();
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
  let lastTime = lakeClock.now();
  let pointerPos = { x: -9999, y: -9999, worldX: 0, worldY: 0, lastMoved: 0 };

  let lanterns = [];
  let currentScene='fuji';
  addEventListener('lake:scene',event=>{currentScene=event.detail.key;});
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

  // Reflections live in the water plane, independently of the lantern's yaw.
  function reflectionMaterial(){
    return new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,
      uniforms:{time:{value:0},strength:{value:.3},phase:{value:Math.random()*6.28}},
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying vec2 vUv;uniform float time,strength,phase;
      void main(){
        float d=1.-vUv.y;
        float shift=sin(d*47.-time*1.4+phase)*.025+sin(d*103.+time*2.)*.012;
        float width=mix(.21,.32,d);
        float edge=exp(-pow((vUv.x-.5-shift)/width,2.)*3.);
        float bands=pow(.5+.5*sin(d*155.+sin(d*38.+time)*2.-time*2.),3.);
        float fade=pow(1.-d,2.)*smoothstep(0.,.035,d);
        float alpha=edge*fade*(.12+.88*bands)*strength;
        gl_FragColor=vec4(mix(vec3(1.,.63,.25),vec3(.95,.36,.09),d),alpha);
      }`
    });
  }

  // Kanji calligraphy texture for lantern washi paper
  const washiTextures=new Map();
  const lanternCharacters=['和','光','夢','月','風','花','心'];
  function getWashiTexture(character='') {
    if(washiTextures.has(character))return washiTextures.get(character);
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');

    // Warm washi paper fibers
    const paper=ctx.createRadialGradient(128,165,12,128,140,175);
    paper.addColorStop(0,'#fff0ce');paper.addColorStop(.45,'#dfb57c');paper.addColorStop(1,'#806047');
    ctx.fillStyle = paper;
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
    if(character)ctx.fillText(character, 128, 132);

    const washiTexture = new THREE.CanvasTexture(c);
    washiTexture.colorSpace = THREE.SRGBColorSpace;
    washiTextures.set(character,washiTexture);
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
  function createLanternModel(scale = 1.0,character='和') {
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
      map:getWashiTexture(),
      emissiveMap:getWashiTexture(),
      emissive: 0xff8c20,
      emissiveIntensity: 1.18,
      roughness: 0.85,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide
    });

    const kanjiMaterial = new THREE.MeshStandardMaterial({
      map: getWashiTexture(character),
      emissiveMap: getWashiTexture(character),
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
    const reflectionGroup=new THREE.Group();
    reflectionGroup.add(poolMesh);

    // Shimmering vertical water reflection column (in camera view plane extending downward into the lake)
    const streakMaterial = reflectionMaterial();
    const streakMesh = new THREE.Mesh(geoms.streak, streakMaterial);
    streakMesh.position.set(0, -1.22, -0.04);
    reflectionGroup.add(streakMesh);

    group.scale.set(scale, scale, scale);
    reflectionGroup.scale.set(scale,scale,scale);
    poolMesh.scale.set(.62,.16,1);poolMesh.position.y=-.045;

    return {
      group,
      reflectionGroup,
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

    const event=LakeNature.profile('lanterns',{mobile:coarse.matches,weather:document.body.classList.contains('raining')?'rain':'clear'});
    const count=event.count,driftDir=event.direction,startLeft=driftDir>0;
    const arrival=lakeClock.now();
    const arrivalGap=Math.max(1900,event.arrivalGap);
    const currentSpeed=driftDir*.17*event.pace;
    const lanes=[-1.0,-2.1,-3.2];
    for(let i=lanes.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[lanes[i],lanes[j]]=[lanes[j],lanes[i]];}

    const characters=[...lanternCharacters];
    for(let i=characters.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[characters[i],characters[j]]=[characters[j],characters[i]];}


    lanterns = Array.from({ length: count }, (_, i) => {
      const scale = 0.65 + Math.random() * 0.48;
      const model = createLanternModel(scale,characters[i]);

      const spawnX = (startLeft ? -1 : 1)*(horizontal*.5+.4+Math.random()*.25);
      const spawnY = lanes[i%lanes.length]+(Math.random()-.5)*.12;

      model.group.visible=false;model.reflectionGroup.visible=false;
      model.group.position.set(spawnX, spawnY, 0);
      scene.add(model.group);
      scene.add(model.reflectionGroup);

      return {
        model,
        birth:arrival+i*arrivalGap,
        scale,
        baseX: spawnX,
        baseY: spawnY,
        vx: currentSpeed*(.96+Math.random()*.08),
        vy: (Math.random() - 0.5) * 0.006,
        bobPhase: Math.random() * Math.PI * 2,
        rockPhase: Math.random() * Math.PI * 2,
        driftYaw: Math.random() * Math.PI * 2,
        yawSpeed: (Math.random() - 0.5) * 0.04,
        rippleTimer: lakeClock.now() + 2000 + Math.random() * 5000,
        endT: arrival + 65000 + i*arrivalGap
      };
    });

    lanternsActive = true;
    startLoop();
  }

  function separateLanterns(now){
    const floating=lanterns.filter(l=>now>=l.birth&&now<l.endT);
    // Screen-plane clearance includes the raft's widest yaw and the paper above it.
    // Resolve tiny contacts each frame, before they can turn into visible overlaps.
    for(let pass=0;pass<4;pass++)for(let i=0;i<floating.length;i++)for(let j=i+1;j<floating.length;j++){
      const a=floating[i],b=floating[j];
      const dx=b.baseX-a.baseX,dy=(b.baseY+b.scale*.25)-(a.baseY+a.scale*.25);
      const overlapX=(a.scale+b.scale)*.42+.14-Math.abs(dx);
      const overlapY=(a.scale+b.scale)*.29+.16-Math.abs(dy);
      if(overlapX<=0||overlapY<=0)continue;
      if(overlapX<overlapY){
        const push=(overlapX+.001)*.5*(dx>=0?1:-1);a.baseX-=push;b.baseX+=push;
      }else{
        const push=(overlapY+.001)*.5*(dy>=0?1:-1);a.baseY-=push;b.baseY+=push;
      }
    }
  }

  function clearLanterns() {
    lanterns.forEach(l => {
      scene.remove(l.model.group);
      scene.remove(l.model.reflectionGroup);
      l.model.flameMesh.material.dispose();
      l.model.paperMaterial.dispose();
      l.model.kanjiMaterial.dispose();
      l.model.woodMaterial.dispose();
      l.model.poolMaterial.dispose();
      l.model.streakMaterial.dispose();
      l.model.light.dispose();
    });
    lanterns = [];
    lanternsActive = false;
    renderer?.clear();
  }

  function clearAll() {
    clearLanterns();
  }

  // =========================================================================
  // MAIN SIMULATION & RENDER LOOP
  // =========================================================================
  function startLoop() {
    if (!animFrame && !reduced.matches && !saveData && lanternsActive && !document.hidden) {
      lastTime = lakeClock.now();
      animFrame = requestAnimationFrame(render);
    }
  }

  function stopLoop() {
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = 0;
    }
  }

  function render() {
    const now=lakeClock.now();
    if (document.hidden||reduced.matches||!lanternsActive) {
      stopLoop();
      return;
    }

    animFrame = requestAnimationFrame(render);

    const dt = Math.min(0.08, (now - lastTime) / 1000 || 0.016);
    lastTime = now;

    // Adjust lighting according to daytime slider
    const hour = Number(document.querySelector('#daytime')?.value || 12);
    const isNight = currentScene==='cosmos' || hour < 5.5 || hour > 19;
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
      for(const l of lanterns){if(now>=l.birth&&now<l.endT){l.baseX+=l.vx*dt;l.baseY+=l.vy*dt;}}
      separateLanterns(now);
      lanterns.forEach(l => {
        const visible=now>=l.birth&&now<l.endT;
        l.model.group.visible=visible;l.model.reflectionGroup.visible=visible;
        if(!visible)return;
        const fade=Math.min(1,(now-l.birth)/1800,(l.endT-now)/2500);
        l.model.paperMaterial.opacity=.92*fade;l.model.kanjiMaterial.opacity=.94*fade;
        l.model.woodMaterial.transparent=true;l.model.woodMaterial.opacity=fade;
        l.model.flameMesh.material.transparent=true;l.model.flameMesh.material.opacity=fade;

        // Hydrodynamic buoyancy (multi-harmonic bobbing and rocking)
        const t = now * 0.001;
        const bobZ = Math.sin(t * 1.8 + l.bobPhase) * 0.035 + Math.cos(t * 2.8 + l.bobPhase) * 0.015;
        const rockX = Math.sin(t * 1.35 + l.rockPhase) * 0.04;
        const rockY = Math.cos(t * 1.6 + l.rockPhase) * 0.03;

        l.driftYaw += l.yawSpeed * dt;

        l.model.group.position.set(l.baseX, l.baseY+bobZ*.3, 0);
        l.model.reflectionGroup.position.set(l.baseX,l.baseY,-.2);
        l.model.group.rotation.set(rockX, l.driftYaw, rockY);

        // Keep reflection streak undulating with the water motion
        l.model.streakMesh.rotation.z = -rockY * 0.45 + Math.sin(t * 2.2 + l.bobPhase) * 0.03;
        l.model.streakMesh.position.x = Math.sin(t * 1.8 + l.rockPhase) * 0.02;

        // Candlelight organic flicker
        const flicker = 0.88 + 0.12 * Math.sin(t * 11.2) + 0.07 * Math.sin(t * 23.7 + 1.2) + 0.04 * Math.sin(t * 47.1);
        const nightFactor = isNight ? 1.45 : (isDusk ? 1.15 : 0.85);

        l.model.light.intensity = 2.6 * flicker * nightFactor * fade;
        l.model.paperMaterial.emissiveIntensity = .48 * flicker * nightFactor;
        l.model.kanjiMaterial.emissiveIntensity = .44 * flicker * nightFactor;

        // Water reflection shimmer
        l.model.poolMesh.material.opacity = (isNight ? 0.22 : isDusk ? 0.15 : 0.07) * flicker * fade;
        l.model.streakMaterial.uniforms.time.value=t;
        l.model.streakMaterial.uniforms.strength.value=(isNight?.55:isDusk?.35:.16)*flicker*fade;

        // Subtle flame micro-jitter
        l.model.flameMesh.position.x = Math.sin(t * 7.5) * 0.008;
        l.model.flameMesh.position.z = Math.cos(t * 9.2) * 0.008;

        // Gentle physical ripple as lantern drifts & bobs on lake surface
        if (now > l.rippleTimer) {
          l.rippleTimer = now + 4000 + Math.random() * 5000;
          const screenPos = worldToScreen(l.baseX, l.baseY);
          dispatchEvent(new CustomEvent('lake:ripple', {
            detail: { x: screenPos.x, y: screenPos.y, strength: 0.035, audible:false }
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
    pointerPos.lastMoved = lakeClock.now();
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerMove, { passive: true });

  // Custom event listeners
  window.addEventListener('lanterns:spawn', spawnLanterns);
  window.addEventListener('lanterns:clear', clearLanterns);

  window.addEventListener('life:clear', clearAll);

  function suspendLanterns(){lakeClock.pause();stopLoop();}
  function resumeLanterns(){
    if(document.hidden||reduced.matches||saveData)return;
    lakeClock.resume();stopLoop();if(lanternsActive)startLoop();
  }
  document.addEventListener('visibilitychange',()=>document.hidden?suspendLanterns():resumeLanterns());
  addEventListener('pagehide',suspendLanterns);addEventListener('pageshow',resumeLanterns);
  reduced.addEventListener('change',()=>reduced.matches?suspendLanterns():resumeLanterns());

  // Ready signal
  dispatchEvent(new CustomEvent('lake3d:ready'));
})();
