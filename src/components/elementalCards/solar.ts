import * as THREE from 'three'
import coronaFragment from '../../shader/solarElementalCardComponent/corona.frag?raw'
import coronaVertex from '../../shader/solarElementalCardComponent/corona.vert?raw'
import fragmentShader from '../../shader/solarElementalCardComponent/rays.frag?raw'
import vertexShader from '../../shader/solarElementalCardComponent/rays.vert?raw'
import { disposeGroup } from './geometry'
import { createElementMaterial } from './material'
import { createSolarCoronaGeometry, createSolarRayGeometry } from './solar/geometry'
import { createSolarParticles } from './solar/particles'
import type { EffectFactory, SolarCardOptions } from './types'

export const solarEffect: EffectFactory<SolarCardOptions> = {
  ownsRim: true,
  timeScale: options => options.solarSpeed,
  createParticles: createSolarParticles,
  geometryKeys: ['width', 'height', 'thickness', 'rayCount', 'seed'],
  create(initial) {
    const group = new THREE.Group()
    group.name = 'solar-light-field'
    const geometry = createSolarRayGeometry(initial)
    const uniforms = {
      uTime: { value: 0 },
      uCardWidth: { value: initial.width },
      uCardSize: { value: new THREE.Vector2(initial.width, initial.height) },
      uRayLength: { value: 1 },
      uRayWidth: { value: 0.02 },
      uPulse: { value: 0.2 },
      uRayDepth: { value: 0.22 },
      uShaftOpacity: { value: 0.18 },
      uCoronaWidth: { value: 0.014 },
      uCoronaIntensity: { value: 1.35 },
      uColor: { value: new THREE.Color() },
      uCoronaColor: { value: new THREE.Color() },
      uIntensity: { value: 1 },
      uOpacity: { value: 1 },
    }
    function addRays(buffer: THREE.BufferGeometry, name: string, soft: number) {
      const material = createElementMaterial(vertexShader, fragmentShader, { ...uniforms, uSoft: { value: soft } }, { blending: THREE.AdditiveBlending })
      const mesh = new THREE.Mesh(buffer, material)
      mesh.name = name
      mesh.frustumCulled = false
      mesh.raycast = () => {}
      group.add(mesh)
      return mesh
    }
    addRays(geometry, 'solar-sharp-rays', 0)
    const softShafts = addRays(geometry, 'solar-soft-shafts', 1)
    addRays(createSolarRayGeometry(initial, true), 'solar-near-rays', 0)
    const coronaGeometry = createSolarCoronaGeometry(initial)
    const coronaMeshes = [1, 3.4, 9].map((scale, index) => {
      const material = createElementMaterial(coronaVertex, coronaFragment, { ...uniforms, uLayerScale: { value: scale } }, { blending: THREE.AdditiveBlending, side: THREE.FrontSide })
      const mesh = new THREE.Mesh(coronaGeometry, material)
      mesh.name = ['solar-corona-core', 'solar-corona-near-glow', 'solar-corona-outer-glow'][index]
      mesh.frustumCulled = false
      mesh.raycast = () => {}
      group.add(mesh)
      return mesh
    })
    function configure(options: SolarCardOptions) {
      uniforms.uRayLength.value = options.rayLength
      uniforms.uRayWidth.value = options.rayWidth
      uniforms.uPulse.value = options.pulseAmount
      uniforms.uRayDepth.value = options.rayDepth
      uniforms.uShaftOpacity.value = options.shaftOpacity
      uniforms.uCoronaWidth.value = options.coronaWidth
      uniforms.uCoronaIntensity.value = options.coronaIntensity
      uniforms.uColor.value.set(options.effectColor)
      uniforms.uCoronaColor.value.set(options.coronaColor)
      uniforms.uIntensity.value = options.effectIntensity
      uniforms.uOpacity.value = options.opacity
      group.visible = options.effectIntensity > 0
      softShafts.visible = options.shaftOpacity > 0
      for (const mesh of coronaMeshes) { mesh.visible = options.coronaIntensity > 0 }
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
