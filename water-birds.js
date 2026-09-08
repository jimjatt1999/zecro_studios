const canvas = document.querySelector('#bird-layer');

if (canvas) {
  const reflection=document.createElement('canvas'),reflectionCtx=reflection.getContext('2d');
  reflection.setAttribute('aria-hidden','true');
  reflection.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;opacity:0;transition:opacity 1.5s ease';
  canvas.after(reflection);
  function reflectFlight(time){
    if(!reflectionCtx)return;
    const w=innerWidth,h=innerHeight,d=canvas.width/w,horizon=h*.431;
    reflectionCtx.clearRect(0,0,w,h);
    // Reuse the rendered animated silhouettes, broken into moving water bands.
    for(let sy=0;sy<horizon;sy+=5){
      const depth=(horizon-sy)/horizon,dy=horizon+(horizon-sy)*.7;
      reflectionCtx.globalAlpha=.075*(1-depth*.65);
      reflectionCtx.drawImage(canvas,0,sy*d,canvas.width,5*d,Math.sin(dy*.085-time*.0015)*(1+depth*3),dy,w,3.5);
    }
    reflectionCtx.globalAlpha=1;
  }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 700px), (pointer: coarse)');
  const saveData = navigator.connection?.saveData;
  let runtimePromise;
  let renderer;
  let scene;
  let camera;
  let THREE;
  let prototype;
  let clips = [];
  let birds = [];
  let frame = 0;
  let startedAt = 0;
  let lastFrame = 0;
  let active = false;
  let loading = false;
  let generation = 0;

  const flightLength = 32000;

  function loadRuntime() {
    if (runtimePromise) return runtimePromise;
    runtimePromise = Promise.all([
      import('three'),
      import('three/addons/loaders/GLTFLoader.js'),
      import('three/addons/utils/SkeletonUtils.js')
    ]).then(([threeModule, loaderModule, skeletonUtils]) => {
      THREE = threeModule;
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
        premultipliedAlpha: true
      });
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-8, 8, 5, -5, 0.1, 100);
      camera.position.set(0, 1, 20);
      camera.lookAt(0, 1, 0);
      scene.add(new THREE.HemisphereLight(0xd8ecff, 0x42505a, 2.1));
      const sun = new THREE.DirectionalLight(0xfff4df, 2.5);
      sun.position.set(-4, 8, 10);
      scene.add(sun);

      const loader = new loaderModule.GLTFLoader();
      return loader.loadAsync('assets/flying-seagull.glb').then(gltf => {
        prototype = gltf.scene;
        clips = gltf.animations;
        prototype.traverse(object => {
          if (!object.isMesh) return;
          object.frustumCulled = false;
          object.castShadow = false;
          object.receiveShadow = false;
          if (object.material) {
            object.material = object.material.clone();
            object.material.roughness = Math.max(0.62, object.material.roughness || 0);
          }
        });
        prototype.userData.cloneAnimated = skeletonUtils.clone;
        resize();
      });
    }).catch(error => {
      runtimePromise = undefined;
      console.warn('The animated bird could not be loaded.', error);
      throw error;
    });
    return runtimePromise;
  }

  function resize() {
    if (!renderer || !camera) return;
    const width = innerWidth;
    const height = innerHeight;
    const vertical = 10;
    const horizontal = vertical * width / Math.max(height, 1);
    camera.left = -horizontal / 2;
    camera.right = horizontal / 2;
    camera.top = vertical / 2;
    camera.bottom = -vertical / 2;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile.matches ? 1.25 : 1.75));
    renderer.setSize(width, height, false);
    reflection.width=Math.round(width);reflection.height=Math.round(height);
  }

  let currentFlight = null;

  function generateFlockProfile(count) {
    const patterns = ['v-formation', 'cluster', 'echelon'];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const dir = Math.random() < 0.5 ? 1 : -1;

    // Dynamic altitude and swoop curvature for this flight
    const startAlt = 3.3 + (Math.random() - 0.5) * .8;
    const endAlt = 3.3 + (Math.random() - 0.5) * .8;
    const swoopDepth = (Math.random() - 0.35) * 1.4;
    const swoopFreq = 0.85 + Math.random() * 0.8;
    const swoopPhase = Math.random() * Math.PI * 2;
    const flightDuration = 26000 + Math.random() * 8000;

    const offsets = [];
    for (let i = 0; i < count; i++) {
      let ox = 0, oy = 0, oz = 0;
      if (pattern === 'v-formation') {
        if (i === 0) {
          ox = 0; oy = 0; oz = 0;
        } else {
          const wingIndex = Math.ceil(i / 2);
          const side = (i % 2 === 1) ? -1 : 1;
          ox = -dir * (wingIndex * 0.82 + (Math.random() - 0.5) * 0.12);
          oy = -0.16 * wingIndex + (Math.random() - 0.5) * 0.12;
          oz = -wingIndex * 0.3 + (Math.random() - 0.5) * 0.12;
        }
      } else if (pattern === 'cluster') {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
        const dist = 0.35 + Math.random() * 0.7;
        ox = -dir * (0.25 + Math.abs(Math.cos(angle)) * dist);
        oy = Math.sin(angle) * (dist * 0.45) + (Math.random() - 0.5) * 0.18;
        oz = -Math.random() * 0.8;
      } else { // 'echelon'
        ox = -dir * (i * 0.68 + (Math.random() - 0.5) * 0.1);
        oy = (i - count * 0.5) * 0.22 + (Math.random() - 0.5) * 0.14;
        oz = -i * 0.28;
      }
      offsets.push({ ox, oy, oz });
    }

    return {
      pattern,
      dir,
      startAlt,
      endAlt,
      swoopDepth,
      swoopFreq,
      swoopPhase,
      flightDuration,
      offsets
    };
  }

  function makeBird(index, count, flock) {
    const clone = prototype.userData.cloneAnimated(prototype);
    const holder = new THREE.Group();
    const model = new THREE.Group();
    model.add(clone);
    holder.add(model);

    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    clone.position.y += size.y * 0.12;

    // Distant birds: compact wingspan (~1% to 1.5% screen height)
    const baseSpan = mobile.matches ? 0.085 : 0.135;
    const targetSpan = baseSpan * (0.85 + Math.random() * 0.3);
    model.scale.setScalar(targetSpan / Math.max(size.x, size.y, size.z, 0.001));

    // Direction matching the flock
    model.rotation.y = flock.dir > 0 ? Math.PI / 2 : -Math.PI / 2;

    // Atmospheric perspective for distant silhouette
    clone.traverse(object => {
      if (!object.isMesh || !object.material) return;
      object.material = object.material.clone();
      object.material.transparent = true;
      object.material.opacity = 0.82 + Math.random() * 0.12;
      if (object.material.color) {
        object.material.color.lerp(new THREE.Color(0xd6e5ed), 0.18);
      }
    });

    const mixer = new THREE.AnimationMixer(clone);
    const flapClip = clips.find(clip => clip.name.toLowerCase().includes('flap')) || clips[0];
    const glideClip = clips.find(clip => clip.name.toLowerCase().includes('plan')) || clips[1] || clips[0];
    const activeClip = (index === 0 || Math.random() > 0.35) ? flapClip : glideClip;
    if (activeClip) {
      const action = mixer.clipAction(activeClip);
      action.timeScale = activeClip===flapClip ? 1.03+Math.random()*.19 : .85+Math.random()*.15;
      action.play();
      action.time = Math.random() * Math.max(activeClip.duration, 0.1);
    }
    scene.add(holder);

    const offset = flock.offsets[index];
    const initialMargin = 3.2;
    const startX = flock.dir > 0 ? camera.left - initialMargin : camera.right + initialMargin;
    holder.position.set(startX + offset.ox, flock.startAlt + offset.oy, -1.0 + offset.oz);

    return {
      holder,
      model,
      mixer,
      offset,
      prevX: holder.position.x,
      prevY: holder.position.y,
      phase: Math.random() * Math.PI * 2,
      flutterSpeed: 0.0012 + Math.random() * 0.0006,
      flutterAmp: 0.05 + Math.random() * 0.04
    };
  }

  let clearTimer = 0;

  function doCleanup(notify = false) {
    active = false;
    loading = false;
    cancelAnimationFrame(frame);
    frame = 0;
    canvas.classList.remove('active');
    reflection.style.opacity='0';
    for (const bird of birds) {
      bird.mixer.stopAllAction();
      bird.model.traverse(object=>{if(object.isMesh)object.material?.dispose();});
      scene?.remove(bird.holder);
    }
    birds = [];
    currentFlight = null;
    renderer?.clear();
    reflectionCtx?.clearRect(0,0,innerWidth,innerHeight);
    if (notify) dispatchEvent(new CustomEvent('birds:end'));
  }

  function clearFlight(immediate = false, notify = false) {
    generation += 1;
    clearTimeout(clearTimer);
    if (immediate || !active || birds.length === 0) {
      doCleanup(notify);
      return;
    }
    // Graceful fade out: canvas opacity smoothly transitions to 0 over 1.5s while animation continues
    canvas.classList.remove('active');
    reflection.style.opacity='0';
    const currentGen = generation;
    clearTimer = setTimeout(() => {
      if (generation === currentGen) {
        doCleanup(notify);
      }
    }, 1550);
  }

  function render(time) {
    if (!active || document.hidden || !currentFlight) {
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(render);
    if (time - lastFrame < 1000 / 45) return;
    const dt = Math.min((time - lastFrame) / 1000 || 0, 0.05);
    lastFrame = time;
    const progress = (time - startedAt) / currentFlight.flightDuration;
    if (progress >= 1.08) {
      clearFlight(true, true);
      return;
    }

    const span = camera.right - camera.left;
    const margin = 3.2;
    const startX = currentFlight.dir > 0 ? camera.left - margin : camera.right + margin;
    const endX   = currentFlight.dir > 0 ? camera.right + margin : camera.left - margin;

    // Center of the flock along its trajectory
    const fcX = startX + progress * (endX - startX);
    const baseAlt = currentFlight.startAlt + progress * (currentFlight.endAlt - currentFlight.startAlt);
    const swoop = Math.sin(progress * Math.PI * currentFlight.swoopFreq + currentFlight.swoopPhase) * currentFlight.swoopDepth;
    const fcY = baseAlt + swoop;
    const fcZ = -1.0 + Math.cos(progress * Math.PI * 1.3) * 0.4;

    for (const bird of birds) {
      const flutterX = Math.sin(time * bird.flutterSpeed * 0.8 + bird.phase) * (bird.flutterAmp * 0.5);
      const flutterY = Math.sin(time * bird.flutterSpeed + bird.phase) * bird.flutterAmp;

      const targetX = fcX + bird.offset.ox + flutterX;
      const targetY = Math.max(2.8,Math.min(4.5,fcY + bird.offset.oy + flutterY));
      const targetZ = fcZ + bird.offset.oz;

      // Smooth flock steering with slight natural follower lag
      const steerFactor = Math.min(1, dt * 4.2);
      bird.holder.position.x += (targetX - bird.holder.position.x) * steerFactor;
      bird.holder.position.y += (targetY - bird.holder.position.y) * steerFactor;
      bird.holder.position.z = targetZ;

      // Compute actual instantaneous velocity
      const vx = (bird.holder.position.x - bird.prevX) / (dt || 0.016);
      const vy = (bird.holder.position.y - bird.prevY) / (dt || 0.016);
      bird.prevX = bird.holder.position.x;
      bird.prevY = bird.holder.position.y;

      // Dynamic Aerodynamic Banking & Orientation:
      // Pitch: dive tilts nose down, climb tilts nose up
      const targetPitch = -Math.max(-0.42, Math.min(0.42, vy * 0.32));
      bird.model.rotation.x += (targetPitch - bird.model.rotation.x) * Math.min(1, dt * 5.0);

      // Yaw: follows heading with organic wandering
      const baseYaw = currentFlight.dir > 0 ? (Math.PI / 2) : (-Math.PI / 2);
      const yawWander = Math.sin(time * 0.0014 + bird.phase) * 0.06;
      const targetYaw = baseYaw - vy * 0.14 + yawWander;
      bird.model.rotation.y += (targetYaw - bird.model.rotation.y) * Math.min(1, dt * 5.0);

      // Roll: bank into turns and climbs/dives
      const bankRoll = -vy * 0.48 * currentFlight.dir + Math.cos(time * 0.0012 + bird.phase) * 0.1;
      const targetRoll = Math.max(-0.45, Math.min(0.45, bankRoll));
      bird.model.rotation.z += (targetRoll - bird.model.rotation.z) * Math.min(1, dt * 5.0);

      bird.mixer.update(dt);
    }
    renderer.render(scene, camera);
    reflectFlight(time);
  }

  async function beginFlight() {
    if (active || loading || reducedMotion.matches || saveData) return;
    loading = true;
    const requestedGeneration = generation;
    try {
      await loadRuntime();
      if (requestedGeneration !== generation || document.hidden) {
        loading = false;
        return;
      }
      const count = mobile.matches ? 3 : 5;
      currentFlight = generateFlockProfile(count);
      birds = Array.from({ length: count }, (_, index) => makeBird(index, count, currentFlight));
      loading = false;
      active = true;
      startedAt = performance.now();
      lastFrame = startedAt;
      canvas.classList.add('active');
      reflection.style.opacity='1';
      dispatchEvent(new CustomEvent('birds:flight',{detail:{direction:currentFlight.dir,duration:currentFlight.flightDuration}}));
      frame = requestAnimationFrame(render);
    } catch {
      loading = false;
      dispatchEvent(new CustomEvent('birds:end'));
    }
  }

  addEventListener('birds:spawn', beginFlight);
  addEventListener('birds:clear', () => clearFlight(false, true));
  addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (active && !frame) {
      lastFrame = performance.now();
      frame = requestAnimationFrame(render);
    }
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) clearFlight(true, true);
  });
  dispatchEvent(new CustomEvent('birds:ready'));
}
