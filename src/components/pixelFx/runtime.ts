import * as THREE from 'three'
import type { PixelFxModule } from '../../vendor/pixelfx/core/fx.js'
import { createPixelFxFramePlayer } from './framePlayer'
import type { PixelFxPlaybackOptions } from './framePlayer'
import { createPixelFxPresentation } from './presentation'

export function createPixelFxRuntime(module: PixelFxModule, options: PixelFxPlaybackOptions = {}) {
  const player = createPixelFxFramePlayer(module, options)
  const canvas = document.createElement('canvas')
  canvas.width = player.width
  canvas.height = player.height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('PixelFX requires Canvas 2D support')
  }
  const imageData = new ImageData(player.pixels, player.width, player.height)
  context.putImageData(imageData, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  const presentation = createPixelFxPresentation(texture, player.meta)
  let disposed = false

  function upload(): void {
    context!.putImageData(imageData, 0, 0)
    texture.needsUpdate = true
  }

  function tick(delta: number, playbackRate: number, loop: boolean): void {
    if (!disposed && player.advance(delta, playbackRate, loop)) {
      upload()
    }
  }

  function restart(options?: PixelFxPlaybackOptions): void {
    if (!disposed) {
      player.restart(options)
      upload()
    }
  }

  function dispose(): void {
    if (disposed) {
      return
    }
    disposed = true
    presentation.dispose()
    texture.dispose()
    canvas.width = 0
    canvas.height = 0
  }

  return { ...presentation, tick, restart, dispose }
}

export type PixelFxRuntime = ReturnType<typeof createPixelFxRuntime>
