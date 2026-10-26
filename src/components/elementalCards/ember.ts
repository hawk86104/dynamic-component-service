import * as THREE from 'three'
import fragmentShader from '../../shader/emberElementalCardComponent/flame.frag?raw'
import vertexShader from '../../shader/emberElementalCardComponent/flame.vert?raw'
import rimFragment from '../../shader/emberElementalCardComponent/rim.frag?raw'
import rimVertex from '../../shader/emberElementalCardComponent/rim.vert?raw'
import tongueFragment from '../../shader/emberElementalCardComponent/tongue.frag?raw'
import tongueVertex from '../../shader/emberElementalCardComponent/tongue.vert?raw'
import { getEmberProfile } from './ember/profile'
import { createEmberParticles } from './ember/sparks'
import { createEmberTongues } from './ember/tongues'
import { CapsuleCurve, cardFrontDepth, disposeGroup } from './geometry'
import { createElementMaterial } from './material'
import type { EffectFactory, EmberCardOptions } from './types'

export const emberEffect: EffectFactory<EmberCardOptions> = {
  ownsRim: true,
  timeScale: options => options.flameSpeed,
  createParticles: createEmberParticles,
  geometryKeys: ['width', 'height', 'thickness', 'tongueCount', 'seed'],
  create(initial) {
    const group = new THREE.Group()
    group.name = 'ember-fire-crown'
    const uniforms = {
      uInverseModel: { value: new THREE.Matrix4() },
      uVolumeSize: { value: new THREE.Vector3() },
      uVolumeCenter: { value: new THREE.Vector3() },
      uCardSize: { value: new THREE.Vector2() },
      uThickness: { value: initial.thickness },
      uWidth: { value: initial.width },
      uShoulder: { value: 0 },
      uFlameHeight: { value: 1 },
      uFlameWidth: { value: 1 },
      uFlameDepth: { value: 0.42 },
      uCoreBrightness: { value: 1.25 },
      uColor: { value: new THREE.Color() },
      uCoreColor: { value: new THREE.Color() },
      uTime: { value: 0 },
      uTurbulence: { value: 1 },
      uIntensity: { value: 1 },
      uOpacity: { value: 1 },
      uSeed: { value: 0 },
      uCameraDirection: { value: new THREE.Vector3() },
      uOrthographic: { value: 0 },
      uSteps: { value: 48 },
    }
    const material = createElementMaterial(vertexShader, fragmentShader, uniforms, {
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    })
    const volume = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material)
    volume.name = 'ember-hot-crown'
    volume.frustumCulled = false
    volume.raycast = () => {}
    group.add(volume)
    const tongues = new THREE.Mesh(createEmberTongues(initial.tongueCount, initial.seed), createElementMaterial(tongueVertex, tongueFragment, uniforms, { blending: THREE.AdditiveBlending }))
    tongues.name = 'ember-curling-tongues'
    tongues.frustumCulled = false
    tongues.raycast = () => {}
    group.add(tongues)
    const front = cardFrontDepth(initial.width, initial.thickness) + initial.width * 0.002
    const curve = new CapsuleCurve(initial.width * 1.005, initial.height * 1.003, front)
    for (const soft of [0, 1]) {
      const rimGeometry = new THREE.TubeGeometry(curve, 192, initial.width * (soft ? 0.021 : 0.0055), 8, true)
      const rimMaterial = createElementMaterial(rimVertex, rimFragment, { ...uniforms, uSoft: { value: soft } }, { blending: THREE.AdditiveBlending })
      const rim = new THREE.Mesh(rimGeometry, rimMaterial)
      rim.name = soft ? 'ember-rim-halo' : 'ember-burning-rim'
      rim.raycast = () => {}
      group.add(rim)
    }
    function configure(options: EmberCardOptions) {
      const profile = getEmberProfile(options)
      volume.scale.set(...profile.size)
      volume.position.set(...profile.center)
      uniforms.uVolumeSize.value.copy(volume.scale)
      uniforms.uVolumeCenter.value.copy(volume.position)
      uniforms.uCardSize.value.set(options.width, options.height)
      uniforms.uWidth.value = options.width
      uniforms.uThickness.value = options.thickness
      uniforms.uShoulder.value = profile.shoulder
      uniforms.uFlameHeight.value = options.flameHeight
      uniforms.uFlameWidth.value = options.flameWidth
      uniforms.uFlameDepth.value = options.flameDepth
      uniforms.uCoreBrightness.value = options.coreBrightness
      uniforms.uColor.value.set(options.effectColor)
      uniforms.uCoreColor.value.set(options.coreColor)
      uniforms.uTurbulence.value = options.turbulence
      uniforms.uIntensity.value = options.effectIntensity
      uniforms.uOpacity.value = options.opacity
      uniforms.uSeed.value = options.seed * 0.013
      uniforms.uSteps.value = options.rayMarchSteps
      group.visible = options.effectIntensity > 0
    }
    configure(initial)
    return {
      group,
      configure,
      update(time, camera) {
        uniforms.uTime.value = time
        camera.getWorldDirection(uniforms.uCameraDirection.value)
        uniforms.uOrthographic.value = (camera as THREE.OrthographicCamera).isOrthographicCamera ? 1 : 0
        volume.updateWorldMatrix(true, false)
        uniforms.uInverseModel.value.copy(volume.matrixWorld).invert()
      },
      dispose() { disposeGroup(group) },
    }
  },
}
