import * as THREE from 'three'
import fragmentShader from '../../shader/bloomElementalCardComponent/petal.frag?raw'
import vertexShader from '../../shader/bloomElementalCardComponent/petal.vert?raw'
import { disposeGroup, seededRandom } from './geometry'
import { createElementMaterial } from './material'
import type { BloomCardOptions, EffectFactory } from './types'

export function createPetalGeometry(options: BloomCardOptions, index: number, jitter = 0) {
  const longitudinal = 30
  const transverse = 12
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const layer = index % 2
  const ringCount = Math.ceil(options.petalCount / 2)
  const angle = Math.floor(index / 2) / ringCount * Math.PI * 2 + layer * Math.PI / ringCount + jitter * 0.07
  const back = (1 - Math.cos(angle)) * 0.5
  const petalWidth = options.width * (0.36 + layer * 0.08)
  const rise = options.height * (0.21 + back * 0.76 + layer * 0.1) * options.petalHeight
  const baseY = -options.height * 0.47
  for (let i = 0; i <= longitudinal; i++) {
    const u = i / longitudinal
    const spread = options.width * options.petalSpread * (0.12 + Math.sin(u * Math.PI * 0.5) * (0.92 + layer * 0.13))
    const width = Math.max(0.0001, Math.sin(u * Math.PI)) ** 0.82 * petalWidth
    for (let j = 0; j <= transverse; j++) {
      const v = j / transverse * 2 - 1
      const tangent = v * width
      const radial = spread - Math.abs(v) ** 2 * options.width * 0.085 * Math.sin(u * Math.PI)
      const x = Math.sin(angle) * radial + Math.cos(angle) * tangent
      const z = Math.cos(angle) * radial - Math.sin(angle) * tangent
      const y = baseY + rise * u ** 1.35 + Math.abs(v) ** 2 * options.height * 0.045 * Math.sin(u * Math.PI)
      positions.push(x, y, z)
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
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  const center = geometry.boundingBox!.getCenter(new THREE.Vector3())
  geometry.translate(-center.x, -center.y, -center.z)
  geometry.computeBoundingSphere()
  return { geometry, center }
}

export const bloomEffect: EffectFactory<BloomCardOptions> = {
  geometryKeys: ['width', 'height', 'petalCount', 'petalSpread', 'petalHeight', 'seed'],
  create(initial) {
    const group = new THREE.Group()
    group.name = 'bloom-petals'
    const random = seededRandom(initial.seed + 291)
    const materialUniforms = Array.from({ length: initial.petalCount }, (_, index) => {
      const { geometry, center } = createPetalGeometry(initial, index, random() - 0.5)
      const uniforms = {
        uCenter: { value: center },
        uBaseY: { value: -initial.height * 0.47 },
        uOpen: { value: 1 },
        uTime: { value: 0 },
        uSway: { value: 0.1 },
        uIndex: { value: index },
        uWidth: { value: initial.width },
        uColor: { value: new THREE.Color() },
        uTipColor: { value: new THREE.Color() },
        uIntensity: { value: 1 },
        uOpacity: { value: 0.7 },
      }
      const material = createElementMaterial(vertexShader, fragmentShader, uniforms)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.name = `petal-${index + 1}`
      mesh.position.copy(center)
      mesh.frustumCulled = false
      mesh.raycast = () => {}
      group.add(mesh)
      return uniforms
    })
    function configure(options: BloomCardOptions) {
      for (const uniforms of materialUniforms) {
        uniforms.uOpen.value = options.bloomAmount
        uniforms.uSway.value = options.swayStrength
        uniforms.uColor.value.set(options.petalColor)
        uniforms.uTipColor.value.set(options.tipColor)
        uniforms.uIntensity.value = options.effectIntensity
        uniforms.uOpacity.value = options.petalOpacity * options.opacity * Math.min(1, options.effectIntensity)
      }
      group.visible = options.effectIntensity > 0
    }
    configure(initial)
    return {
      group,
      configure,
      update(time) { for (const uniforms of materialUniforms) { uniforms.uTime.value = time } },
      dispose() { disposeGroup(group) },
    }
  },
}
