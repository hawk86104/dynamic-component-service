import type { ChartPoint } from '../chart3d/data'
import * as THREE from 'three'

/** A closed solid: both side walls, top, bottom, and the two end caps. */
export function createRibbonGeometry(points: ChartPoint[], depth: number) {
  const vertices: number[] = []
  const half = depth / 2
  type Vertex = [number, number, number]
  const quad = (a: Vertex, b: Vertex, c: Vertex, d: Vertex) => {
    vertices.push(...a, ...b, ...c, ...a, ...c, ...d)
  }
  const top = (point: ChartPoint, z: number): Vertex => [point.x, Math.max(0.012, point.y), z]
  const bottom = (point: ChartPoint, z: number): Vertex => [point.x, 0, z]
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1]
    const b = points[index]
    quad(top(a, half), top(b, half), top(b, -half), top(a, -half))
    quad(bottom(a, -half), bottom(b, -half), bottom(b, half), bottom(a, half))
    quad(bottom(a, half), bottom(b, half), top(b, half), top(a, half))
    quad(bottom(b, -half), bottom(a, -half), top(a, -half), top(b, -half))
  }
  if (points.length >= 2) {
    const a = points[0]
    const b = points[points.length - 1]
    quad(bottom(a, -half), bottom(a, half), top(a, half), top(a, -half))
    quad(bottom(b, half), bottom(b, -half), top(b, -half), top(b, half))
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}
