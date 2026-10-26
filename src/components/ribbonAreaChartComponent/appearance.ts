import type { ChartPoint } from '../chart3d/data'
import type { RibbonAppearance } from './material'
import * as THREE from 'three'
import fragmentShader from '../../shader/ribbonAreaChartComponent/chart.frag?raw'
import vertexShader from '../../shader/ribbonAreaChartComponent/chart.vert?raw'
import sideFragmentShader from '../../shader/ribbonAreaChartComponent/side.frag?raw'
import sideVertexShader from '../../shader/ribbonAreaChartComponent/side.vert?raw'
import { ribbonBevel } from './geometry'
import { createRibbonGlassMaterial, createRibbonSideMaterial } from './material'

export type { RibbonAppearance } from './material'

export function createRibbonMaterial(style: RibbonAppearance, colors: string[]) {
  return [
    createRibbonGlassMaterial(style, colors, { vertexShader, fragmentShader }),
    createRibbonSideMaterial(style, { vertexShader: sideVertexShader, fragmentShader: sideFragmentShader }),
  ]
}

export function addRibbonHighlights(group: THREE.Group, points: ChartPoint[], style: RibbonAppearance, colors: string[]) {
  const palette = colors.map(color => new THREE.Color(color))
  const white = new THREE.Color('#f3fcff')
  const tint = new THREE.Color()
  const addEdge = (edge: THREE.Vector3[], front: boolean) => {
    const path = new THREE.CurvePath<THREE.Vector3>()
    for (let index = 1; index < edge.length; index++) {
      path.add(new THREE.LineCurve3(edge[index - 1], edge[index]))
    }
    const geometry = new THREE.TubeGeometry(path, Math.min(edge.length * 2, 1024), style.outlineWidth * (front ? 1 : 0.8), 6, false)
    const positions = geometry.getAttribute('position')
    const vertexColors = new Float32Array(positions.count * 3)
    for (let index = 0; index < positions.count; index++) {
      const x = THREE.MathUtils.clamp(positions.getX(index) / style.width + 0.5, 0, 1)
      const stop = x < 0.5 ? 0 : 1
      const t = THREE.MathUtils.smoothstep(x * 2 - stop, 0, 1)
      tint.lerpColors(palette[stop], palette[stop + 1], t).lerp(white, front ? 0.42 : 0.22).multiplyScalar(0.8 + style.glowIntensity * 0.6)
      tint.toArray(vertexColors, index * 3)
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3))
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: front ? 0.95 : 0.78,
      depthWrite: false,
      toneMapped: false,
    }))
    mesh.name = 'RibbonGradientHighlight'
    group.add(mesh)
  }
  for (const sign of [-1, 1]) {
    addEdge(points.map((point) => {
      const inset = ribbonBevel(point.y, style.ribbonWidth, style.bevel) * (1 - Math.SQRT1_2)
      return new THREE.Vector3(point.x, Math.max(0.012, point.y) - inset + 0.003, sign * (style.ribbonWidth / 2 - inset))
    }), sign === 1)
  }
  for (const point of [points[0], points[points.length - 1]]) {
    const height = Math.max(0.012, point.y) + 0.003
    const radius = ribbonBevel(point.y, style.ribbonWidth, style.bevel)
    const edge: THREE.Vector3[] = []
    if (radius > 0) {
      for (let step = 0; step <= 4; step++) {
        const angle = step * Math.PI / 8
        edge.push(new THREE.Vector3(point.x, height - radius + radius * Math.sin(angle), -style.ribbonWidth / 2 + radius * (1 - Math.cos(angle))))
      }
      for (let step = 0; step <= 4; step++) {
        const angle = step * Math.PI / 8
        edge.push(new THREE.Vector3(point.x, height - radius + radius * Math.cos(angle), style.ribbonWidth / 2 - radius * (1 - Math.sin(angle))))
      }
    }
    else {
      edge.push(new THREE.Vector3(point.x, height, -style.ribbonWidth / 2), new THREE.Vector3(point.x, height, style.ribbonWidth / 2))
    }
    addEdge(edge, true)
  }
}
