import * as THREE from 'three'

interface SurfaceSampler {
  cumulativeAreas: number[]
  normals: number[]
  totalArea: number
  vertices: number[]
}

export interface SurfaceSample {
  position: THREE.Vector3
  normal: THREE.Vector3
}

function seededRandom(seed: number): () => number {
  let state = (seed * 1664525 + 1013904223) >>> 0

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

function triangleData(surface: THREE.Mesh): {
  index: THREE.BufferAttribute | null
  position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined
  triangleCount: number
} {
  surface.updateWorldMatrix(true, false)
  const position = surface.geometry.getAttribute('position')
  const index = surface.geometry.index

  return {
    index,
    position,
    triangleCount: Math.floor((index?.count ?? position?.count ?? 0) / 3),
  }
}

export function surfaceArea(surface: THREE.Mesh): number {
  const { index, position, triangleCount } = triangleData(surface)
  if (!position) {
    return 0
  }

  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  const cross = new THREE.Vector3()
  let area = 0

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const offset = triangle * 3
    const first = index ? index.getX(offset) : offset
    const second = index ? index.getX(offset + 1) : offset + 1
    const third = index ? index.getX(offset + 2) : offset + 2

    a.fromBufferAttribute(position, first).applyMatrix4(surface.matrixWorld)
    b.fromBufferAttribute(position, second).applyMatrix4(surface.matrixWorld)
    c.fromBufferAttribute(position, third).applyMatrix4(surface.matrixWorld)
    area += cross.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a)).length() * 0.5
  }

  return area
}

function buildSurfaceSampler(surface: THREE.Mesh): SurfaceSampler {
  const { index, position, triangleCount } = triangleData(surface)
  const vertices: number[] = []
  const normals: number[] = []
  const cumulativeAreas: number[] = []
  let totalArea = 0

  if (!position) {
    return { vertices, normals, cumulativeAreas, totalArea }
  }

  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  const cross = new THREE.Vector3()

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const offset = triangle * 3
    const first = index ? index.getX(offset) : offset
    const second = index ? index.getX(offset + 1) : offset + 1
    const third = index ? index.getX(offset + 2) : offset + 2

    a.fromBufferAttribute(position, first).applyMatrix4(surface.matrixWorld)
    b.fromBufferAttribute(position, second).applyMatrix4(surface.matrixWorld)
    c.fromBufferAttribute(position, third).applyMatrix4(surface.matrixWorld)

    const doubleArea = cross.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a)).length()
    if (doubleArea < 1e-8) {
      continue
    }

    totalArea += doubleArea * 0.5
    cumulativeAreas.push(totalArea)
    vertices.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
    normals.push(cross.x / doubleArea, cross.y / doubleArea, cross.z / doubleArea)
  }

  return { vertices, normals, cumulativeAreas, totalArea }
}

function samplePoint(sampler: SurfaceSampler, random: () => number): SurfaceSample {
  const targetArea = random() * sampler.totalArea
  let low = 0
  let high = sampler.cumulativeAreas.length - 1

  while (low < high) {
    const middle = (low + high) >> 1
    if (sampler.cumulativeAreas[middle] < targetArea) {
      low = middle + 1
    }
    else {
      high = middle
    }
  }

  let u = random()
  let v = random()
  if (u + v > 1) {
    u = 1 - u
    v = 1 - v
  }

  const w = 1 - u - v
  const offset = low * 9

  return {
    position: new THREE.Vector3(
      sampler.vertices[offset] * w
      + sampler.vertices[offset + 3] * u
      + sampler.vertices[offset + 6] * v,
      sampler.vertices[offset + 1] * w
      + sampler.vertices[offset + 4] * u
      + sampler.vertices[offset + 7] * v,
      sampler.vertices[offset + 2] * w
      + sampler.vertices[offset + 5] * u
      + sampler.vertices[offset + 8] * v,
    ),
    normal: new THREE.Vector3(
      sampler.normals[low * 3],
      sampler.normals[low * 3 + 1],
      sampler.normals[low * 3 + 2],
    ),
  }
}

export function sampleSurfaceData(
  surface: THREE.Mesh,
  count: number,
  seed: number,
): SurfaceSample[] {
  const sampleCount = Math.floor(count)
  if (!Number.isFinite(sampleCount) || sampleCount <= 0) {
    return []
  }

  const sampler = buildSurfaceSampler(surface)
  if (sampler.totalArea === 0) {
    return []
  }

  const random = seededRandom(seed)
  const samples: SurfaceSample[] = []

  for (let index = 0; index < sampleCount; index += 1) {
    samples.push(samplePoint(sampler, random))
  }

  return samples
}
