import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import * as THREE from 'three'
import ts from 'typescript'

// CPU-only module loading: raw shaders stay strings and no renderer is constructed.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cache = new Map()
const threeModule = new vm.SyntheticModule(Object.keys(THREE), function () {
  for (const [name, value] of Object.entries(THREE)) { this.setExport(name, value) }
})
async function sourceModule(filename) {
  if (cache.has(filename)) { return cache.get(filename) }
  let module
  if (filename.endsWith('?raw')) {
    const source = await readFile(filename.slice(0, -4), 'utf8')
    module = new vm.SyntheticModule(['default'], function () { this.setExport('default', source) })
  }
  else {
    const source = await readFile(filename, 'utf8')
    const output = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      fileName: filename,
    })
    module = new vm.SourceTextModule(output.outputText, { identifier: filename })
  }
  cache.set(filename, module)
  return module
}
async function link(specifier, referencing) {
  if (specifier === 'three') { return threeModule }
  assert.ok(specifier.startsWith('.'), `Unexpected external module: ${specifier}`)
  const filename = path.resolve(path.dirname(referencing.identifier), specifier)
  return sourceModule(filename.endsWith('?raw') || path.extname(filename) ? filename : `${filename}.ts`)
}
async function load(relative) {
  const module = await sourceModule(path.join(root, relative))
  if (module.status === 'unlinked') { await module.link(link) }
  if (module.status !== 'evaluated') { await module.evaluate() }
  return module.namespace
}

let drawCount = 0
const context = new Proxy({
  measureText: text => ({ width: String(text).length * 24 }),
}, {
  get(target, key) {
    if (key in target) { return target[key] }
    return () => { drawCount++ }
  },
})
globalThis.document = {
  createElement(name) {
    assert.equal(name, 'canvas')
    return { width: 0, height: 0, getContext: () => context }
  },
  fonts: { ready: Promise.resolve() },
}

const defaults = await load('src/components/elementalCards/defaults.ts')
const geometry = await load('src/components/elementalCards/geometry.ts')
const { CardClock, createCardRuntime } = await load('src/components/elementalCards/runtime.ts')
const { ELEMENTAL_CARD_ENTRIES } = await load('src/components/elementalCards/catalog.ts')
const { solarBoundary } = await load('src/components/elementalCards/solar/geometry.ts')
for (const [width, height] of [[0.3, 12], [0.54, 0.6], [1.45, 2.45], [8, 12]]) {
  const shoulder = (height - width) * 0.5
  for (let i = 0; i <= 720; i++) {
    const p = solarBoundary(i / 720 * Math.PI * 2, width, height)
    const deltaY = p.y - Math.max(-shoulder, Math.min(shoulder, p.y))
    assert.ok(p.toArray().every(Number.isFinite))
    assert.ok(Math.abs(Math.hypot(p.x, deltaY) - width * 0.5) < 1e-5, 'Solar boundary must remain exact for supported capsule proportions')
  }
}
const cases = []
for (const kind of ['ember', 'solar', 'breeze', 'bloom']) {
  const module = await load(`src/components/elementalCards/${kind}.ts`)
  const prefix = kind.toUpperCase()
  cases.push({ kind, factory: module[`${kind}Effect`], defaults: defaults[`${prefix}_CARD_DEFAULTS`], ranges: defaults[`${prefix}_CARD_RANGES`], props: defaults[`${prefix}_CARD_PROPS`] })
}

const clock = new CardClock()
clock.tick(0.02, 1, true)
const beforePause = clock.time
clock.tick(0.02, 1, false)
clock.tick(0.02, 0, true)
clock.tick(Number.NaN, 1, true)
assert.equal(clock.time, beforePause)
clock.tick(0.02, 2, true)
assert.equal(clock.time, beforePause + 0.04)
clock.restart()
assert.equal(clock.time, 0)

for (let i = 0; i < 200; i++) {
  const a = geometry.capsulePoint(i / 200, 1.45, 2.45)
  const b = geometry.capsulePoint((i + 1) / 200, 1.45, 2.45)
  assert.ok(a.distanceTo(b) < 0.04, 'Capsule curve must stay continuous including its seam')
  assert.ok(geometry.capsuleNormal(a, 1.45, 2.45).length() > 0.99)
}

function resources(group) {
  const geometries = new Set()
  const materials = new Set()
  const textures = new Set()
  group.traverse((object) => {
    if (object.geometry) { geometries.add(object.geometry) }
    for (const material of object.material ? Array.isArray(object.material) ? object.material : [object.material] : []) {
      materials.add(material)
      if (material.map) { textures.add(material.map) }
      for (const uniform of Object.values(material.uniforms ?? {})) {
        if (uniform.value?.isTexture) { textures.add(uniform.value) }
      }
    }
  })
  return { geometries, materials, textures }
}
function finiteGeometry(buffer) {
  for (const [name, attribute] of Object.entries(buffer.attributes)) {
    assert.ok(Array.from(attribute.array).every(Number.isFinite), `Non-finite ${name}`)
  }
  if (buffer.index) {
    assert.ok(Array.from(buffer.index.array).every(index => index < buffer.getAttribute('position').count))
  }
}
function validShaders(material) {
  if (!material.isShaderMaterial) { return }
  for (const source of [material.vertexShader, material.fragmentShader]) {
    assert.ok(!source.includes('<elemental_common>'))
    assert.ok(source.includes('logdepthbuf_'))
    assert.ok(source.includes('clipping_planes_'))
    for (const [, chunk] of source.matchAll(/#include\s+<(\w+)>/g)) {
      assert.ok(chunk in THREE.ShaderChunk, `Unknown shader chunk: ${chunk}`)
    }
  }
}
const camera = new THREE.PerspectiveCamera(50, 1.5, 0.1, 100)
camera.position.set(2.5, 1.5, 7)
camera.lookAt(0, 0, 0)
camera.updateMatrixWorld()
const projectionBefore = camera.projectionMatrix.clone()
const renderer = { getDrawingBufferSize: target => target.set(1200, 800) }
const scene = new THREE.Scene()
const sentinel = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
scene.add(sentinel)

for (const entry of cases) {
  const { kind, factory, ranges, props } = entry
  const initial = entry.defaults
  const clean = defaults.sanitizeCardOptions(initial, initial, ranges)
  assert.deepEqual(clean, initial)
  const invalid = Object.fromEntries(Object.entries(initial).map(([key, value]) => [key, typeof value === 'number' ? Number.NaN : key.endsWith('Color') ? 'invalid' : value]))
  assert.deepEqual(defaults.sanitizeCardOptions(invalid, initial, ranges), initial)
  const extreme = defaults.sanitizeCardOptions(Object.fromEntries(Object.entries(initial).map(([key, value]) => [key, typeof value === 'number' ? 1e10 : value])), initial, ranges)
  assert.ok(extreme.width <= extreme.height * 0.9)
  assert.ok(extreme.thickness <= extreme.width * 0.45)

  const catalog = ELEMENTAL_CARD_ENTRIES.find(item => item.type === `${kind}ElementalCardComponent`)
  assert.ok(catalog)
  assert.deepEqual(catalog.default, initial)
  assert.deepEqual(Object.keys(props).sort(), Object.keys(initial).sort())
  for (const [key, value] of Object.entries(initial)) {
    assert.equal(props[key].default, value)
    assert.ok(key in catalog.config, `Missing ${kind} config: ${key}`)
    if (typeof value === 'number') { assert.ok(key in ranges) }
  }
  await access(path.join(root, catalog.comFile))
  await access(path.join(root, 'public', catalog.previewPath))

  const runtime = createCardRuntime(kind, initial, initial, ranges, factory)
  const another = createCardRuntime(kind, { ...initial, seed: initial.seed + 1 }, initial, ranges, factory)
  scene.add(runtime.root, another.root)
  runtime.root.position.set(1, 2, -3)
  runtime.root.rotation.set(0.3, -0.6, 0.1)
  runtime.root.scale.set(1.3, 0.8, 1.1)
  runtime.update(1, camera, renderer)
  if (kind === 'ember') {
    assert.equal(factory.ownsRim, true)
    const crown = runtime.root.getObjectByName('ember-hot-crown')
    let tongues = runtime.root.getObjectByName('ember-curling-tongues')
    const sparks = runtime.root.getObjectByName('ember-crown-sparks')
    assert.ok(crown && tongues && sparks, 'Ember must use its dedicated crown, tongues and sparks')
    assert.equal(tongues.geometry.instanceCount, initial.tongueCount * 2)
    const roots = tongues.geometry.getAttribute('aRoot')
    const depths = new Set()
    for (let i = 0; i < roots.count; i++) {
      const x = roots.getX(i)
      const y = roots.getY(i) + 0.055
      assert.ok(Math.abs(x * x + y * y - 0.25) < 1e-6, 'Flame roots must follow the upper semicircle')
      depths.add(roots.getZ(i).toFixed(3))
    }
    assert.ok(depths.size > initial.tongueCount, 'Tongues must have spatial depth')
    const shoulder = (initial.height - initial.width) * 0.5
    assert.ok(crown.position.y - crown.scale.y * 0.5 < shoulder)
    assert.ok(crown.position.y + crown.scale.y * 0.5 > initial.height * 0.5 + initial.width * 0.6)
    assert.ok(crown.scale.x / initial.width < 2)
    const phase = crown.material.uniforms.uTime.value
    runtime.configure({ ...initial, flameSpeed: 0 })
    runtime.update(2, camera, renderer)
    assert.equal(crown.material.uniforms.uTime.value, phase, 'Flame speed zero must freeze, not reset')
    assert.equal(sparks.material.uniforms.uTime.value, phase)
    runtime.configure({ ...initial, flameSpeed: 2 })
    runtime.update(2.25, camera, renderer)
    assert.equal(crown.material.uniforms.uTime.value, phase + 0.5, 'Changing speed must integrate without a phase jump')
    runtime.configure({ ...initial, flameSpeed: 0, tongueCount: initial.tongueCount + 1 })
    runtime.update(2.5, camera, renderer)
    tongues = runtime.root.getObjectByName('ember-curling-tongues')
    assert.equal(tongues.geometry.instanceCount, (initial.tongueCount + 1) * 2)
    assert.equal(tongues.material.uniforms.uTime.value, phase + 0.5, 'Topology replacement must retain the flame phase')
    runtime.configure(initial)
    runtime.update(0, camera, renderer)
    assert.equal(runtime.root.getObjectByName('ember-hot-crown').material.uniforms.uTime.value, 0)
    runtime.update(1, camera, renderer)
  }
  else if (kind === 'solar') {
    assert.equal(factory.ownsRim, true)
    const core = runtime.root.getObjectByName('solar-corona-core')
    const nearGlow = runtime.root.getObjectByName('solar-corona-near-glow')
    const outerGlow = runtime.root.getObjectByName('solar-corona-outer-glow')
    const sharp = runtime.root.getObjectByName('solar-sharp-rays')
    const shafts = runtime.root.getObjectByName('solar-soft-shafts')
    const micro = runtime.root.getObjectByName('solar-near-rays')
    const motes = runtime.root.getObjectByName('solar-rings-and-motes')
    assert.ok(core && nearGlow && outerGlow && sharp && shafts && micro && motes)
    assert.equal(core.geometry, nearGlow.geometry)
    assert.equal(core.geometry, outerGlow.geometry)
    assert.equal(sharp.geometry, shafts.geometry)
    assert.equal(sharp.geometry.instanceCount, initial.rayCount)
    assert.equal(micro.geometry.instanceCount, initial.rayCount * 2)
    const origins = sharp.geometry.getAttribute('aOrigin')
    const directions = sharp.geometry.getAttribute('aDirection')
    const styles = sharp.geometry.getAttribute('aStyle')
    const shoulder = (initial.height - initial.width) * 0.5
    let shortest = Infinity
    let longest = 0
    const depths = new Set()
    for (let i = 0; i < origins.count; i++) {
      const x = origins.getX(i)
      const y = origins.getY(i)
      const circleY = y - Math.max(-shoulder, Math.min(shoulder, y))
      assert.ok(Math.abs(Math.hypot(x, circleY) - initial.width * 0.5) < 1e-6, 'Solar beam origins must lie on the capsule')
      assert.ok(Math.abs(x * directions.getY(i) - y * directions.getX(i)) < 1e-6, 'Solar beams must point radially from the center')
      assert.ok(x * directions.getX(i) + y * directions.getY(i) > 0)
      depths.add(directions.getZ(i).toFixed(3))
      shortest = Math.min(shortest, styles.getX(i))
      longest = Math.max(longest, styles.getX(i))
    }
    assert.ok(shortest < 0.3 && longest > 0.9, 'Solar must retain varied ray lengths')
    assert.ok(depths.size > initial.rayCount * 0.7, 'Solar rays must carry independent spatial depth')
    const beforeGeometry = resources(runtime.root).geometries
    const phase = core.material.uniforms.uTime.value
    runtime.configure({ ...initial, solarSpeed: 0, coronaWidth: 0.025, coronaIntensity: 1.8, rayDepth: 0.4, ringRatio: 0.3 })
    runtime.update(2, camera, renderer)
    assert.equal(core.material.uniforms.uTime.value, phase)
    assert.equal(motes.material.uniforms.uTime.value, phase)
    assert.equal(core.material.uniforms.uCoronaWidth.value, 0.025)
    assert.equal(sharp.material.uniforms.uRayDepth.value, 0.4)
    assert.equal(motes.material.uniforms.uRingRatio.value, 0.3)
    for (const buffer of beforeGeometry) { assert.ok(resources(runtime.root).geometries.has(buffer), 'Solar style edits must retain geometry') }
    runtime.configure({ ...initial, solarSpeed: 2 })
    runtime.update(2.25, camera, renderer)
    assert.equal(core.material.uniforms.uTime.value, phase + 0.5)
    let replaced = 0
    sharp.geometry.addEventListener('dispose', () => { replaced++ })
    runtime.configure({ ...initial, solarSpeed: 0, rayCount: initial.rayCount + 1 })
    runtime.update(2.5, camera, renderer)
    assert.equal(replaced, 1, 'Shared sharp/soft geometry must be released once')
    assert.equal(runtime.root.getObjectByName('solar-sharp-rays').geometry.instanceCount, initial.rayCount + 1)
    assert.equal(runtime.root.getObjectByName('solar-near-rays').geometry.instanceCount, (initial.rayCount + 1) * 2)
    assert.equal(runtime.root.getObjectByName('solar-corona-core').material.uniforms.uTime.value, phase + 0.5)
    runtime.configure(initial)
    runtime.update(0, camera, renderer)
    assert.equal(runtime.root.getObjectByName('solar-corona-core').material.uniforms.uTime.value, 0)
    runtime.update(1, camera, renderer)
  }
  else {
    assert.equal(factory.ownsRim, undefined)
    assert.equal(factory.createParticles, undefined)
    assert.equal(factory.timeScale, undefined)
  }
  const owned = resources(runtime.root)
  const otherOwned = resources(another.root)
  for (const group of ['geometries', 'materials', 'textures']) {
    for (const item of owned[group]) { assert.ok(!otherOwned[group].has(item), `Shared owned ${kind} resource`) }
  }
  for (const buffer of owned.geometries) { finiteGeometry(buffer) }
  for (const material of owned.materials) { validShaders(material) }
  const capsule = runtime.root.getObjectByName('capsule')
  capsule.geometry.computeBoundingBox()
  const size = capsule.geometry.boundingBox.getSize(new THREE.Vector3())
  // ExtrudeGeometry bevel joins can extend a few float32 microunits past the arc.
  assert.ok(Math.abs(size.x - initial.width) < 1e-4)
  assert.ok(Math.abs(size.y - initial.height) < 1e-4)
  assert.ok(size.z > initial.thickness)

  const disposed = new Map()
  for (const group of Object.values(owned)) {
    for (const item of group) {
      disposed.set(item, 0)
      item.addEventListener('dispose', () => disposed.set(item, disposed.get(item) + 1))
    }
  }
  runtime.configure({ ...initial, title: '新的元素卡片', effectColor: '#123456', animationSpeed: 0, showLabel: false })
  const same = resources(runtime.root)
  for (const buffer of owned.geometries) { assert.ok(same.geometries.has(buffer), 'Uniform/text edits must retain geometry') }
  for (const texture of owned.textures) { assert.ok(same.textures.has(texture), 'Text edits must reuse their texture') }
  assert.equal(capsule.material.uniforms.uCardColor.value.getHexString(), new THREE.Color(initial.cardColor).getHexString())
  runtime.update(1, camera, renderer)
  assert.deepEqual(camera.projectionMatrix, projectionBefore)

  runtime.configure({ ...initial, width: initial.width * 0.8, height: initial.height * 1.2, particleCount: 0, seed: 52 })
  assert.equal(disposed.get(capsule.geometry), undefined)
  assert.ok([...owned.geometries].some(item => disposed.get(item) === 1), 'Resize must dispose replaced geometry')
  for (const buffer of resources(runtime.root).geometries) { finiteGeometry(buffer) }
  runtime.configure({ ...initial, enabled: false })
  runtime.update(2, camera, renderer)
  assert.equal(runtime.root.visible, false)
  runtime.update(2, camera, renderer, true)
  assert.equal(runtime.root.visible, true)
  runtime.configure({ ...initial, opacity: 0 })
  runtime.update(2, camera, renderer)
  assert.equal(runtime.root.visible, false)
  runtime.configure(initial)
  const ortho = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100)
  ortho.position.set(0, 0, 5)
  ortho.lookAt(0, 0, 0)
  ortho.updateMatrixWorld()
  runtime.update(3, ortho, renderer)
  const remaining = resources(runtime.root)
  for (const group of Object.values(remaining)) {
    for (const item of group) {
      if (!disposed.has(item)) {
        disposed.set(item, 0)
        item.addEventListener('dispose', () => disposed.set(item, disposed.get(item) + 1))
      }
    }
  }
  runtime.dispose()
  runtime.dispose()
  assert.equal(runtime.root.parent, null)
  assert.equal(runtime.root.children.length, 0)
  for (const count of disposed.values()) { assert.equal(count, 1, `${kind}: resources must dispose exactly once`) }
  assert.ok(scene.children.includes(another.root))
  assert.ok([...otherOwned.materials].every(item => item.uuid))
  another.dispose()
  process.stdout.write(`${kind}: geometry, controls, registration, ownership and disposal passed\n`)
}
const drawsAtDisposal = drawCount
await Promise.resolve()
assert.equal(drawCount, drawsAtDisposal, 'Late font callbacks must not redraw disposed canvases')
assert.deepEqual(scene.children, [sentinel])
sentinel.geometry.dispose()
sentinel.material.dispose()
delete globalThis.document
process.stdout.write('CPU checks passed; no WebGL context, browser, build or service was started.\n')
