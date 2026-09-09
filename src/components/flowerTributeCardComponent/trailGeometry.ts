import * as THREE from 'three'
import type { CardTrailParams } from './defaults'

export function createTrailGeometry(height: number, radius: number, params: CardTrailParams) {
  const width = height * 941 / 1672
  const r = radius * width
  const hx = width / 2
  const hy = height / 2
  // Deterministic sampling prevents unrelated changes from reshuffling the trail.
  let state = 72819
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
  const edgeCount = Math.max(8, Math.round(640 * params.outlineDensity * params.particleDensity))
  const segments = Math.max(2, Math.round(24 * params.trailDensity))
  const total = edgeCount * segments
  const positions = new Float32Array(total * 3)
  const seeds = new Float32Array(total)
  const offsets = new Float32Array(total)
  const sizes = new Float32Array(total)
  for (let i = 0; i < edgeCount; i++) {
    let x: number
    let y: number
    // Project a rectangle perimeter point onto the rounded rectangle boundary.
    const d = (i + random()) / edgeCount * 2 * (width + height)
    if (d < width) {
      x = -hx + d
      y = hy
    }
    else if (d < width + height) {
      x = hx
      y = hy - (d - width)
    }
    else if (d < 2 * width + height) {
      x = hx - (d - width - height)
      y = -hy
    }
    else {
      x = -hx
      y = -hy + (d - 2 * width - height)
    }
    const cx = Math.max(Math.abs(x) - (hx - r), 0)
    const cy = Math.max(Math.abs(y) - (hy - r), 0)
    const length = Math.hypot(cx, cy)
    if (length > r && length > 0) {
      x = Math.sign(x) * (Math.min(Math.abs(x), hx - r) + cx * r / length)
      y = Math.sign(y) * (Math.min(Math.abs(y), hy - r) + cy * r / length)
    }
    for (let j = 0; j < segments; j++) {
      const index = i * segments + j
      positions.set([x, y, 0], index * 3)
      seeds[index] = random()
      offsets[index] = (j + random()) / segments
      sizes[index] = 0.65 + random() * 0.6
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aTrailOffset', new THREE.BufferAttribute(offsets, 1))
  geometry.setAttribute('aSizeFactor', new THREE.BufferAttribute(sizes, 1))
  return geometry
}
