import type { PixelFxModule } from '../../vendor/pixelfx/core/fx.js'
import { createPixelFxFramePlayer } from './framePlayer'
import type { PixelFxPlaybackOptions } from './framePlayer'
import { createPixelFxPresentation } from './presentation'
import { createPixelFxTexture } from './texture'
import type { PixelFxResolutionScale } from './types'

export function createPixelFxRuntime(module: PixelFxModule, options: PixelFxPlaybackOptions = {}) {
  const player = createPixelFxFramePlayer(module, options)
  const source = createPixelFxTexture(player.pixels, player.width, player.height)
  const presentation = createPixelFxPresentation(source.texture, player.meta)
  let disposed = false

  function setResolutionScale(scale: PixelFxResolutionScale): void {
    if (!disposed) {
      source.setResolutionScale(scale)
    }
  }

  function tick(delta: number, playbackRate: number, loop: boolean): void {
    if (!disposed && player.advance(delta, playbackRate, loop)) {
      source.upload()
    }
  }

  function restart(options?: PixelFxPlaybackOptions): void {
    if (!disposed) {
      player.restart(options)
      source.upload()
    }
  }

  function dispose(): void {
    if (disposed) {
      return
    }
    disposed = true
    presentation.dispose()
    source.dispose()
  }

  return { ...presentation, setResolutionScale, tick, restart, dispose }
}

export type PixelFxRuntime = ReturnType<typeof createPixelFxRuntime>
