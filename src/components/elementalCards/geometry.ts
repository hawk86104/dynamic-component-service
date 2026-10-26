import * as THREE from 'three'

export function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

export function capsulePoint(t: number, width: number, height: number, target = new THREE.Vector3()) {
  const radius = width * 0.5
  const straight = Math.max(0, (height - width) * 0.5)
  const arc = Math.PI * radius
  const side = straight * 2
  let distance = THREE.MathUtils.euclideanModulo(t, 1) * (arc * 2 + side * 2)
  if (distance < arc) {
    const angle = distance / radius
    return target.set(Math.cos(angle) * radius, straight + Math.sin(angle) * radius, 0)
  }
  distance -= arc
  if (distance < side) { return target.set(-radius, straight - distance, 0) }
  distance -= side
  if (distance < arc) {
    const angle = Math.PI + distance / radius
    return target.set(Math.cos(angle) * radius, -straight + Math.sin(angle) * radius, 0)
  }
  return target.set(radius, -straight + distance - arc, 0)
}

export function capsuleNormal(point: THREE.Vector3, width: number, height: number) {
  const straight = Math.max(0, (height - width) * 0.5)
  return new THREE.Vector3(point.x, point.y - THREE.MathUtils.clamp(point.y, -straight, straight), 0).normalize()
}

export class CapsuleCurve extends THREE.Curve<THREE.Vector3> {
  constructor(private width: number, private height: number, private depth = 0) { super() }
  getPoint(t: number, target = new THREE.Vector3()) {
    capsulePoint(t, this.width, this.height, target)
    target.z = this.depth
    return target
  }
}

export function cardFrontDepth(width: number, thickness: number) {
  return thickness * 0.5 + Math.min(thickness * 0.28, width * 0.035)
}

export function createCapsuleGeometry(width: number, height: number, thickness: number) {
  const bevel = Math.min(width * 0.035, thickness * 0.28)
  const w = width - bevel * 2
  const h = height - bevel * 2
  const r = w * 0.5
  const y = (h - w) * 0.5
  const shape = new THREE.Shape()
  shape.moveTo(r, -y)
  shape.lineTo(r, y)
  shape.absarc(0, y, r, 0, Math.PI, false)
  shape.lineTo(-r, -y)
  shape.absarc(0, -y, r, Math.PI, Math.PI * 2, false)
  shape.closePath()
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 32,
    steps: 1,
  })
  geometry.translate(0, 0, -thickness * 0.5)
  return geometry
}

export function createStripGeometry(segments: number) {
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= segments; i++) {
    const u = i / segments
    for (const side of [-1, 1]) {
      positions.push(u, side, 0)
      uvs.push(u, (side + 1) * 0.5)
    }
    if (i < segments) {
      const a = i * 2
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  return geometry
}

export function disposeGroup(group: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  group.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (mesh.geometry) { geometries.add(mesh.geometry) }
    if (mesh.material) {
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) { materials.add(material) }
    }
  })
  for (const geometry of geometries) { geometry.dispose() }
  for (const material of materials) { material.dispose() }
  group.removeFromParent()
  group.clear()
}
