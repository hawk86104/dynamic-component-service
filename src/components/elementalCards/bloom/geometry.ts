import * as THREE from 'three'
import { CapsuleCurve, cardFrontDepth } from '../geometry'
import type { BloomCardOptions } from '../types'

type Point = readonly [number, number, number]
interface Profile {
  points: readonly Point[]
  width: number
  tilt: number
}

// Coordinates are relative to card width (X/Z) and height (Y), front is +Z.
const CENTER: Profile = {
  points: [[0, -0.46, -0.11], [0, -0.2, -0.23], [0.03, 0.4, -0.34], [0.07, 0.64, -0.3]],
  width: 0.22,
  tilt: 0.08,
}
const PAIRS: readonly Profile[] = [
  { points: [[0.1, -0.46, -0.1], [0.4, -0.1, -0.2], [0.62, 0.39, -0.3], [0.6, 0.55, -0.24]], width: 0.22, tilt: 0.18 },
  { points: [[0.06, -0.46, -0.06], [0.52, -0.32, -0.18], [1.02, 0.1, -0.3], [1.19, 0.33, -0.24]], width: 0.24, tilt: 0.12 },
  { points: [[0.03, -0.46, 0.02], [0.5, -0.45, 0.03], [1.04, -0.19, -0.02], [1.27, -0.04, -0.04]], width: 0.3, tilt: -0.16 },
  { points: [[0.02, -0.43, 0.06], [0.35, -0.45, 0.15], [0.87, -0.38, 0.25], [1.07, -0.37, 0.12]], width: 0.3, tilt: 0.34 },
]

export function bloomPetalProfile(options: BloomCardOptions, index: number, jitter = 0) {
  const central = options.petalCount % 2 === 1 && index === 0
  const paired = index - (options.petalCount % 2)
  const side = central ? 0 : paired % 2 === 0 ? -1 : 1
  const pairCount = Math.floor(options.petalCount / 2)
  const tier = central ? 0 : Math.floor(paired / 2) / Math.max(1, pairCount - 1) * 3
  const low = central ? CENTER : PAIRS[Math.floor(tier)]
  const high = central ? CENTER : PAIRS[Math.min(3, Math.ceil(tier))]
  const blend = tier - Math.floor(tier)
  const baseY = THREE.MathUtils.lerp(low.points[0][1], high.points[0][1], blend)
  const points = low.points.map((point, i) => new THREE.Vector3(
    THREE.MathUtils.lerp(point[0], high.points[i][0], blend) * options.width * options.petalSpread * (central ? 1 : side) * (1 + jitter * 0.02),
    (baseY + (THREE.MathUtils.lerp(point[1], high.points[i][1], blend) - baseY) * options.petalHeight) * options.height,
    THREE.MathUtils.lerp(point[2], high.points[i][2], blend) * options.width * options.petalDepth / 0.32 - options.thickness * 0.55,
  ))
  return {
    curve: new THREE.CubicBezierCurve3(points[0], points[1], points[2], points[3]),
    halfWidth: THREE.MathUtils.lerp(low.width, high.width, blend) * options.width * options.petalSpread,
    tilt: THREE.MathUtils.lerp(low.tilt, high.tilt, blend),
    side,
    tier,
    delay: central ? 0 : 0.04 + tier * 0.1,
  }
}

/** Opening is a single staggered reveal; zero duration gives an already open flower. */
export function bloomOpening(time: number, options: BloomCardOptions, delay = 0) {
  if (options.openingDuration === 0) { return options.bloomAmount }
  const t = THREE.MathUtils.clamp(time / options.openingDuration - delay, 0, 1)
  return options.bloomAmount * t * t * (3 - 2 * t)
}

export function createPetalGeometry(options: BloomCardOptions, index: number, jitter = 0) {
  const longitudinal = 48
  const transverse = 20
  const positions: number[] = []
  const closed: number[] = []
  const halos: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const profile = bloomPetalProfile(options, index, jitter)
  const p = new THREE.Vector3()
  const tangent = new THREE.Vector3()
  const across = new THREE.Vector3()
  const halo = new THREE.Vector3()
  const closedBox = new THREE.Box3()
  const closedPoint = new THREE.Vector3()
  for (let i = 0; i <= longitudinal; i++) {
    const u = i / longitudinal
    profile.curve.getPoint(u, p)
    profile.curve.getTangent(u, tangent)
    across.set(-tangent.y, tangent.x, profile.tilt * (profile.side || 1)).normalize()
    const leafWidth = Math.max(0, Math.sin(u * Math.PI)) ** 0.74 * (0.65 + u * 0.55) * profile.halfWidth
    const arch = Math.sin(u * Math.PI)
    for (let j = 0; j <= transverse; j++) {
      const v = j / transverse * 2 - 1
      const cup = options.width * options.petalCurl * arch * v * v
      const x = p.x + across.x * v * leafWidth
      const y = p.y + across.y * v * leafWidth + cup * 0.12 * profile.tier / 3
      let z = p.z + across.z * v * leafWidth + cup * 0.65 + v * arch * options.width * jitter * 0.02
      const shoulder = (options.height - options.width) * 0.5
      const distance = Math.hypot(x, y - THREE.MathUtils.clamp(y, -shoulder, shoulder)) - options.width * 0.5
      const forward = THREE.MathUtils.smoothstep(distance, 0, options.width * 0.04)
      z = THREE.MathUtils.lerp(Math.min(z, -options.thickness * 0.55 - options.width * 0.01), z, forward)
      positions.push(x, y, z)
      closedPoint.set(
        profile.side * options.width * 0.05 + across.x * v * leafWidth * 0.2 * (1 - u * 0.65),
        options.height * (-0.46 + u * 0.88 + v * v * 0.008),
        -options.thickness * 0.55 - options.width * (0.2 + u * 0.16),
      )
      closed.push(closedPoint.x, closedPoint.y, closedPoint.z)
      closedBox.expandByPoint(closedPoint)
      halo.copy(across).multiplyScalar(v * options.width * 0.024 * (0.25 + arch * 0.75))
      halo.addScaledVector(tangent, options.width * 0.018 * u ** 10)
      halos.push(halo.x, halo.y, halo.z)
      uvs.push(u, j / transverse)
      if (i < longitudinal && j < transverse) {
        const a = i * (transverse + 1) + j
        const b = a + transverse + 1
        indices.push(a, b, a + 1, a + 1, b, b + 1)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('aHalo', new THREE.Float32BufferAttribute(halos, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  const center = geometry.boundingBox!.getCenter(new THREE.Vector3())
  geometry.translate(-center.x, -center.y, -center.z)
  for (let i = 0; i < closed.length; i += 3) {
    closed[i] -= center.x
    closed[i + 1] -= center.y
    closed[i + 2] -= center.z
  }
  geometry.setAttribute('aClosed', new THREE.Float32BufferAttribute(closed, 3))
  geometry.computeBoundingSphere()
  return { geometry, center, closedCenter: closedBox.getCenter(new THREE.Vector3()), profile }
}

export function createBloomRimGeometry(options: BloomCardOptions) {
  const curve = new CapsuleCurve(options.width * 1.002, options.height * 1.001, cardFrontDepth(options.width, options.thickness))
  const geometry = new THREE.TubeGeometry(curve, 224, options.width * 0.007, 10, true)
  const uv = geometry.getAttribute('uv')
  const centers = new Float32Array(uv.count * 3)
  const point = new THREE.Vector3()
  for (let i = 0; i < uv.count; i++) {
    curve.getPointAt(uv.getX(i), point).toArray(centers, i * 3)
  }
  geometry.setAttribute('aCenter', new THREE.BufferAttribute(centers, 3))
  return geometry
}
