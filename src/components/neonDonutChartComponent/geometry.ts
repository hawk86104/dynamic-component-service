import * as THREE from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'

export function createDonutSector(innerRadius: number, radius: number, height: number, start: number, end: number, bevel: number) {
  const finish = Math.min(end, start + Math.PI * 2 - 0.00001)
  const shape = new THREE.Shape()
  shape.moveTo(Math.cos(start) * radius, Math.sin(start) * radius)
  shape.absarc(0, 0, radius, start, finish, false)
  shape.lineTo(Math.cos(finish) * innerRadius, Math.sin(finish) * innerRadius)
  shape.absarc(0, 0, innerRadius, finish, start, true)
  shape.closePath()
  const candidateBevel = Math.min(bevel, (radius - innerRadius) * 0.15, height * 0.2, (finish - start) * innerRadius * 0.15)
  const safeBevel = candidateBevel > 0.0001 ? candidateBevel : 0
  let geometry: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: safeBevel > 0,
    bevelSize: safeBevel,
    bevelThickness: safeBevel,
    bevelSegments: 3,
    curveSegments: Math.max(8, Math.ceil((finish - start) * 16)),
    steps: 1,
  })
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, safeBevel, 0)
  if (safeBevel > 0) {
    // ExtrudeGeometry splits each face; join bevel vertices for continuous glass reflections.
    const facetedGeometry = geometry
    geometry.deleteAttribute('normal')
    geometry.deleteAttribute('uv')
    geometry = mergeVertices(geometry, Math.min(0.00001, safeBevel * 0.01))
    geometry.computeVertexNormals()
    facetedGeometry.dispose()
  }
  geometry.computeBoundingBox()
  return { geometry, top: height + safeBevel * 2 }
}

export function sectorOutline(innerRadius: number, radius: number, y: number, start: number, end: number) {
  const points: THREE.Vector3[] = []
  const steps = Math.max(8, Math.ceil((end - start) * 20))
  for (let index = 0; index <= steps; index++) {
    const angle = start + (end - start) * index / steps
    points.push(new THREE.Vector3(Math.cos(angle) * radius, y, -Math.sin(angle) * radius))
  }
  for (let index = steps; index >= 0; index--) {
    const angle = start + (end - start) * index / steps
    points.push(new THREE.Vector3(Math.cos(angle) * innerRadius, y, -Math.sin(angle) * innerRadius))
  }
  return points
}
