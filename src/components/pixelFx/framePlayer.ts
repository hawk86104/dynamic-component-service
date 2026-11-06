import { PAL } from '../../vendor/pixelfx/core/color.js'
import { clearFrame, composite, createFrame, createFx } from '../../vendor/pixelfx/core/fx.js'
import type { PixelFxFrame, PixelFxModule } from '../../vendor/pixelfx/core/fx.js'
import type { PixelFxProps } from './types'

// Same light-edge treatment as upstream tools/lib/fxlib.mjs (MIT).
// It prevents the glow buffer from revealing the rectangular canvas boundary.
export function fadePixelFxEdges(frame: PixelFxFrame, edge = 8): void {
  const { w, h, light } = frame
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const distance = Math.min(x, y, w - 1 - x, h - 1 - y)
      if (distance >= edge) {
        continue
      }
      const index = y * w + x
      const value = light[index]
      if (!(value & 0xFFFFFF)) {
        continue
      }
      const u = (distance + 0.5) / edge
      const k = u * u * (3 - 2 * u)
      light[index] = (value & 0xFF000000)
        | Math.round((value & 255) * k)
        | (Math.round(((value >>> 8) & 255) * k) << 8)
        | (Math.round(((value >>> 16) & 255) * k) << 16)
    }
  }
}

export type PixelFxPlaybackOptions = Pick<PixelFxProps, 'palette' | 'seed'>

export function createPixelFxFramePlayer(module: PixelFxModule, options: PixelFxPlaybackOptions = {}) {
  const meta = module.meta
  const { size: [width, height], origin: [x, y], duration, fps, loop: nativeLoop } = meta
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(fps) || fps <= 0) {
    throw new Error('Invalid PixelFX animation metadata')
  }
  const standaloneModule = meta.actor ? { ...module, meta: { ...meta, actor: false } } : module
  const frame = createFrame(width, height)
  const pixels = new Uint8ClampedArray(width * height * 4)
  const step = 1 / Math.min(60, fps)
  let playbackOptions = options

  function createInstance() {
    const { palette = '', seed } = playbackOptions
    const instanceOptions: Record<string, unknown> = { x, y }
    if (Object.hasOwn(PAL, palette)) {
      instanceOptions.palette = [...PAL[palette]]
    }
    if (Number.isSafeInteger(seed)) {
      instanceOptions.seed = seed
    }
    return createFx(standaloneModule, instanceOptions)
  }

  let instance = createInstance()
  let accumulator = 0
  let finished = false

  function render(): void {
    clearFrame(frame)
    if (!finished) {
      instance.draw(frame)
      fadePixelFxEdges(frame)
    }
    composite(frame, pixels)
  }

  function restart(nextOptions = playbackOptions): void {
    playbackOptions = nextOptions
    instance = createInstance()
    accumulator = 0
    finished = false
    render()
  }

  function advance(delta: number, playbackRate: number, loop: boolean): boolean {
    if (finished || !Number.isFinite(delta) || !Number.isFinite(playbackRate)) {
      return false
    }
    accumulator += Math.max(0, Math.min(0.25, delta)) * Math.max(0, Math.min(4, playbackRate))
    let changed = false
    while (accumulator + 1e-9 >= step && !finished) {
      accumulator = Math.max(0, accumulator - step)
      instance.update(step)
      changed = true
      const complete = nativeLoop ? instance.t + 1e-9 >= duration : instance.done()
      if (complete && !(nativeLoop && loop)) {
        if (loop) {
          instance = createInstance()
        }
        else {
          finished = true
          accumulator = 0
        }
      }
    }
    if (changed) {
      render()
    }
    return changed
  }

  render()
  return { width, height, pixels, meta, cycleDuration: duration, advance, restart, isFinished: () => finished }
}
