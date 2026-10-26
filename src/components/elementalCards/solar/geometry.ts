import * as THREE from 'three'
import { CapsuleCurve, cardFrontDepth, createStripGeometry, seededRandom } from '../geometry'
import type { SolarCardOptions } from '../types'

/** Intersect a ray from the card center with a vertical capsule. */
export function solarBoundary(angle: number, width: number, height: number, target = new THREE.Vector3()) {
  const x = Math.cos(angle)
  const y = Math.sin(angle)
  const radius = width * 0.5
  const shoulder = (height - width) * 0.5
  const sideDistance = Math.abs(x) > 1e-8 ? radius / Math.abs(x) : Infinity
  const distance = Math.abs(sideDistance * y) <= shoulder
    ? sideDistance
    : shoulder * Math.abs(y) + Math.sqrt(Math.max(0, radius * radius - shoulder * shoulder * x * x))
  return target.set(x * distance, y * distance, 0)
}

export function createSolarRayGeometry(options: SolarCardOptions, micro = false) {
  const strip = createStripGeometry(24)
  const geometry = new THREE.InstancedBufferGeometry()
  geometry.setIndex(strip.index!.clone())
  for (const name of ['position', 'uv']) { geometry.setAttribute(name, strip.getAttribute(name).clone()) }
  strip.dispose()
  const count = options.rayCount * (micro ? 2 : 1)
  const origins: number[] = []
  const directions: number[] = []
  const styles: number[] = []
  const seeds: number[] = []
  const random = seededRandom(options.seed + (micro ? 2381 : 1381))
  for (let i = 0; i < count; i++) {
    const angle = (i + 0.15 + random() * 0.7) / count * Math.PI * 2
    const p = solarBoundary(angle, options.width, options.height)
    origins.push(p.x, p.y, -options.thickness * 0.35)
    directions.push(Math.cos(angle), Math.sin(angle), random() * 2 - 1)
    const role = i % 8
    const length = micro ? 0.045 + random() * 0.16 : role < 3 ? 0.14 + random() * 0.16 : role < 6 ? 0.36 + random() * 0.34 : 0.85 + random() * 0.4
    const width = micro ? 0.22 + random() * 0.23 : 0.4 + random() * 0.9
    styles.push(length, width, 0.55 + random() * 0.45, micro ? 1 : 0)
    seeds.push(random(), random(), random(), random())
  }
  geometry.setAttribute('aOrigin', new THREE.InstancedBufferAttribute(new Float32Array(origins), 3))
  geometry.setAttribute('aDirection', new THREE.InstancedBufferAttribute(new Float32Array(directions), 3))
  geometry.setAttribute('aStyle', new THREE.InstancedBufferAttribute(new Float32Array(styles), 4))
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(seeds), 4))
  geometry.instanceCount = count
  return geometry
}

export function createSolarCoronaGeometry(options: SolarCardOptions) {
  const curve = new CapsuleCurve(options.width * 1.004, options.height * 1.002, cardFrontDepth(options.width, options.thickness) + options.width * 0.002)
  const geometry = new THREE.TubeGeometry(curve, 256, options.width * 0.014, 12, true)
  const uv = geometry.getAttribute('uv')
  const centers = new Float32Array(uv.count * 3)
  const point = new THREE.Vector3()
  for (let i = 0; i < uv.count; i++) {
    curve.getPointAt(uv.getX(i), point)
    point.toArray(centers, i * 3)
  }
  geometry.setAttribute('aCenter', new THREE.BufferAttribute(centers, 3))
  return geometry
}
