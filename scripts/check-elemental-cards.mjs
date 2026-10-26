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
const { breezeStreamPoint } = await load('src/components/elementalCards/breeze/geometry.ts')
const { bloomPetalProfile, bloomOpening, createPetalGeometry } = await load('src/components/elementalCards/bloom/geometry.ts')
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
    for (const [, name] of source.matchAll(/uniform\s+\w+\s+(u\w+)(?:\s*\[[^\]]+\])?\s*;/g)) {
      assert.ok(name in material.uniforms, `Missing shader uniform: ${name}`)
      const value = material.uniforms[name].value
      if (typeof value === 'number') { assert.ok(Number.isFinite(value), `Non-finite uniform ${name}`) }
    }
  }
}

function validAttributes(object) {
  if (!object.geometry || !object.material) { return }
  const materials = Array.isArray(object.material) ? object.material : [object.material]
  for (const material of materials) {
    if (!material.isShaderMaterial) { continue }
    for (const [, type, name] of material.vertexShader.matchAll(/attribute\s+(float|vec[234])\s+(a\w+)\s*;/g)) {
      const attribute = object.geometry.getAttribute(name)
      assert.ok(attribute, `Missing shader attribute: ${name}`)
      assert.equal(attribute.itemSize, type === 'float' ? 1 : Number(type.at(-1)))
    }
  }
}

function capsuleDistance(point, width, height) {
  const shoulder = (height - width) * 0.5
  return Math.hypot(point.x, point.y - Math.max(-shoulder, Math.min(shoulder, point.y))) - width * 0.5
}
for (const [width, height] of [[0.3, 12], [0.54, 0.6], [1.45, 2.45], [8, 12]]) {
  const options = { ...defaults.BREEZE_CARD_DEFAULTS, width, height }
  for (const lane of [0, 0.2, 0.9]) {
    for (const side of [-1, 1]) {
      let previousX = -Infinity
      for (let step = 0; step <= 1000; step++) {
        const u = step / 1000
        const point = breezeStreamPoint(u, options, lane, side, 0.37)
        assert.ok(point.toArray().every(Number.isFinite))
        assert.ok(capsuleDistance(point, width, height) >= width * 0.021, 'Wind centerlines must clear the opaque capsule at all supported aspect ratios')
        assert.ok(point.x >= previousX - 1e-7, 'Both wind branches must pass from left to right')
        previousX = point.x
      }
      for (const seam of [0.28, 0.72]) {
        const a = breezeStreamPoint(seam - 1e-7, options, lane, side, 0.37)
        const b = breezeStreamPoint(seam + 1e-7, options, lane, side, 0.37)
        assert.ok(a.distanceTo(b) < height * 1e-5, 'Wind inlets and arcs must join continuously')
      }
    }
  }
}
const flowerBox = new THREE.Box3()
for (const [width, height, petalCount, petalCurl, petalDepth, petalHeight] of [
  [1.45, 2.45, 9, 0.35, 0.32, 1],
  [0.3, 12, 6, 0, 0.05, 0.4],
  [0.54, 0.6, 7, 0.8, 0.8, 1.6],
  [8, 12, 24, 0.8, 0.8, 1.6],
]) {
  const options = defaults.sanitizeCardOptions({ ...defaults.BLOOM_CARD_DEFAULTS, width, height, petalCount, petalCurl, petalDepth, petalHeight }, defaults.BLOOM_CARD_DEFAULTS, defaults.BLOOM_CARD_RANGES)
  for (let index = 0; index < petalCount; index++) {
    const { geometry: petal, center } = createPetalGeometry(options, index)
    finiteGeometry(petal)
    const position = petal.getAttribute('position')
    const closed = petal.getAttribute('aClosed')
    const point = new THREE.Vector3()
    for (let vertex = 0; vertex < position.count; vertex++) {
      point.fromBufferAttribute(position, vertex).add(center)
      if (petalCount === 9) { flowerBox.expandByPoint(point) }
      if (capsuleDistance(point, options.width, options.height) < -1e-5) {
        assert.ok(point.z < -options.thickness * 0.5, 'Visible petal roots must remain behind the opaque card')
      }
      point.fromBufferAttribute(closed, vertex).add(center)
      assert.ok(capsuleDistance(point, options.width, options.height) < 0, 'Closed petals must fit behind the card silhouette')
      assert.ok(point.z < -options.thickness * 0.5)
    }
    petal.dispose()
  }
}
const flowerSize = flowerBox.getSize(new THREE.Vector3())
assert.ok(flowerSize.x / defaults.BLOOM_CARD_DEFAULTS.width > 2.4 && flowerSize.x / defaults.BLOOM_CARD_DEFAULTS.width < 2.7, 'Default lotus width must match the reference silhouette estimate')
assert.ok(flowerBox.max.y / defaults.BLOOM_CARD_DEFAULTS.height > 0.61 && flowerBox.max.y / defaults.BLOOM_CARD_DEFAULTS.height < 0.67)
assert.ok(flowerBox.min.y / defaults.BLOOM_CARD_DEFAULTS.height > -0.59 && flowerBox.min.y / defaults.BLOOM_CARD_DEFAULTS.height < -0.5)
assert.ok(flowerSize.z > defaults.BLOOM_CARD_DEFAULTS.width * 0.35, 'Lotus layers must carry actual spatial depth')
const central = bloomPetalProfile(defaults.BLOOM_CARD_DEFAULTS, 0)
const lateral = bloomPetalProfile(defaults.BLOOM_CARD_DEFAULTS, 5)
const low = bloomPetalProfile(defaults.BLOOM_CARD_DEFAULTS, 7)
assert.ok(central.curve.getPoint(1).y > lateral.curve.getPoint(1).y && lateral.curve.getPoint(1).y > low.curve.getPoint(1).y)
assert.ok(low.halfWidth > central.halfWidth, 'Lower petals must be broader than the central high petal')
assert.ok(bloomOpening(0.15, defaults.BLOOM_CARD_DEFAULTS, central.delay) > bloomOpening(0.15, defaults.BLOOM_CARD_DEFAULTS, low.delay))
assert.equal(bloomOpening(0, { ...defaults.BLOOM_CARD_DEFAULTS, openingDuration: 0 }), 1)
process.stdout.write(`Wind paths clear the capsule; lotus bounds: ${(flowerSize.x / defaults.BLOOM_CARD_DEFAULTS.width).toFixed(3)} card widths, Y ${(flowerBox.min.y / defaults.BLOOM_CARD_DEFAULTS.height).toFixed(3)}..${(flowerBox.max.y / defaults.BLOOM_CARD_DEFAULTS.height).toFixed(3)} card heights.\n`)
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
  else if (kind === 'breeze') {
    assert.equal(factory.ownsRim, true)
    const streams = runtime.root.getObjectByName('breeze-white-streams')
    const tails = runtime.root.getObjectByName('breeze-soft-trails')
    const rim = runtime.root.getObjectByName('breeze-edge-current')
    const glow = runtime.root.getObjectByName('breeze-edge-glow')
    const motes = runtime.root.getObjectByName('breeze-curled-motes')
    assert.ok(streams && tails && rim && glow && motes)
    assert.equal(streams.geometry, tails.geometry)
    assert.equal(rim.geometry, glow.geometry)
    assert.equal(streams.geometry.getAttribute('position').count, initial.streamCount * 226)
    assert.equal(motes.geometry.getAttribute('position').count, initial.particleCount)
    const field = streams.geometry.getAttribute('position').array.slice()
    const particlePositions = motes.geometry.getAttribute('position').array.slice()
    const phase = streams.material.uniforms.uTime.value
    const beforeGeometry = resources(runtime.root).geometries
    runtime.configure({ ...initial, flowSpeed: 0, trailLength: 0.35, trailGlow: 0, rimIntensity: 0, curlRatio: 0.3 })
    runtime.update(2, camera, renderer)
    assert.equal(streams.material.uniforms.uTime.value, phase)
    assert.equal(motes.material.uniforms.uTime.value, phase)
    assert.deepEqual(motes.geometry.getAttribute('position').array, particlePositions, 'Wind speed zero must freeze CPU particle positions too')
    assert.equal(streams.material.uniforms.uTrailLength.value, 0.35)
    assert.equal(motes.material.uniforms.uCurlRatio.value, 0.3)
    assert.equal(tails.visible, false)
    assert.equal(rim.visible, false)
    assert.equal(glow.visible, false)
    for (const buffer of beforeGeometry) { assert.ok(resources(runtime.root).geometries.has(buffer), 'Wind style edits must retain geometry') }
    runtime.configure({ ...initial, flowSpeed: 2 })
    runtime.update(2.25, camera, renderer)
    assert.equal(streams.material.uniforms.uTime.value, phase + 0.5)
    assert.notDeepEqual(motes.geometry.getAttribute('position').array, particlePositions)
    assert.deepEqual(streams.geometry.getAttribute('position').array, field, 'The full wind field must not rotate with its moving segments')
    let released = 0
    streams.geometry.addEventListener('dispose', () => { released++ })
    runtime.configure({ ...initial, flowSpeed: 0, streamCount: initial.streamCount + 2 })
    runtime.update(2.5, camera, renderer)
    assert.equal(released, 1, 'Shared wind core/tail geometry must be disposed once')
    const rebuilt = runtime.root.getObjectByName('breeze-white-streams')
    assert.equal(rebuilt.geometry.getAttribute('position').count, (initial.streamCount + 2) * 226)
    assert.equal(rebuilt.material.uniforms.uTime.value, phase + 0.5)
    runtime.configure({ ...initial, effectIntensity: 0 })
    assert.equal(runtime.root.getObjectByName('breeze-wind-field').visible, false)
    assert.equal(motes.parent.visible, false)
    runtime.configure(initial)
    runtime.update(0, camera, renderer)
    assert.equal(runtime.root.getObjectByName('breeze-white-streams').material.uniforms.uTime.value, 0)
    runtime.update(1, camera, renderer)
  }
  else if (kind === 'bloom') {
    assert.equal(factory.ownsRim, true)
    const petal = runtime.root.getObjectByName('bloom-petal-1')
    const glow = runtime.root.getObjectByName('bloom-petal-glow-1')
    const motes = runtime.root.getObjectByName('bloom-petal-flakes-and-hearts')
    assert.ok(petal && glow && motes && runtime.root.getObjectByName('bloom-pearl-rim'))
    assert.equal(petal.geometry, glow.geometry)
    assert.equal(petal.material.blending, THREE.NormalBlending)
    assert.equal(glow.material.blending, THREE.AdditiveBlending)
    assert.equal(petal.material.depthTest, true)
    assert.equal(petal.material.depthWrite, false)
    assert.equal(petal.renderOrder, 0)
    const phase = petal.material.uniforms.uTime.value
    const openCenter = petal.position.clone()
    const beforeGeometry = resources(runtime.root).geometries
    runtime.configure({ ...initial, bloomSpeed: 0, bloomAmount: 0.45, edgeBrightness: 2, veinStrength: 0.7, heartRatio: 0.4 })
    runtime.update(2, camera, renderer)
    assert.equal(petal.material.uniforms.uTime.value, phase)
    assert.equal(motes.material.uniforms.uTime.value, phase)
    assert.equal(petal.material.uniforms.uOpen.value, 0.45)
    assert.equal(petal.material.uniforms.uEdgeBrightness.value, 2)
    assert.equal(petal.material.uniforms.uVeinStrength.value, 0.7)
    assert.equal(motes.material.uniforms.uHeartRatio.value, 0.4)
    assert.notDeepEqual(petal.position, openCenter, 'Petal sorting center must follow its opening pose')
    assert.deepEqual(petal.position, glow.position)
    assert.deepEqual(petal.position, petal.material.uniforms.uSortCenter.value)
    for (const buffer of beforeGeometry) { assert.ok(resources(runtime.root).geometries.has(buffer), 'Petal surface and animation edits must retain geometry') }
    runtime.configure({ ...initial, bloomSpeed: 2 })
    runtime.update(2.25, camera, renderer)
    assert.equal(petal.material.uniforms.uTime.value, phase + 0.5)
    let released = 0
    petal.geometry.addEventListener('dispose', () => { released++ })
    runtime.configure({ ...initial, bloomSpeed: 0, petalCount: 11 })
    runtime.update(2.5, camera, renderer)
    assert.equal(released, 1, 'Shared petal surface/glow geometry must be released once')
    assert.ok(runtime.root.getObjectByName('bloom-petal-11'))
    assert.equal(runtime.root.getObjectByName('bloom-petal-1').material.uniforms.uTime.value, phase + 0.5)
    runtime.configure(initial)
    runtime.update(0, camera, renderer)
    const first = runtime.root.getObjectByName('bloom-petal-1')
    const last = runtime.root.getObjectByName(`bloom-petal-${initial.petalCount}`)
    assert.equal(first.material.uniforms.uOpen.value, 0)
    assert.equal(motes.material.uniforms.uReveal.value, 0)
    runtime.update(0.15, camera, renderer)
    assert.ok(first.material.uniforms.uOpen.value > last.material.uniforms.uOpen.value, 'Bloom replay must unfold high petals before low petals')
    runtime.update(0.8, camera, renderer)
    assert.equal(first.material.uniforms.uOpen.value, 1)
    assert.equal(last.material.uniforms.uOpen.value, 1)
    runtime.update(1, camera, renderer)
    assert.equal(last.material.uniforms.uOpen.value, 1, 'The flower must remain open after its initial reveal')
    runtime.configure({ ...initial, openingDuration: 0 })
    runtime.update(0, camera, renderer)
    assert.equal(last.material.uniforms.uOpen.value, 1)
    runtime.configure(initial)
    runtime.update(1, camera, renderer)
  }
  const owned = resources(runtime.root)
  const otherOwned = resources(another.root)
  for (const group of ['geometries', 'materials', 'textures']) {
    for (const item of owned[group]) { assert.ok(!otherOwned[group].has(item), `Shared owned ${kind} resource`) }
  }
  for (const buffer of owned.geometries) { finiteGeometry(buffer) }
  for (const material of owned.materials) { validShaders(material) }
  runtime.root.traverse(validAttributes)
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
  runtime.root.traverse((object) => {
    if (object.isPoints) { assert.equal(object.material.uniforms.uPerspective.value, 0, 'Particle size must support orthographic host cameras') }
  })
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
