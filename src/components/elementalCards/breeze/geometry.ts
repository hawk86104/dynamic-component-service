import * as THREE from 'three'
import { CapsuleCurve, cardFrontDepth, seededRandom } from '../geometry'
import type { BreezeCardOptions } from '../types'

function cubic(a: number, b: number, c: number, d: number, t: number) {
  const s = 1 - t
  return s * s * s * a + 3 * s * s * t * b + 3 * s * t * t * c + t * t * t * d
}

/** Open streamline: horizontal inlet, capsule crown, horizontal outlet. */
export function breezeStreamPoint(progress: number, options: BreezeCardOptions, lane: number, side: number, phase: number, target = new THREE.Vector3()) {
  const u = THREE.MathUtils.clamp(progress, 0, 1)
  const width = options.width
  const radius = width * (0.522 + lane * options.orbitSpread)
  const shoulder = (options.height - width) * 0.5
  const reach = Math.max(width * (0.9 + lane * 0.6), radius + width * 0.28)
  const inlet = shoulder * lane * 0.12 + (radius - width * 0.5) * 0.16
  let x: number
  let y: number
  if (u < 0.28 || u > 0.72) {
    const t = u < 0.28 ? u / 0.28 : (1 - u) / 0.28
    x = cubic(-reach, -radius, -radius, -radius, t) * (u < 0.28 ? 1 : -1)
    y = cubic(inlet, inlet, shoulder - radius * 0.2, shoulder, t)
  }
  else {
    const angle = (1 - (u - 0.28) / 0.44) * Math.PI
    x = Math.cos(angle) * radius
    y = shoulder + Math.sin(angle) * radius
  }
  const z = -options.thickness * 0.12 + width * options.depthSpread * (Math.sin(u * Math.PI * 2 + phase * Math.PI * 2) * 0.55 + Math.sin(phase * 17) * 0.18)
  return target.set(x, y * side, z)
}

export function createBreezeStreamGeometry(options: BreezeCardOptions) {
  const segments = 112
  const positions: number[] = []
  const across: number[] = []
  const uvs: number[] = []
  const seeds: number[] = []
  const lanes: number[] = []
  const indices: number[] = []
  const random = seededRandom(options.seed + 831)
  const p = new THREE.Vector3()
  const before = new THREE.Vector3()
  const after = new THREE.Vector3()
  const normal = new THREE.Vector3()
  const perSide = Math.ceil(options.streamCount / 2)
  for (let stream = 0; stream < options.streamCount; stream++) {
    const side = stream % 2 === 0 ? 1 : -1
    const lane = ((Math.floor(stream / 2) + 0.18 + random() * 0.6) / perSide) ** 1.25
    const seed = [random(), random(), random(), random()]
    const base = positions.length / 3
    for (let i = 0; i <= segments; i++) {
      const u = i / segments
      breezeStreamPoint(u, options, lane, side, seed[3], p)
      breezeStreamPoint(u - 0.0001, options, lane, side, seed[3], before)
      breezeStreamPoint(u + 0.0001, options, lane, side, seed[3], after)
      after.sub(before).normalize()
      normal.set(-after.y, after.x, after.z * 0.12).normalize()
      for (const edge of [0, 1]) {
        positions.push(p.x, p.y, p.z)
        across.push(normal.x, normal.y, normal.z)
        uvs.push(u, edge)
        seeds.push(...seed)
        lanes.push(lane)
      }
      if (i < segments) {
        const a = base + i * 2
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('aAcross', new THREE.Float32BufferAttribute(across, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 4))
  geometry.setAttribute('aLane', new THREE.Float32BufferAttribute(lanes, 1))
  geometry.setIndex(indices)
  geometry.computeBoundingSphere()
  return geometry
}

export function createBreezeRimGeometry(options: BreezeCardOptions) {
  const curve = new CapsuleCurve(options.width * 1.003, options.height * 1.002, cardFrontDepth(options.width, options.thickness))
  const geometry = new THREE.TubeGeometry(curve, 224, options.width * 0.007, 10, true)
  const centers = new Float32Array(geometry.getAttribute('position').count * 3)
  const uv = geometry.getAttribute('uv')
  const point = new THREE.Vector3()
  for (let i = 0; i < uv.count; i++) {
    curve.getPointAt(uv.getX(i), point).toArray(centers, i * 3)
  }
  geometry.setAttribute('aCenter', new THREE.BufferAttribute(centers, 3))
  return geometry
}
