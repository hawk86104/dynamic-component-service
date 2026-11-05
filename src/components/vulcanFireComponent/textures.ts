import * as THREE from 'three'
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js'
import { resolveVulcanFireSettings } from './defaults'
import type { VulcanFireProps } from './defaults'

const smooth = (start: number, end: number, value: number) => THREE.MathUtils.smoothstep(value, start, end)

export function createVulcanFireVolume(props: VulcanFireProps) {
  const settings = resolveVulcanFireSettings(props)
  const { volumeSize: size, volumeFrames: frames } = settings
  const density = new Uint8Array(size * size * frames)
  const noise = new ImprovedNoise()
  const seedOffset = settings.seed * 13.371
  let cursor = 0

  for (let frame = 0; frame < frames; frame++) {
    for (let row = 0; row < size; row++) {
      const height = row / (size - 1)
      // Moving around a circle makes the temporal axis periodic, including its seam.
      const phase = frame / frames * Math.PI * 2 - height * 3
      const timeX = Math.cos(phase) * 1.3
      const timeY = Math.sin(phase) * 1.3
      const bottomFade = smooth(0, 0.08, height)
      const tipFade = 1 - smooth(0.88, 1, height)
      const width = settings.flameWidth * (1 - height * 0.8) + 0.03

      for (let column = 0; column < size; column++) {
        const horizontal = column / (size - 1) * 2 - 1
        let distortion = 0
        let amplitude = 1
        let frequency = settings.volumeFrequency

        for (let octave = 0; octave < settings.volumeOctaves; octave++) {
          const first = noise.noise(
            horizontal * frequency + timeX + seedOffset,
            height * frequency + timeY,
            timeY + octave * 7.13,
          )
          const second = noise.noise(
            horizontal * frequency - timeY + 19.7,
            height * frequency + timeX - seedOffset,
            timeX + octave * 11.31,
          )
          distortion += (first + second) * 0.5 * amplitude
          amplitude *= 0.5
          frequency *= 2
        }

        const displaced = horizontal + distortion * settings.turbulence * (0.25 + height * 0.75)
        const body = 1 - smooth(0, width, Math.abs(displaced))
        const brokenTip = 1 - smooth(0.55, 1, height + distortion * 0.2)
        const edgeFade = 1 - smooth(0.8, 1, Math.abs(horizontal))
        density[cursor++] = Math.round(255 * body * bottomFade * tipFade * brokenTip * edgeFade)
      }
    }
  }

  const texture = new THREE.Data3DTexture(density, size, size, frames)
  texture.format = THREE.RedFormat
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.wrapR = THREE.RepeatWrapping
  texture.generateMipmaps = false
  texture.unpackAlignment = 1
  texture.needsUpdate = true
  return texture
}

export function createVulcanSmokeTexture() {
  const size = 128
  const density = new Uint8Array(size * size)
  const noise = new ImprovedNoise()

  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const x = column / (size - 1) * 2 - 1
      const y = row / (size - 1) * 2 - 1
      const coarse = noise.noise(x * 2.7 + 13.2, y * 2.7 - 8.1, 4.7)
      const detail = noise.noise(x * 8.3, y * 8.3, 9.6)
      const radius = Math.hypot(x, y)
      const silhouette = 1 - smooth(0.2, 0.94, radius + coarse * 0.16)
      const cloud = THREE.MathUtils.clamp(0.7 + coarse * 0.4 + detail * 0.18, 0, 1)
      density[row * size + column] = Math.round(255 * silhouette * cloud)
    }
  }

  const texture = new THREE.DataTexture(density, size, size, THREE.RedFormat)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.generateMipmaps = false
  texture.unpackAlignment = 1
  texture.needsUpdate = true
  return texture
}
