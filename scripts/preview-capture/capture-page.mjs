// Run only in cua_repl with an existing, documented browser tab/CDP capability.
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const sceneStatus = `(() => {
  const unref = value => value?.__v_isRef ? value.value : value;
  const context = document.querySelector('canvas')?.__vueParentComponent?.exposed?.context;
  const scene = unref(context?.scene);
  let meshes = 0;
  const videos = [];
  const loading = [];
  scene?.traverse(object => {
    if (/loading/i.test(object.name)) loading.push(object.name);
    if (object.isMesh || object.isPoints) meshes++;
    for (const material of [object.material].flat().filter(Boolean)) {
      for (const texture of Object.values(material)) {
        if (texture?.isVideoTexture) videos.push({ready: texture.image?.readyState, time: texture.image?.currentTime});
      }
    }
  });
  return {canvas: !!context, meshes, videos, loading, title: document.querySelector('.preview-description strong')?.textContent};
})()`

export async function status(cdp) {
  const result = await cdp.send('Runtime.evaluate', { expression: sceneStatus, returnByValue: true })
  return result.result?.value
}

export async function reframeFromPixels(cdp, bounds) {
  const result = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const c = window.__previewCapture;
      const [left, top, right, bottom] = ${JSON.stringify(bounds)};
      const distance = c.camera.position.distanceTo(c.controls.target);
      const ndc = new c.THREE.Vector3((left+right)/900-1, 1-(top+bottom)/600, 0.5);
      const ray = ndc.unproject(c.camera).sub(c.camera.position).normalize();
      const forward = c.camera.getWorldDirection(new c.THREE.Vector3());
      const center = c.camera.position.clone().addScaledVector(ray, distance/ray.dot(forward));
      const delta = center.sub(c.controls.target);
      c.camera.position.add(delta);c.controls.target.add(delta);
      const zoom = Math.min(720/(right-left), 450/(bottom-top));
      c.camera.zoom *= zoom;c.camera.updateProjectionMatrix();c.controls.update();
      c.center.copy(c.controls.target);c.baseOffset.copy(c.camera.position).sub(c.center);
      return {pixelBounds:[left,top,right,bottom], zoom, position:c.camera.position.toArray(), target:c.center.toArray()};
    })()`, returnByValue: true,
  })
  return result.result.value
}

export async function measureRenderedBounds(cdp) {
  const result = await cdp.send('Runtime.evaluate', {
    expression: `new Promise((resolve,reject) => {
      const source=document.querySelector('canvas');
      const renderer=source.__vueParentComponent.exposed.context.renderer;
      let subscription;
      const timeout=setTimeout(()=>{subscription?.off();reject(new Error('No rendered frame'))},5000);
      subscription=renderer.onRender(()=>{
        subscription.off();clearTimeout(timeout);
        const copy=document.createElement('canvas');copy.width=source.width;copy.height=source.height;
        const ctx=copy.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);
        const pixels=ctx.getImageData(0,0,copy.width,copy.height).data;
        let left=copy.width,top=copy.height,right=0,bottom=0;
        for(let y=0;y<copy.height;y++)for(let x=0;x<copy.width;x++){
          const i=(y*copy.width+x)*4;
          if(Math.max(Math.abs(pixels[i]-51),Math.abs(pixels[i+1]-51),Math.abs(pixels[i+2]-51))>12){
            left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);
          }
        }
        resolve(right>left?[left,top,right,bottom]:null);
      });
    })`, awaitPromise: true, returnByValue: true,
  }, { timeoutMs: 7000 })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result.value
}

export async function fitRenderedFrame(cdp) {
  const passes = []
  for (let pass = 0; pass < 2; pass++) {
    const bounds = await measureRenderedBounds(cdp)
    if (!bounds) throw new Error('No visible component pixels')
    passes.push(await reframeFromPixels(cdp, bounds))
  }
  return passes
}

export async function preparePage({ tab, cdp, entry, navigate = true, timeoutMs = 16000, fitCamera = false }) {
  if (navigate) {
    // A different document search avoids Vue reusing a non-reactive async loader on hash navigation.
    const url = new URL(entry.url)
    url.searchParams.set('previewCapture', entry.type)
    await tab.goto(url.href)
  }
  const start = Date.now()
  let state
  let stable = 0
  let previousMeshes = 0
  while (Date.now() - start < timeoutMs) {
    state = await status(cdp)
    stable = state?.meshes > 0 && state.meshes === previousMeshes ? stable + 1 : 0
    previousMeshes = state?.meshes || 0
    if (stable >= 3 && !state.loading.length && state.videos.every(video => video.ready >= 2)) break
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  if (!state?.canvas || !state.meshes || state.loading.length || state.videos.some(video => video.ready < 2)) return { ready: false, state }
  const expression = `(async () => {
    const unref = value => value?.__v_isRef ? value.value : value;
    const context = document.querySelector('canvas').__vueParentComponent.exposed.context;
    const scene = unref(context.scene);
    const camera = unref(context.camera.activeCamera);
    const controls = unref(context.controls);
    const moduleUrl = performance.getEntriesByType('resource').map(r => r.name).find(n => n.includes('/three/build/three.module.js'));
    const THREE = await import(moduleUrl);
    const root = scene.children.find(child => child.type === 'Group');
    const style = document.createElement('style');
    style.textContent = 'html,body {overflow:hidden!important} .tp-dfwv,.preview-description { visibility:hidden!important;pointer-events:none!important }';
    document.head.appendChild(style);
    const hidden = [];
    scene.children.forEach(object => {
      if (/GridHelper|AxesHelper/.test(object.type) || object.isTransformControlsRoot || object.children.some(child => child.isTransformControlsGizmo)) {
        hidden.push([object, object.visible]); object.visible = false;
      }
    });
    scene.updateMatrixWorld(true);
    const bounds = new THREE.Box3();
    scene.children.forEach(object => {
      if (object.visible && !object.isCamera && !object.isLight) bounds.union(new THREE.Box3().setFromObject(object, true));
    });
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    if (bounds.isEmpty() || !Number.isFinite(size.length())) throw new Error('Invalid component bounds');
    const direction = camera.position.clone().sub(controls.target).normalize();
    const right = new THREE.Vector3().crossVectors(camera.up, direction).normalize();
    const up = new THREE.Vector3().crossVectors(direction, right).normalize();
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const tanH = tanV * camera.aspect;
    let distance = 0;
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      const corner = new THREE.Vector3(x,y,z).sub(center);
      const depth = corner.dot(direction);
      distance = Math.max(distance, depth + Math.abs(corner.dot(right)) / (tanH * 0.80), depth + Math.abs(corner.dot(up)) / (tanV * 0.80));
    }
    const original = { position: camera.position.clone(), target: controls.target.clone(), near: camera.near, far: camera.far, damping: controls.enableDamping };
    controls.enableDamping = false;
    if (${fitCamera}) {
      controls.target.copy(center);
      camera.position.copy(center).addScaledVector(direction, Math.max(distance, 0.5));
      camera.near = Math.max(0.005, distance / 1000);
      camera.far = Math.max(original.far, distance * 20);
    }
    center.copy(controls.target);
    camera.updateProjectionMatrix();
    controls.update();
    window.__previewCapture = { THREE, scene, camera, controls, root, original, hidden, style, center, baseOffset: camera.position.clone().sub(center) };
    return { center: center.toArray(), size: size.toArray(), distance, meshes: ${state.meshes} };
  })()`
  const result = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ': ' + result.exceptionDetails.exception?.description)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 898, y: 598 })
  // Discard the compositor's pre-hide frame; readiness was checked above.
  await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, { timeoutMs: 15000 })
  return { ready: true, state, framing: result.result.value }
}

export async function recordPage({ cdp, directory, entry, preparation, count = 10, intervalMs = 240, cameraMotion = false, forceNative = false }) {
  await mkdir(directory, { recursive: true })
  // Read the actual WebGL canvas immediately after Tres renders it. This avoids slow
  // desktop compositor screenshots without changing the animation clock or pixels.
  const readFrames = async (frameCount, orbit) => {
    const expression = `new Promise((resolve,reject) => {
      const capture = window.__previewCapture;
      const context = document.querySelector('canvas').__vueParentComponent.exposed.context;
      const canvas = document.querySelector('canvas');
      const frames = [];
      const start = performance.now();
      let last = -Infinity;
      let subscription;
      const timeout = setTimeout(() => {subscription?.off();reject(new Error('Rendered-canvas capture timed out'))}, 18000);
      subscription = context.renderer.onRender(() => {
        const now = performance.now();
        if (now-last < ${intervalMs}) return;
        last = now;
        try {
          const data = canvas.toDataURL('image/png').split(',')[1];
          frames.push({data, startedMs: Math.round(now-start), finishedMs: Math.round(performance.now()-start)});
          if (frames.length === ${frameCount}) {
            clearTimeout(timeout);subscription.off();resolve(frames);return;
          }
          if (${orbit}) {
            const phase = frames.length/${frameCount}*Math.PI*2;
            const spherical = new capture.THREE.Spherical().setFromVector3(capture.baseOffset);
            spherical.theta += Math.sin(phase)*0.055;
            spherical.phi += (1-Math.cos(phase))*0.018;
            const offset = new capture.THREE.Vector3().setFromSpherical(spherical);
            capture.camera.position.copy(capture.center).add(offset);capture.controls.update();
          }
        } catch(error) {clearTimeout(timeout);subscription.off();reject(error)}
      });
    })`
    const result = await cdp.send('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true}, {timeoutMs:20000})
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
    return result.result.value
  }
  const samples = forceNative ? null : await readFrames(2, false)
  const hash = data => createHash('sha256').update(data).digest('hex')
  const orbit = cameraMotion || (!forceNative && hash(samples[0].data) === hash(samples[1].data))
  const frames = []
  const rendered = await readFrames(count, orbit)
  for (const [i, result] of rendered.entries()) {
    const file = `frame-${String(i).padStart(2, '0')}.png`
    await writeFile(join(directory, file), Buffer.from(result.data, 'base64'))
    frames.push({file, startedMs: result.startedMs, finishedMs: result.finishedMs})
  }
  if (orbit) await cdp.send('Runtime.evaluate', {expression: '(() => {const c=window.__previewCapture;c.camera.position.copy(c.center).add(c.baseOffset);c.controls.update()})()'})
  const intervals = frames.slice(1).map((frame, i) => frame.startedMs - frames[i].startedMs)
  const motion = preparation.cameraTracking ? 'camera-follow-native-animation' : orbit ? 'gentle-camera-orbit' : 'native-animation'
  const manifest = { ...entry, preparation, count, intervalMs, captureMethod: 'tres-rendered-canvas-after-render', motion, frames, minIntervalMs: Math.min(...intervals), maxIntervalMs: Math.max(...intervals) }
  await writeFile(join(directory, 'capture.json'), JSON.stringify(manifest, null, 2))
  return {type: entry.type, motion: manifest.motion, maxIntervalMs: manifest.maxIntervalMs}
}
