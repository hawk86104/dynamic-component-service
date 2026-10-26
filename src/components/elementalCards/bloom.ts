import * as THREE from 'three'
import fragmentShader from '../../shader/bloomElementalCardComponent/petal.frag?raw'
import vertexShader from '../../shader/bloomElementalCardComponent/petal.vert?raw'
import rimFragment from '../../shader/bloomElementalCardComponent/rim.frag?raw'
import rimVertex from '../../shader/bloomElementalCardComponent/rim.vert?raw'
import { bloomOpening, createBloomRimGeometry, createPetalGeometry } from './bloom/geometry'
import { createBloomParticles } from './bloom/particles'
import { disposeGroup, seededRandom } from './geometry'
import { createElementMaterial } from './material'
import type { BloomCardOptions, EffectFactory } from './types'

export { createPetalGeometry } from './bloom/geometry'

export const bloomEffect: EffectFactory<BloomCardOptions> = {
  ownsRim: true,
  timeScale: options => options.bloomSpeed,
  createParticles: createBloomParticles,
  geometryKeys: ['width', 'height', 'thickness', 'petalCount', 'petalSpread', 'petalHeight', 'petalCurl', 'petalDepth', 'seed'],
  create(initial) {
    const group = new THREE.Group()
    group.name = 'bloom-petals'
    const random = seededRandom(initial.seed + 291)
    let options = initial
    let time = 0
    const petals = Array.from({ length: initial.petalCount }, (_, index) => {
      const { geometry, center, closedCenter, profile } = createPetalGeometry(initial, index, random() - 0.5)
      const uniforms = {
        uCenter: { value: center },
        uSortCenter: { value: new THREE.Vector3() },
        uCardSize: { value: new THREE.Vector3(initial.width, initial.height, initial.thickness) },
        uOpen: { value: 0 },
        uTime: { value: 0 },
        uSway: { value: initial.swayStrength },
        uBreath: { value: initial.breathAmount },
        uIndex: { value: index },
        uColor: { value: new THREE.Color() },
        uTipColor: { value: new THREE.Color() },
        uEdgeBrightness: { value: initial.edgeBrightness },
        uVeinStrength: { value: initial.veinStrength },
        uIntensity: { value: 1 },
        uOpacity: { value: 0.7 },
      }
      const material = createElementMaterial(vertexShader, fragmentShader, { ...uniforms, uGlowPass: { value: 0 } })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.name = `bloom-petal-${index + 1}`
      mesh.frustumCulled = false
      mesh.raycast = () => {}
      const glow = new THREE.Mesh(geometry, createElementMaterial(vertexShader, fragmentShader, { ...uniforms, uGlowPass: { value: 1 } }, { blending: THREE.AdditiveBlending }))
      glow.name = `bloom-petal-glow-${index + 1}`
      glow.frustumCulled = false
      glow.raycast = () => {}
      group.add(mesh, glow)
      return { mesh, glow, uniforms, center, closedCenter, delay: profile.delay }
    })
    const rimUniforms = {
      uTime: { value: 0 },
      uTipColor: { value: new THREE.Color(initial.tipColor) },
      uColor: { value: new THREE.Color(initial.effectColor) },
      uEdgeBrightness: { value: initial.edgeBrightness },
      uIntensity: { value: initial.effectIntensity },
      uOpacity: { value: initial.opacity },
    }
    const rimGeometry = createBloomRimGeometry(initial)
    const rims = [0, 1].map((layer) => {
      const mesh = new THREE.Mesh(rimGeometry, createElementMaterial(rimVertex, rimFragment, { ...rimUniforms, uLayer: { value: layer } }, { blending: THREE.AdditiveBlending, side: THREE.FrontSide }))
      mesh.name = layer === 0 ? 'bloom-pearl-rim' : 'bloom-pearl-glow'
      mesh.frustumCulled = false
      mesh.raycast = () => {}
      group.add(mesh)
      return mesh
    })
    function pose() {
      for (const petal of petals) {
        const opening = bloomOpening(time, options, petal.delay)
        petal.uniforms.uOpen.value = opening
        petal.uniforms.uTime.value = time
        petal.uniforms.uSortCenter.value.lerpVectors(petal.closedCenter, petal.center, opening)
        petal.mesh.position.copy(petal.uniforms.uSortCenter.value)
        petal.glow.position.copy(petal.mesh.position)
      }
      rimUniforms.uTime.value = time
    }
    function configure(next: BloomCardOptions) {
      options = next
      for (const { uniforms, glow } of petals) {
        uniforms.uSway.value = next.swayStrength
        uniforms.uBreath.value = next.breathAmount
        uniforms.uColor.value.set(next.petalColor)
        uniforms.uTipColor.value.set(next.tipColor)
        uniforms.uEdgeBrightness.value = next.edgeBrightness
        uniforms.uVeinStrength.value = next.veinStrength
        uniforms.uIntensity.value = next.effectIntensity
        uniforms.uOpacity.value = next.petalOpacity * next.opacity * Math.min(1, next.effectIntensity)
        glow.visible = next.edgeBrightness > 0
      }
      rimUniforms.uTipColor.value.set(next.tipColor)
      rimUniforms.uColor.value.set(next.effectColor)
      rimUniforms.uEdgeBrightness.value = next.edgeBrightness
      rimUniforms.uIntensity.value = next.effectIntensity
      rimUniforms.uOpacity.value = next.opacity
      for (const rim of rims) { rim.visible = next.edgeBrightness > 0 }
      group.visible = next.effectIntensity > 0
      pose()
    }
    configure(initial)
    return {
      group,
      configure,
      update(nextTime) { time = nextTime; pose() },
      dispose() { disposeGroup(group) },
    }
  },
}
