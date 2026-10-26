import * as THREE from 'three'
import fragmentShader from '../../shader/breezeElementalCardComponent/stream.frag?raw'
import vertexShader from '../../shader/breezeElementalCardComponent/stream.vert?raw'
import rimFragment from '../../shader/breezeElementalCardComponent/rim.frag?raw'
import rimVertex from '../../shader/breezeElementalCardComponent/rim.vert?raw'
import { createBreezeRimGeometry, createBreezeStreamGeometry } from './breeze/geometry'
import { createBreezeParticles } from './breeze/particles'
import { disposeGroup } from './geometry'
import { createElementMaterial } from './material'
import type { BreezeCardOptions, EffectFactory } from './types'

export const breezeEffect: EffectFactory<BreezeCardOptions> = {
  ownsRim: true,
  timeScale: options => options.flowSpeed,
  createParticles: createBreezeParticles,
  geometryKeys: ['width', 'height', 'thickness', 'streamCount', 'orbitSpread', 'depthSpread', 'seed'],
  create(initial) {
    const group = new THREE.Group()
    group.name = 'breeze-wind-field'
    const geometry = createBreezeStreamGeometry(initial)
    const uniforms = {
      uTime: { value: 0 },
      uWidth: { value: initial.width },
      uStreamWidth: { value: initial.streamWidth },
      uTurbulence: { value: initial.flowTurbulence },
      uTrailLength: { value: initial.trailLength },
      uTrailGlow: { value: initial.trailGlow },
      uRimIntensity: { value: initial.rimIntensity },
      uColor: { value: new THREE.Color(initial.effectColor) },
      uIntensity: { value: 1 },
      uOpacity: { value: 1 },
    }
    function addMesh(buffer: THREE.BufferGeometry, vertex: string, fragment: string, name: string, layer: number) {
      const material = createElementMaterial(vertex, fragment, { ...uniforms, uLayer: { value: layer } }, { blending: THREE.AdditiveBlending })
      const mesh = new THREE.Mesh(buffer, material)
      mesh.name = name
      mesh.frustumCulled = false
      mesh.raycast = () => {}
      group.add(mesh)
      return mesh
    }
    const tails = addMesh(geometry, vertexShader, fragmentShader, 'breeze-soft-trails', 1)
    addMesh(geometry, vertexShader, fragmentShader, 'breeze-white-streams', 0)
    const rim = createBreezeRimGeometry(initial)
    const core = addMesh(rim, rimVertex, rimFragment, 'breeze-edge-current', 0)
    const halo = addMesh(rim, rimVertex, rimFragment, 'breeze-edge-glow', 1)
    function configure(options: BreezeCardOptions) {
      uniforms.uStreamWidth.value = options.streamWidth
      uniforms.uTurbulence.value = options.flowTurbulence
      uniforms.uTrailLength.value = options.trailLength
      uniforms.uTrailGlow.value = options.trailGlow
      uniforms.uRimIntensity.value = options.rimIntensity
      uniforms.uColor.value.set(options.effectColor)
      uniforms.uIntensity.value = options.effectIntensity
      uniforms.uOpacity.value = options.opacity
      group.visible = options.effectIntensity > 0
      tails.visible = options.trailGlow > 0
      core.visible = options.rimIntensity > 0
      halo.visible = options.rimIntensity > 0
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
