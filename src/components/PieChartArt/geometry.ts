import * as THREE from 'three'
import type { ChartBuildOptions } from './types'

const MIN_SLICE_ANGLE = 0.0008

function createSliceShape(
  startAngle: number,
  endAngle: number,
  radius: number,
  innerRadius: number,
  gap: number,
  sideSegments: number,
) {
  const shape = new THREE.Shape()
  const sliceAngle = Math.max(endAngle - startAngle, MIN_SLICE_ANGLE)
  const segments = Math.max(8, Math.floor((sliceAngle / (Math.PI * 2)) * sideSegments))
  const halfGap = Math.sin(Math.max(gap, 0)) * radius
  const maxInsetAngle = sliceAngle * 0.35

  if (innerRadius > 0.01) {
    const outerInset = Math.min(
      Math.asin(Math.min(halfGap / Math.max(radius, 0.01), 0.99)),
      maxInsetAngle,
    )
    const innerInset = Math.min(
      Math.asin(Math.min(halfGap / Math.max(innerRadius, 0.01), 0.99)),
      maxInsetAngle,
    )
    const outerStart = startAngle + outerInset
    const outerEnd = endAngle - outerInset
    const innerStart = startAngle + innerInset
    const innerEnd = endAngle - innerInset

    if (outerEnd <= outerStart || innerEnd <= innerStart) {
      const midAngle = (startAngle + endAngle) / 2
      const tiny = 0.001
      shape.moveTo(Math.cos(midAngle) * innerRadius, Math.sin(midAngle) * innerRadius)
      shape.lineTo(Math.cos(midAngle - tiny) * radius, Math.sin(midAngle - tiny) * radius)
      shape.lineTo(Math.cos(midAngle + tiny) * radius, Math.sin(midAngle + tiny) * radius)
      shape.closePath()
      return shape
    }

    shape.moveTo(Math.cos(outerStart) * radius, Math.sin(outerStart) * radius)
    for (let index = 1; index <= segments; index++) {
      const angle = outerStart + (outerEnd - outerStart) * (index / segments)
      shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    }

    for (let index = segments; index >= 0; index--) {
      const angle = innerStart + (innerEnd - innerStart) * (index / segments)
      shape.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius)
    }

    shape.closePath()
    return shape
  }

  const midAngle = (startAngle + endAngle) / 2
  const halfSliceAngle = sliceAngle / 2
  const sinHalf = Math.sin(halfSliceAngle)
  const tipRadius = sinHalf > 0.000001 ? halfGap / sinHalf : halfGap * 2
  const clampedTipRadius = Math.min(tipRadius, radius * 0.85)
  const tipX = Math.cos(midAngle) * clampedTipRadius
  const tipY = Math.sin(midAngle) * clampedTipRadius
  const outerInset = Math.min(
    Math.asin(Math.min(halfGap / Math.max(radius, 0.01), 0.99)),
    maxInsetAngle,
  )
  const outerStart = startAngle + outerInset
  const outerEnd = endAngle - outerInset

  if (outerEnd <= outerStart) {
    const tiny = 0.001
    shape.moveTo(tipX, tipY)
    shape.lineTo(Math.cos(midAngle - tiny) * radius, Math.sin(midAngle - tiny) * radius)
    shape.lineTo(Math.cos(midAngle + tiny) * radius, Math.sin(midAngle + tiny) * radius)
    shape.closePath()
    return shape
  }

  shape.moveTo(tipX, tipY)
  shape.lineTo(Math.cos(outerStart) * radius, Math.sin(outerStart) * radius)
  for (let index = 1; index <= segments; index++) {
    const angle = outerStart + (outerEnd - outerStart) * (index / segments)
    shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
  }
  shape.lineTo(tipX, tipY)
  shape.closePath()

  return shape
}

function ensureNonIndexed(geometry: THREE.BufferGeometry) {
  if (!geometry.index) {
    return geometry
  }

  const nonIndexed = geometry.toNonIndexed()
  geometry.dispose()
  return nonIndexed
}

export function computeCreaseNormals(geometry: THREE.BufferGeometry, thresholdAngle: number) {
  const position = geometry.getAttribute('position')
  const count = position.count
  const positions = position.array as ArrayLike<number>
  const triangleCount = count / 3
  const faceNormals = new Float32Array(triangleCount * 3)
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const cb = new THREE.Vector3()
  const ab = new THREE.Vector3()

  for (let face = 0; face < triangleCount; face++) {
    const index = face * 3
    a.fromBufferAttribute(position, index)
    b.fromBufferAttribute(position, index + 1)
    c.fromBufferAttribute(position, index + 2)
    cb.subVectors(c, b)
    ab.subVectors(a, b)
    cb.cross(ab).normalize()
    faceNormals[face * 3] = cb.x
    faceNormals[face * 3 + 1] = cb.y
    faceNormals[face * 3 + 2] = cb.z
  }

  const precision = 10000
  const vertexMap = new Map<string, Array<{ face: number, vertex: number }>>()

  for (let index = 0; index < count; index++) {
    const x = Math.round(positions[index * 3] * precision)
    const y = Math.round(positions[index * 3 + 1] * precision)
    const z = Math.round(positions[index * 3 + 2] * precision)
    const key = `${x},${y},${z}`

    if (!vertexMap.has(key)) {
      vertexMap.set(key, [])
    }

    vertexMap.get(key)?.push({
      face: Math.floor(index / 3),
      vertex: index,
    })
  }

  const cosThreshold = Math.cos(thresholdAngle)
  const normals = new Float32Array(count * 3)
  const normalA = new THREE.Vector3()
  const normalB = new THREE.Vector3()

  vertexMap.forEach((group) => {
    group.forEach((entry) => {
      normalA.set(
        faceNormals[entry.face * 3],
        faceNormals[entry.face * 3 + 1],
        faceNormals[entry.face * 3 + 2],
      )

      let nx = normalA.x
      let ny = normalA.y
      let nz = normalA.z

      group.forEach((candidate) => {
        if (candidate === entry) {
          return
        }

        normalB.set(
          faceNormals[candidate.face * 3],
          faceNormals[candidate.face * 3 + 1],
          faceNormals[candidate.face * 3 + 2],
        )

        if (normalA.dot(normalB) >= cosThreshold) {
          nx += normalB.x
          ny += normalB.y
          nz += normalB.z
        }
      })

      const length = Math.sqrt(nx * nx + ny * ny + nz * nz)

      if (length > 0.000001) {
        nx /= length
        ny /= length
        nz /= length
      }

      normals[entry.vertex * 3] = nx
      normals[entry.vertex * 3 + 1] = ny
      normals[entry.vertex * 3 + 2] = nz
    })
  })

  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
}

export function createPieSliceGeometry(
  startAngle: number,
  endAngle: number,
  options: ChartBuildOptions,
) {
  const radius = Math.max(options.radius, 0.1)
  const innerRadius = Math.min(Math.max(options.innerRadius, 0), radius * 0.9)
  const height = Math.max(options.height, 0.01)
  const bevel = Math.min(Math.max(options.bevel, 0), radius * 0.12, height * 0.35)
  const shape = createSliceShape(
    startAngle,
    Math.max(endAngle, startAngle + MIN_SLICE_ANGLE),
    radius,
    innerRadius,
    options.gap,
    options.sideSegments,
  )
  const geometry = new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: bevel > 0,
    bevelSegments: Math.max(options.bevelSegments, 1),
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: Math.max(options.sideSegments, 8),
    depth: height,
    steps: 1,
  })

  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, bevel, 0)

  const nonIndexed = ensureNonIndexed(geometry)

  if (options.smoothShading) {
    computeCreaseNormals(nonIndexed, THREE.MathUtils.degToRad(options.creaseAngle))
  }
  else {
    nonIndexed.computeVertexNormals()
  }

  nonIndexed.computeBoundingBox()
  return nonIndexed
}
