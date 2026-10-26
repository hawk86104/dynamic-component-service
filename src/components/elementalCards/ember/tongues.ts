import * as THREE from 'three'
import { createStripGeometry, seededRandom } from '../geometry'
import { upperArcRoot } from './profile'

export function createEmberTongues(count: number, seed: number) {
  const strip = createStripGeometry(48)
  const geometry = new THREE.InstancedBufferGeometry()
  geometry.setIndex(strip.index!.clone())
  for (const name of ['position', 'uv']) { geometry.setAttribute(name, strip.getAttribute(name).clone()) }
  strip.dispose()
  const random = seededRandom(seed + 1521)
  const roots: number[] = []
  const shapes: number[] = []
  for (let layer = 0; layer < 2; layer++) {
    for (let i = 0; i < count; i++) {
      const x = THREE.MathUtils.clamp(((i + 0.25 + random() * 0.5) / count - 0.5) * 1.04, -0.495, 0.495)
      roots.push(x, upperArcRoot(x) - 0.055, (layer - 0.5) * 0.42 + (random() - 0.5) * 0.14)
      shapes.push(0.36 + random() * 0.43, 0.075 + random() * 0.06, random(), layer === 0 ? 0.85 : 0.6)
    }
  }
  geometry.setAttribute('aRoot', new THREE.InstancedBufferAttribute(new Float32Array(roots), 3))
  geometry.setAttribute('aShape', new THREE.InstancedBufferAttribute(new Float32Array(shapes), 4))
  geometry.instanceCount = count * 2
  return geometry
}
