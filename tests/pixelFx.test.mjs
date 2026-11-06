import { Buffer } from 'node:buffer'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
// eslint-disable-next-line test/no-import-node-test -- CPU checks use the existing Node runner.
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { compileScript, parse } from '@vue/compiler-sfc'
import * as THREE from 'three'
import { importPixelFxSource } from '../scripts/pixel-fx/import-source.mjs'
import { PAL } from '../src/vendor/pixelfx/core/color.js'
import { clearFrame, composite, createFrame, createFx } from '../src/vendor/pixelfx/core/fx.js'

const { createPixelFxFramePlayer, fadePixelFxEdges } = await importPixelFxSource('src/components/pixelFx/framePlayer.ts')
const { createPixelFxPresentation } = await importPixelFxSource('src/components/pixelFx/presentation.ts')
const { createPixelFxRuntime } = await importPixelFxSource('src/components/pixelFx/runtime.ts')
const { PIXEL_FX_EFFECTS, PIXEL_FX_FIRE_EFFECTS } = await importPixelFxSource('src/components/pixelFx/effects.ts')
const { PIXEL_FX_ENTRIES, PIXEL_FX_FIRE_ENTRIES } = await importPixelFxSource('src/components/pixelFx/catalog.ts')
const vendor = new URL('../src/vendor/pixelfx/', import.meta.url)
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const load = id => import(new URL(`fx/${id}.js`, vendor))
const hasPixels = pixels => pixels.some((value, index) => index % 4 === 3 && value > 0)

test('the pinned source and all 201 standalone entries expose the requested controls', async () => {
  const upstream = JSON.parse(readFileSync(new URL('UPSTREAM.json', vendor), 'utf8'))
  assert.equal(upstream.commit, 'a84159688af3ca37a4be05a0d422b94451b2e24e')
  for (const [file, expected] of Object.entries(upstream.files)) {
    assert.equal(hash(readFileSync(new URL(file, vendor))), expected, file)
  }
  assert.ok(!existsSync(new URL('fx/index.js', vendor)))
  assert.ok(!existsSync(new URL('gallery/fonts/', vendor)))
  assert.equal(PIXEL_FX_FIRE_ENTRIES.length, 12)
  assert.equal(PIXEL_FX_FIRE_EFFECTS.length, 12)
  assert.equal(PIXEL_FX_ENTRIES.length, 201)
  assert.equal(new Set(PIXEL_FX_ENTRIES.map(entry => entry.type)).size, 201)
  assert.equal(new Set(PIXEL_FX_ENTRIES.map(entry => entry.comFile)).size, 201)
  assert.equal(new Set(PIXEL_FX_EFFECTS.map(effect => effect.category)).size, 19)
  assert.equal(Object.keys(PAL).length, 27)
  for (const entry of PIXEL_FX_ENTRIES) {
    const effect = PIXEL_FX_EFFECTS.find(item => item.type === entry.type)
    const module = await load(effect.id)
    assert.equal(entry.default.loop, true)
    assert.equal(entry.default.seed, module.meta.options.seed)
    assert.equal(entry.default.palette, '')
    assert.equal(entry.default.mirror, false)
    assert.equal(entry.default.resolutionScale, 1)
    assert.ok(/[\u4E00-\u9FFF]/.test(entry.name))
    const controls = Object.entries(entry.config).filter(([, item]) => item.com !== 'ActionButton').map(([key]) => key)
    assert.deepEqual(Object.keys(entry.default).sort(), controls.sort())
    assert.deepEqual(entry.config.renderMode.options.map(item => item.value), ['billboard', 'sprite', 'vertical', 'ground'])
    assert.deepEqual(entry.config.resolutionScale.options.map(item => item.value), [1, 2, 4])
    assert.deepEqual(entry.config.palette.options.map(item => item.value), ['', ...Object.keys(PAL)])
    assert.equal(entry.config.newSeed.action, 'newSeed')
    assert.equal(entry.config.restart.action, 'restart')
    const filename = new URL(`../${entry.comFile.slice(2)}`, import.meta.url)
    const { descriptor, errors } = parse(readFileSync(filename, 'utf8'), { filename: fileURLToPath(filename) })
    assert.deepEqual(errors, [])
    assert.ok(descriptor.script.content.includes(`createPixelFxComponent('${effect.id}')`))
  }
})

test('all 201 effects render through complete timelines without a sample character', async () => {
  for (const effect of PIXEL_FX_EFFECTS) {
    const module = await load(effect.id)
    const player = createPixelFxFramePlayer(module, { palette: 'water', seed: 9999 })
    const pixels = player.pixels
    const frames = new Set([hash(pixels)])
    let visible = hasPixels(pixels)
    const delta = Math.min(0.1, module.meta.duration / 8)
    for (let index = 0; index <= Math.ceil((player.cycleDuration + 3) / delta); index++) {
      player.advance(delta, 1, false)
      assert.equal(player.pixels, pixels)
      frames.add(hash(pixels))
      visible ||= hasPixels(pixels)
      if (player.isFinished()) {
        break
      }
    }
    assert.ok(visible, `${effect.id} is visible`)
    assert.ok(frames.size > 1, `${effect.id} changes over time`)
    assert.ok(player.isFinished(), `${effect.id} finishes`)
    assert.equal(hasPixels(pixels), false, `${effect.id} ends transparent`)
  }
})

test('chained moves and character-dependent effects are excluded while upstream dependencies resolve', async () => {
  const ids = []
  for (const entry of readdirSync(new URL('fx/', vendor), { withFileTypes: true })) {
    if (entry.isDirectory()) {
      for (const file of readdirSync(new URL(`fx/${entry.name}/`, vendor))) {
        if (file.endsWith('.js') && !file.startsWith('_')) {
          ids.push(`${entry.name}/${file.slice(0, -3)}`)
        }
      }
    }
  }
  assert.equal(ids.length, 244)
  const published = new Set(PIXEL_FX_EFFECTS.map(effect => effect.id))
  const excluded = ids.filter(id => !published.has(id))
  assert.equal(excluded.filter(id => id.startsWith('moves/')).length, 12)
  const characterDependent = excluded.filter(id => !id.startsWith('moves/'))
  assert.equal(characterDependent.length, 31)
  for (const id of characterDependent) {
    const module = await load(id)
    assert.ok(module.meta.actor, id)
    assert.throws(() => {
      const player = createPixelFxFramePlayer(module)
      const step = 1 / module.meta.fps
      for (let index = 0; index < Math.ceil(module.meta.duration / step); index++) {
        player.advance(step, 1, false)
      }
    }, TypeError, id)
  }
  const upstream = JSON.parse(readFileSync(new URL('UPSTREAM.json', vendor), 'utf8'))
  for (const file of Object.keys(upstream.files).filter(file => file.endsWith('.js'))) {
    const url = new URL(file, vendor)
    const text = readFileSync(url, 'utf8')
    for (const [, dependency] of text.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)) {
      assert.ok(dependency.startsWith('.'), `${file} has no external runtime import`)
      assert.ok(existsSync(resolve(dirname(fileURLToPath(url)), dependency)), `${file} -> ${dependency}`)
    }
  }
  const loader = readFileSync(new URL('../src/components/pixelFx/loader.ts', import.meta.url), 'utf8')
  assert.ok(loader.includes('import.meta.glob<PixelFxModule>'))
  assert.ok(loader.includes('fx/*/*.js'))
  assert.ok(!loader.includes('eager: true'))
  assert.ok(!loader.includes('fx/index'))
})

test('palette and seed changes reproduce the native Gallery options with a reused buffer', async () => {
  const module = await load('fire/campfire')
  const player = createPixelFxFramePlayer(module)
  const pixels = player.pixels
  const step = 1 / module.meta.fps
  const [x, y] = module.meta.origin
  const originalSeed = module.meta.options.seed
  const seed = originalSeed + 1
  const frame = createFrame(player.width, player.height)
  const expected = new Uint8ClampedArray(pixels.length)
  function sample(palette, seed) {
    player.restart({ palette, seed })
    const samples = []
    for (let index = 0; index < 20; index++) {
      samples.push(hash(pixels))
      player.advance(step, 1, false)
    }
    return samples
  }
  const original = sample('', originalSeed)
  const recolored = sample('water', originalSeed)
  const reseeded = sample('water', seed)
  assert.notDeepEqual(original, recolored)
  assert.notDeepEqual(recolored, reseeded)
  assert.deepEqual(sample('water', seed), reseeded)
  assert.deepEqual(sample('__proto__', originalSeed), original)
  assert.equal(player.pixels, pixels)

  const gallery = createFx(module, { x, y, palette: PAL.water, seed })
  for (const expectedHash of reseeded) {
    clearFrame(frame)
    gallery.draw(frame)
    fadePixelFxEdges(frame)
    composite(frame, expected)
    assert.equal(hash(expected), expectedHash)
    gallery.update(step)
  }
})

test('simulation ends clear, can restart, repeats, and keeps independent instances', async () => {
  const module = await load('fire/fire-ring')
  const first = createPixelFxFramePlayer(module)
  const second = createPixelFxFramePlayer(module)
  const initial = hash(first.pixels)
  assert.notEqual(first.pixels, second.pixels)
  first.advance(0.25, 1, false)
  assert.equal(hash(second.pixels), initial)
  assert.notEqual(hash(first.pixels), initial)
  const paused = hash(first.pixels)
  assert.equal(first.advance(0.25, 0, false), false)
  assert.equal(first.advance(Number.NaN, 1, false), false)
  assert.equal(hash(first.pixels), paused)
  for (let index = 0; index < 5; index++) {
    first.advance(0.25, 4, false)
  }
  assert.equal(hasPixels(first.pixels), false)
  assert.equal(first.advance(0.25, 1, false), false)
  first.restart()
  assert.equal(hash(first.pixels), initial)
  for (let index = 0; index < 5; index++) {
    first.advance(0.25, 4, true)
  }
  assert.ok(hasPixels(first.pixels))
  const before = hash(first.pixels)
  const copy = createPixelFxFramePlayer(module)
  for (let index = 0; index < 5; index++) {
    copy.advance(0.25, 4, true)
  }
  assert.equal(hash(copy.pixels), before)
})

test('billboards stay upright and mirror about the same anchor in all presentation modes', async () => {
  const { meta } = await load('fire/fire-breath')
  const texture = new THREE.Texture()
  const presentation = createPixelFxPresentation(texture, meta)
  const [plane, sprite] = presentation.object.children
  const [mesh] = plane.children
  presentation.setAppearance(4, 0.4)
  const initialBounds = new THREE.Box3().setFromObject(mesh)
  const pivotX = 12 / 160
  const pivotY = 1 - 72 / 116
  assert.ok(Math.abs(initialBounds.min.x + 0.3) < 1e-6)
  assert.ok(Math.abs(initialBounds.max.y - 1.8) < 1e-6)
  assert.equal(sprite.center.x, pivotX)
  assert.equal(sprite.center.y, pivotY)
  assert.equal(mesh.scale.y, 4 * 116 / 160)
  const parent = new THREE.Group()
  parent.rotation.set(0.4, 1.2, -0.3)
  parent.scale.setScalar(2)
  parent.add(presentation.object)
  const camera = new THREE.PerspectiveCamera()
  const anchor = presentation.object.getWorldPosition(new THREE.Vector3())
  camera.position.copy(presentation.object.localToWorld(new THREE.Vector3(4, 8, 3)))
  camera.lookAt(anchor)
  presentation.faceCamera(camera)
  assert.ok(Math.abs(plane.rotation.y - Math.atan2(4, 3)) < 1e-10)
  assert.equal(plane.rotation.x, 0)
  assert.equal(plane.rotation.z, 0)
  const cameraNormal = camera.getWorldDirection(new THREE.Vector3()).negate()
  assert.ok(plane.getWorldDirection(new THREE.Vector3()).dot(cameraNormal) < 0.8)
  const yaw = plane.rotation.y
  camera.position.copy(presentation.object.localToWorld(new THREE.Vector3(0, 8, 0)))
  presentation.faceCamera(camera)
  assert.equal(plane.rotation.y, yaw)

  const orthographic = new THREE.OrthographicCamera()
  const backward = new THREE.Vector3(1, 2, -3).transformDirection(presentation.object.matrixWorld)
  orthographic.position.set(10, 15, 20)
  orthographic.lookAt(orthographic.position.clone().sub(backward))
  presentation.faceCamera(orthographic)
  assert.ok(Math.abs(plane.rotation.y - Math.atan2(1, -3)) < 1e-10)

  for (const mode of ['billboard', 'sprite', 'vertical', 'ground']) {
    presentation.setMode(mode)
    presentation.setAppearance(4, 0.4, true)
    assert.equal(sprite.center.x, 1 - pivotX)
    const anchorUv = sprite.center.clone().applyMatrix3(texture.matrix)
    assert.ok(anchorUv.distanceTo(new THREE.Vector2(pivotX, pivotY)) < 1e-10)
    const planeAnchor = mesh.localToWorld(new THREE.Vector3(0.5 - pivotX, pivotY - 0.5, 0))
    assert.ok(planeAnchor.distanceTo(anchor) < 1e-10)
  }
  presentation.setAppearance(4, 0.4, false)
  assert.equal(sprite.center.x, pivotX)
  assert.equal(texture.repeat.x, 1)
  presentation.setMode('ground')
  const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(plane.quaternion)
  assert.ok(normal.distanceTo(new THREE.Vector3(0, 1, 0)) < 1e-10)
  presentation.setMode('vertical')
  assert.equal(plane.rotation.x, 0)
  presentation.setMode('sprite')
  assert.equal(sprite.visible, true)
  assert.equal(mesh.visible, false)
  assert.equal(sprite.material.opacity, 0.4)
  presentation.dispose()
  texture.dispose()
})

test('native and smooth Canvas textures keep the same anchor and animation frame', async () => {
  const previousDocument = globalThis.document
  const previousImageData = globalThis.ImageData
  const canvases = []
  const uploads = []
  const draws = []
  globalThis.document = {
    createElement: () => {
      const canvas = { width: 0, height: 0 }
      const context = {
        canvas,
        putImageData: data => uploads.push(data),
        drawImage: (...args) => draws.push(args),
      }
      canvas.getContext = () => context
      canvases.push(canvas)
      return canvas
    },
  }
  globalThis.ImageData = class {
    constructor(data, width, height) {
      Object.assign(this, { data, width, height })
    }
  }
  try {
    const module = await load('fire/candle')
    const [width, height] = module.meta.size
    const runtime = createPixelFxRuntime(module)
    const [plane, sprite] = runtime.object.children
    const [mesh] = plane.children
    const anchor = mesh.position.clone()
    const texture = mesh.material.map
    const resources = [mesh.geometry, mesh.material, sprite.material, texture]
    const disposed = resources.map(() => 0)
    resources.forEach((resource, index) => resource.addEventListener('dispose', () => disposed[index]++))
    assert.equal(texture.colorSpace, THREE.SRGBColorSpace)
    assert.equal(texture.minFilter, THREE.NearestFilter)
    assert.equal(texture.magFilter, THREE.NearestFilter)
    assert.equal(texture.generateMipmaps, false)
    assert.equal(mesh.material.depthWrite, false)
    assert.equal(mesh.material.depthTest, true)
    assert.equal(mesh.material.toneMapped, false)
    assert.equal(mesh.material.blending, THREE.NormalBlending)
    runtime.tick(0.1, 1, true)
    runtime.restart({ palette: 'ice', seed: 77 })
    assert.equal(uploads.length, 3)
    assert.ok(uploads.every(image => image === uploads[0]))
    runtime.tick(0.2, 1, true)
    const frame = hash(uploads[0].data)

    runtime.setResolutionScale(2)
    const [native, scaled] = canvases
    const context = scaled.getContext('2d')
    assert.equal(texture.image, scaled)
    assert.equal(sprite.material.map, texture)
    assert.equal(texture.minFilter, THREE.LinearFilter)
    assert.equal(texture.magFilter, THREE.LinearFilter)
    assert.equal(context.imageSmoothingEnabled, true)
    assert.equal(context.globalCompositeOperation, 'copy')
    assert.deepEqual(draws.at(-1), [native, 0, 0, width * 2, height * 2])
    assert.deepEqual([scaled.width, scaled.height], [width * 2, height * 2])

    runtime.setResolutionScale(4)
    assert.equal(canvases.length, 2)
    assert.equal(texture.image, scaled)
    assert.deepEqual([scaled.width, scaled.height], [width * 4, height * 4])
    assert.deepEqual(draws.at(-1), [native, 0, 0, width * 4, height * 4])
    assert.equal(hash(uploads[0].data), frame)
    assert.ok(mesh.position.equals(anchor))

    runtime.setResolutionScale(1)
    assert.equal(texture.image, native)
    assert.equal(texture.magFilter, THREE.NearestFilter)
    assert.deepEqual([scaled.width, scaled.height], [0, 0])
    assert.deepEqual(disposed, [0, 0, 0, 3])
    const uploaded = uploads.length
    runtime.dispose()
    runtime.dispose()
    assert.deepEqual(disposed, [1, 1, 1, 4])
    runtime.tick(0.1, 1, true)
    runtime.restart()
    runtime.setResolutionScale(2)
    assert.equal(uploads.length, uploaded)
    assert.deepEqual([native.width, native.height], [0, 0])
    assert.equal(runtime.object.children.length, 0)
  }
  finally {
    globalThis.document = previousDocument
    globalThis.ImageData = previousImageData
  }
})

test('the shared Vue entry resolves all imported prop types without Vite', () => {
  const url = new URL('../src/components/pixelFx/PixelFxPlayer.vue', import.meta.url)
  const filename = fileURLToPath(url)
  const { descriptor } = parse(readFileSync(url, 'utf8'), { filename })
  const result = compileScript(descriptor, {
    id: 'pixel-fx-static-props',
    fs: { fileExists: existsSync, readFile: filename => readFileSync(filename, 'utf8') },
  })
  for (const prop of ['effectId', 'renderMode', 'resolutionScale', 'width', 'opacity', 'playing', 'playbackRate', 'loop', 'palette', 'seed', 'mirror']) {
    assert.ok(result.propsDestructureDecl || result.content.includes(prop), prop)
  }
})

test('all 201 standalone WebP assets loop and match their decoded first frames at 600x400', () => {
  const root = new URL('../public/preview/animated/pixelFx/', import.meta.url)
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8'))
  assert.equal(manifest.records.length, 201)
  assert.deepEqual(manifest.records.map(record => record.effectId).sort(), PIXEL_FX_EFFECTS.map(effect => effect.id).sort())
  function chunks(bytes) {
    const result = []
    for (let offset = 12; offset < bytes.length; offset += 8 + bytes.readUInt32LE(offset + 4) + (bytes.readUInt32LE(offset + 4) % 2)) {
      const size = bytes.readUInt32LE(offset + 4)
      result.push({ type: bytes.toString('ascii', offset, offset + 4), data: bytes.subarray(offset + 8, offset + 8 + size) })
    }
    return result
  }
  function decode(input) {
    const decoded = spawnSync('ffmpeg', ['-v', 'error', '-i', 'pipe:0', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1'], { input, maxBuffer: 2 * 1024 * 1024 })
    assert.equal(decoded.status, 0, String(decoded.stderr))
    assert.equal(decoded.stdout.length, 600 * 400 * 4)
    return decoded.stdout
  }
  for (const record of manifest.records) {
    assert.equal(record.playback, 'effect')
    assert.equal(record.actor, false)
    assert.match(record.inputSignature, /^[\da-f]{64}$/)
    const animation = readFileSync(new URL(`${record.type}.webp`, root))
    const poster = readFileSync(new URL(`${record.type}.poster.webp`, root))
    assert.equal(hash(animation), record.animationSha256)
    assert.equal(hash(poster), record.posterSha256)
    const parts = chunks(animation)
    assert.equal(parts.find(part => part.type === 'ANIM').data.readUInt16LE(4), 0)
    const extended = parts.find(part => part.type === 'VP8X').data
    assert.equal(extended.readUIntLE(4, 3) + 1, 600)
    assert.equal(extended.readUIntLE(7, 3) + 1, 400)
    const frames = parts.filter(part => part.type === 'ANMF')
    assert.ok(frames.length > 1)
    assert.equal(frames.length, record.frames)
    assert.ok(record.sampledFrames >= record.frames)
    assert.equal(frames.reduce((total, frame) => total + frame.data.readUIntLE(12, 3), 0), record.durationMs)
    const first = frames[0].data
    assert.equal(first.readUIntLE(0, 3), 0)
    assert.equal(first.readUIntLE(3, 3), 0)
    assert.equal(first.readUIntLE(6, 3) + 1, 600)
    assert.equal(first.readUIntLE(9, 3) + 1, 400)
    const header = Buffer.alloc(12)
    header.write('RIFF', 0)
    header.writeUInt32LE(4 + first.length - 16, 4)
    header.write('WEBP', 8)
    const rawFirst = decode(Buffer.concat([header, first.subarray(16)]))
    const rawPoster = decode(poster)
    assert.equal(hash(rawFirst), hash(rawPoster), record.effectId)
  }
})
