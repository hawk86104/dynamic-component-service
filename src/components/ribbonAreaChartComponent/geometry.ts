import type { ChartPoint } from '../chart3d/data'
import * as THREE from 'three'

type Vertex = [number, number, number]
interface SectionVertex {
  position: Vertex
  normal: Vertex
  surface: [number, number]
}

export function ribbonBevel(height: number, depth: number, bevel: number) {
  return Math.min(Math.max(0, bevel), depth * 0.22, Math.max(0.012, height) * 0.45)
}

/** Closed sections retain hard bases/caps and continuous normals along the roof. */
export function createRibbonGeometry(points: ChartPoint[], depth: number, bevel = 0, smooth = true, sideStyle = { gradient: 0.9, opaque: false }) {
  const buffers = Array.from({ length: 2 }, () => ({ vertices: [] as number[], normals: [] as number[], surfaces: [] as number[], colors: [] as number[] }))
  let target = buffers[0]
  const gradient = THREE.MathUtils.clamp(sideStyle.gradient, 0, 1)
  const half = depth / 2
  const heights = points.map(point => Math.max(0.012, point.y))
  const slope = (a: number, b: number) => (heights[b] - heights[a]) / Math.max(0.000001, points[b].x - points[a].x)
  const tangents = points.map((_, index) => points.length < 2 ? 0 : slope(Math.max(0, index - 1), Math.min(points.length - 1, index + 1)))
  const rounded = bevel > 0
  const sections = points.map((point, index) => {
    const height = heights[index]
    const radius = ribbonBevel(height, depth, bevel)
    const section: SectionVertex[] = []
    const add = (y: number, z: number, ny: number, nz: number) => {
      const normal = new THREE.Vector3(-tangents[index] * ny, ny, nz).normalize()
      section.push({ position: [point.x, y, z], normal: normal.toArray(), surface: [ny, y / height] })
    }
    add(0, -half, 0, -1)
    if (rounded) {
      for (let step = 0; step <= 4; step++) {
        const angle = step * Math.PI / 8
        add(height - radius + radius * Math.sin(angle), -half + radius * (1 - Math.cos(angle)), Math.sin(angle), -Math.cos(angle))
      }
      for (let step = 0; step <= 4; step++) {
        const angle = step * Math.PI / 8
        add(height - radius + radius * Math.cos(angle), half - radius * (1 - Math.sin(angle)), Math.cos(angle), Math.sin(angle))
      }
    }
    else {
      add(height, -half, 1, 0)
      add(height, half, 1, 0)
    }
    add(0, half, 0, 1)
    return section
  })
  const emit = (vertex: SectionVertex, forcedNormal?: Vertex, roof?: number) => {
    target.vertices.push(...vertex.position)
    target.normals.push(...(forcedNormal || vertex.normal))
    target.surfaces.push(roof ?? vertex.surface[0], vertex.surface[1])
    const profile = vertex.surface[1]
    const brightness = target === buffers[1] ? THREE.MathUtils.lerp(1, 0.08 + 1.12 * THREE.MathUtils.smoothstep(profile, 0, 1), gradient) : 1
    const alpha = target === buffers[1] && !sideStyle.opaque ? THREE.MathUtils.lerp(1, 0.3 + profile * 0.7, gradient) : 1
    target.colors.push(brightness, brightness, brightness, alpha)
  }
  const quad = (a: SectionVertex, b: SectionVertex, c: SectionVertex, d: SectionVertex, forcedNormal?: Vertex, roof?: number) => {
    target = roof === 0 || [a, b, c, d].every(vertex => vertex.surface[0] < 0.000001) ? buffers[1] : buffers[0]
    for (const vertex of [a, b, c, a, c, d]) {
      emit(vertex, forcedNormal, roof)
    }
  }
  for (let index = 1; index < sections.length; index++) {
    const a = sections[index - 1]
    const b = sections[index]
    const faceSlope = slope(index - 1, index)
    for (let edge = 0; edge < a.length; edge++) {
      const next = (edge + 1) % a.length
      if (edge === a.length - 1) {
        quad(a[edge], a[next], b[next], b[edge], [0, -1, 0], 0)
      }
      else if (!rounded && edge !== 1) {
        quad(a[edge], a[next], b[next], b[edge], [0, 0, edge === 0 ? -1 : 1], 0)
      }
      else if (!smooth) {
        const flat = (vertex: SectionVertex): SectionVertex => {
          const ny = vertex.surface[0]
          const nz = Math.sign(vertex.position[2]) * Math.sqrt(Math.max(0, 1 - ny * ny))
          return { ...vertex, normal: new THREE.Vector3(-faceSlope * ny, ny, nz).normalize().toArray() }
        }
        quad(flat(a[edge]), flat(a[next]), flat(b[next]), flat(b[edge]))
      }
      else {
        quad(a[edge], a[next], b[next], b[edge])
      }
    }
  }
  if (sections.length >= 2) {
    target = buffers[1]
    for (const index of [0, sections.length - 1]) {
      const section = sections[index]
      const normal: Vertex = [index === 0 ? -1 : 1, 0, 0]
      const center: SectionVertex = { position: [points[index].x, heights[index] / 2, 0], normal, surface: [0, 0.5] }
      for (let edge = 0; edge < section.length; edge++) {
        const next = (edge + 1) % section.length
        emit(center, normal, 0)
        emit(section[index === 0 ? next : edge], normal, 0)
        emit(section[index === 0 ? edge : next], normal, 0)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(buffers.flatMap(buffer => buffer.vertices), 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(buffers.flatMap(buffer => buffer.normals), 3))
  geometry.setAttribute('surface', new THREE.Float32BufferAttribute(buffers.flatMap(buffer => buffer.surfaces), 2))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(buffers.flatMap(buffer => buffer.colors), 4))
  const roofCount = buffers[0].vertices.length / 3
  geometry.addGroup(0, roofCount, 0)
  geometry.addGroup(roofCount, buffers[1].vertices.length / 3, 1)
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}
