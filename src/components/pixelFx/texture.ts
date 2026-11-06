import * as THREE from 'three'
import type { PixelFxResolutionScale } from './types'

export function createPixelFxTexture(pixels: Uint8ClampedArray<ArrayBuffer>, width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('PixelFX requires Canvas 2D support')
  }
  const image = new ImageData(pixels, width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  let scale: PixelFxResolutionScale = 1
  let scaledContext: CanvasRenderingContext2D | null = null

  function upload(): void {
    context!.putImageData(image, 0, 0)
    if (scaledContext) {
      const { width, height } = scaledContext.canvas
      scaledContext.drawImage(canvas, 0, 0, width, height)
    }
    texture.needsUpdate = true
  }

  function releaseScaledCanvas(): void {
    if (scaledContext) {
      scaledContext.canvas.width = 0
      scaledContext.canvas.height = 0
      scaledContext = null
    }
  }

  function setResolutionScale(value: PixelFxResolutionScale): void {
    const nextScale = value === 2 || value === 4 ? value : 1
    if (nextScale === scale) {
      return
    }
    if (nextScale === 1) {
      releaseScaledCanvas()
    }
    else {
      const target = scaledContext ?? document.createElement('canvas').getContext('2d')
      if (!target) {
        return
      }
      target.canvas.width = width * nextScale
      target.canvas.height = height * nextScale
      target.imageSmoothingEnabled = true
      target.imageSmoothingQuality = 'high'
      target.globalCompositeOperation = 'copy'
      scaledContext = target
    }

    scale = nextScale
    // Changing image dimensions requires new GPU storage, including 2x to 4x.
    texture.dispose()
    texture.image = scaledContext?.canvas ?? canvas
    texture.minFilter = scale === 1 ? THREE.NearestFilter : THREE.LinearFilter
    texture.magFilter = texture.minFilter
    upload()
  }

  function dispose(): void {
    texture.dispose()
    canvas.width = 0
    canvas.height = 0
    releaseScaledCanvas()
  }

  upload()
  return { texture, upload, setResolutionScale, dispose }
}
