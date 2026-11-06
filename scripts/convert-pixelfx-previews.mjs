import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { backdrop } from '../src/vendor/pixelfx/core/scene.js'
import { importPixelFxSource } from './pixel-fx/import-source.mjs'

const { PIXEL_FX_EFFECTS } = await importPixelFxSource('src/components/pixelFx/effects.ts')
const { createPixelFxFramePlayer } = await importPixelFxSource('src/components/pixelFx/framePlayer.ts')
const out = new URL('../public/preview/animated/pixelFx/', import.meta.url)
mkdirSync(out, { recursive: true })
const manifestUrl = new URL('manifest.json', out)
const previous = existsSync(manifestUrl) ? JSON.parse(readFileSync(manifestUrl, 'utf8')) : null
const records = new Map((previous?.records ?? []).map(record => [record.type, record]))
const source = JSON.parse(readFileSync(new URL('../src/vendor/pixelfx/UPSTREAM.json', import.meta.url), 'utf8'))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const playerHash = hash(readFileSync(new URL('../src/components/pixelFx/framePlayer.ts', import.meta.url)))
const dependencies = new Map()
const sourceHashes = new Map()

function encode(input, width, height, fps, filename, animated) {
  const result = spawnSync('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-f',
    'rawvideo',
    '-pixel_format',
    'rgba',
    '-video_size',
    `${width}x${height}`,
    '-framerate',
    String(fps),
    '-i',
    'pipe:0',
    '-vf',
    'scale=600:400:force_original_aspect_ratio=decrease:flags=neighbor,pad=600:400:(ow-iw)/2:(oh-ih)/2:color=0x111018,setsar=1',
    ...(animated ? ['-c:v', 'libwebp_anim', '-loop', '0'] : ['-frames:v', '1', '-c:v', 'libwebp']),
    '-lossless',
    '1',
    '-compression_level',
    '6',
    filename,
  ], { input, maxBuffer: 32 * 1024 * 1024 })
  if (result.error || result.status !== 0) {
    throw result.error ?? new Error(String(result.stderr))
  }
}

function encodedFrames(filename) {
  const bytes = readFileSync(filename)
  let frames = 0
  let durationMs = 0
  for (let offset = 12; offset < bytes.length;) {
    const size = bytes.readUInt32LE(offset + 4)
    if (bytes.toString('ascii', offset, offset + 4) === 'ANMF') {
      frames++
      durationMs += bytes.readUIntLE(offset + 20, 3)
    }
    offset += 8 + size + size % 2
  }
  return { frames, durationMs }
}

function dependencyHashes(filename, seen = new Set()) {
  if (seen.has(filename)) {
    return seen
  }
  seen.add(filename)
  if (!dependencies.has(filename)) {
    const bytes = readFileSync(new URL(`../src/vendor/pixelfx/${filename}`, import.meta.url))
    const text = bytes.toString('utf8')
    sourceHashes.set(filename, hash(bytes))
    const imports = [...text.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)].map(match => match[1]).filter(value => value.startsWith('.'))
    dependencies.set(filename, imports.map((value) => {
      const url = new URL(value, new URL(`../src/vendor/pixelfx/${filename}`, import.meta.url))
      const root = new URL('../src/vendor/pixelfx/', import.meta.url)
      return decodeURIComponent(url.href.slice(root.href.length))
    }))
  }
  for (const dependency of dependencies.get(filename)) {
    dependencyHashes(dependency, seen)
  }
  return seen
}

function signature(effect, fps) {
  const files = [...dependencyHashes(`fx/${effect.id}.js`)].sort().map(file => [file, sourceHashes.get(file)])
  return hash(JSON.stringify({ version: 2, commit: source.commit, playerHash, files, playback: 'effect', fps, output: [600, 400] }))
}

function saveManifest() {
  const next = new URL('manifest.json.tmp', out)
  writeFileSync(next, `${JSON.stringify({
    source: source.repository,
    commit: source.commit,
    method: 'Standalone PixelFX frames converted offline',
    records: PIXEL_FX_EFFECTS.map(effect => records.get(effect.type)).filter(Boolean),
  }, null, 2)}\n`)
  renameSync(next, manifestUrl)
}

function compositePreview(player, background) {
  const rgba = Buffer.alloc(player.width * player.height * 4)
  let score = 0
  for (let pixel = 0; pixel < player.width * player.height; pixel++) {
    const offset = pixel * 4
    const alpha = player.pixels[offset + 3] / 255
    const bg = background[pixel]
    for (let channel = 0; channel < 3; channel++) {
      const value = player.pixels[offset + channel]
      score += value * alpha
      rgba[offset + channel] = Math.round(value * alpha + ((bg >>> (channel * 8)) & 255) * (1 - alpha))
    }
    rgba[offset + 3] = 255
  }
  return { rgba, score }
}

let completed = 0
let converted = 0
for (const effect of PIXEL_FX_EFFECTS) {
  const module = await import(new URL(`../src/vendor/pixelfx/fx/${effect.id}.js`, import.meta.url))
  const fps = module.meta.duration < 1 ? module.meta.fps : 12
  const inputSignature = signature(effect, fps)
  const animation = fileURLToPath(new URL(`${effect.type}.webp`, out))
  const poster = fileURLToPath(new URL(`${effect.type}.poster.webp`, out))
  const old = records.get(effect.type)
  const validFiles = old && existsSync(animation) && existsSync(poster)
    && statSync(animation).size === old.animationBytes && statSync(poster).size === old.posterBytes
  const legacyFire = effect.category === 'fire' && !old?.inputSignature && previous?.commit === source.commit
  if (validFiles && (old.inputSignature === inputSignature || legacyFire)) {
    const animationSha256 = hash(readFileSync(animation))
    const posterSha256 = hash(readFileSync(poster))
    if (legacyFire || (old.animationSha256 === animationSha256 && old.posterSha256 === posterSha256)) {
      records.set(effect.type, { ...old, playback: 'effect', actor: false, inputSignature, animationSha256, posterSha256 })
      completed++
      continue
    }
  }
  const player = createPixelFxFramePlayer(module)
  const { width, height } = player
  const background = backdrop(module.meta.bg, width, height, player.meta.origin[1])
  const frames = []
  let peak = 0
  let peakScore = -1
  const limit = Math.ceil((player.cycleDuration + 3) * fps)
  for (let index = 0; index <= limit; index++) {
    const { rgba, score } = compositePreview(player, background)
    if (score > peakScore) {
      peakScore = score
      peak = index
    }
    frames.push(rgba)
    player.advance(1 / fps, 1, false)
    if (player.isFinished()) {
      if (!module.meta.loop) {
        const ending = compositePreview(player, background).rgba
        for (let hold = 0; hold < Math.ceil(fps * 0.45); hold++) {
          frames.push(ending)
        }
      }
      break
    }
  }
  if (!player.isFinished() || peakScore <= 0) {
    throw new Error(`PixelFX preview failed to finish or has no visible pixels: ${effect.id}`)
  }
  // The gallery is cyclic: begin at a visible representative frame and keep
  // the remainder of the same cycle, including the one-shot's ending pause.
  const ordered = [...frames.slice(peak), ...frames.slice(0, peak)]
  encode(Buffer.concat(ordered), width, height, fps, animation, true)
  encode(ordered[0], width, height, fps, poster, false)
  const encoded = encodedFrames(animation)
  if (encoded.frames < 2) {
    throw new Error(`PixelFX preview has no changing frames: ${effect.id}`)
  }
  records.set(effect.type, {
    effectId: effect.id,
    type: effect.type,
    width: 600,
    height: 400,
    sampleFps: fps,
    sampledFrames: frames.length,
    ...encoded,
    firstSourceTime: peak / fps,
    playback: 'effect',
    actor: false,
    inputSignature,
    animationBytes: statSync(animation).size,
    posterBytes: statSync(poster).size,
    animationSha256: hash(readFileSync(animation)),
    posterSha256: hash(readFileSync(poster)),
  })
  completed++
  converted++
  saveManifest()
  console.log(`[${completed}/${PIXEL_FX_EFFECTS.length}] ${effect.id}: ${encoded.frames} frames, ${statSync(animation).size} bytes`)
}

saveManifest()
console.log(`Complete: ${completed} effects (${converted} converted, ${completed - converted} retained)`)
