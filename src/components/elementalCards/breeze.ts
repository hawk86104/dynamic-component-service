import * as THREE from 'three'
import fragmentShader from '../../shader/breezeElementalCardComponent/stream.frag?raw'
import vertexShader from '../../shader/breezeElementalCardComponent/stream.vert?raw'
import { createStripGeometry, disposeGroup, seededRandom } from './geometry'
import { createElementMaterial } from './material'
import type { BreezeCardOptions, EffectFactory } from './types'

export const breezeEffect: EffectFactory<BreezeCardOptions> = {
  geometryKeys: ['streamCount', 'seed'],
  create(initial) {
    const group = new THREE.Group()
    group.name = 'breeze-streams'
    const strip = createStripGeometry(100)
    const geometry = new THREE.InstancedBufferGeometry()
    geometry.setIndex(strip.index!.clone())
    for (const name of ['position', 'uv']) { geometry.setAttribute(name, strip.getAttribute(name).clone()) }
    strip.dispose()
    const seeds = new Float32Array(initial.streamCount * 4)
    const random = seededRandom(initial.seed + 831)
    for (let i = 0; i < seeds.length; i++) { seeds[i] = random() }
    geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4))
    geometry.instanceCount = initial.streamCount
    const uniforms = {
      uCardSize: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uStreamWidth: { value: 0.01 },
      uOrbitSpread: { value: 0.3 },
      uTurbulence: { value: 0.2 },
      uDepthSpread: { value: 0.6 },
      uColor: { value: new THREE.Color() },
      uIntensity: { value: 1 },
      uOpacity: { value: 1 },
    }
    const mesh = new THREE.Mesh(geometry, createElementMaterial(vertexShader, fragmentShader, uniforms, { blending: THREE.AdditiveBlending }))
    mesh.frustumCulled = false
    mesh.raycast = () => {}
    group.add(mesh)
    function configure(options: BreezeCardOptions) {
      uniforms.uCardSize.value.set(options.width, options.height)
      uniforms.uStreamWidth.value = options.streamWidth
      uniforms.uOrbitSpread.value = options.orbitSpread
      uniforms.uTurbulence.value = options.flowTurbulence
      uniforms.uDepthSpread.value = options.depthSpread
      uniforms.uColor.value.set(options.effectColor)
      uniforms.uIntensity.value = options.effectIntensity
      uniforms.uOpacity.value = options.opacity
      group.visible = options.effectIntensity > 0
    }
    configure(initial)
    return {
      group,
      configure,
      update(time) { uniforms.uTime.value = time },
      dispose() { disposeGroup(group) },
    }
  },
}
