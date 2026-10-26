import * as THREE from 'three'
import cardFragment from '../../shader/elementalCards/card.frag?raw'
import cardVertex from '../../shader/elementalCards/card.vert?raw'
import glowFragment from '../../shader/elementalCards/glow.frag?raw'
import glowVertex from '../../shader/elementalCards/glow.vert?raw'
import { CapsuleCurve, cardFrontDepth, createCapsuleGeometry, disposeGroup } from './geometry'
import { createCardLabel } from './label'
import { createElementMaterial } from './material'
import type { CardOptions, ElementKind } from './types'

export function createCardBody(kind: ElementKind, initial: CardOptions, showRim = true) {
  const group = new THREE.Group()
  group.name = `${kind}-card-body`
  const uniforms = {
    uCardSize: { value: new THREE.Vector3() },
    uCardColor: { value: new THREE.Color() },
    uSecondaryColor: { value: new THREE.Color() },
    uHighlightColor: { value: new THREE.Color() },
    uShine: { value: 1 },
    uOpacity: { value: 1 },
    uTime: { value: 0 },
  }
  const material = createElementMaterial(cardVertex, cardFragment, uniforms, { transparent: false, depthWrite: true, side: THREE.FrontSide })
  const card = new THREE.Mesh(new THREE.BufferGeometry(), material)
  card.name = 'capsule'
  const rimMaterial = new THREE.MeshBasicMaterial({ color: initial.effectColor, toneMapped: false, transparent: true, depthWrite: false })
  const rim = new THREE.Mesh(new THREE.BufferGeometry(), rimMaterial)
  const softRimMaterial = new THREE.MeshBasicMaterial({ color: initial.effectColor, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  const softRim = new THREE.Mesh(new THREE.BufferGeometry(), softRimMaterial)
  rim.visible = showRim
  softRim.visible = showRim
  const label = createCardLabel(kind, initial)
  const labelMaterial = new THREE.MeshBasicMaterial({ map: label.texture, transparent: true, toneMapped: false, depthWrite: false })
  const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), labelMaterial)
  const glowUniforms = {
    uColor: { value: new THREE.Color(initial.effectColor) },
    uIntensity: { value: 1 },
    uOpacity: { value: 1 },
    uGround: { value: 0 },
  }
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), createElementMaterial(glowVertex, glowFragment, glowUniforms, {
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  }))
  const groundUniforms = {
    uColor: { value: new THREE.Color(initial.effectColor) },
    uIntensity: { value: 1 },
    uOpacity: { value: 1 },
    uGround: { value: 1 },
  }
  const ground = new THREE.Group()
  ground.name = 'local-ground-glow'
  const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), createElementMaterial(glowVertex, glowFragment, groundUniforms, {
    blending: THREE.AdditiveBlending,
  }))
  groundMesh.rotation.x = -Math.PI / 2
  ground.add(groundMesh)
  for (const mesh of [rim, softRim, labelMesh, glow, groundMesh]) { mesh.raycast = () => {} }
  group.add(card, rim, softRim, labelMesh, glow)
  let options: CardOptions | undefined

  function configure(next: CardOptions) {
    if (!options || next.width !== options.width || next.height !== options.height || next.thickness !== options.thickness) {
      card.geometry.dispose()
      card.geometry = createCapsuleGeometry(next.width, next.height, next.thickness)
      const z = cardFrontDepth(next.width, next.thickness)
      const curve = new CapsuleCurve(next.width, next.height, z - next.width * 0.004)
      rim.geometry.dispose()
      rim.geometry = new THREE.TubeGeometry(curve, 160, next.width * 0.0045, 6, true)
      softRim.geometry.dispose()
      softRim.geometry = new THREE.TubeGeometry(curve, 160, next.width * 0.016, 8, true)
      labelMesh.scale.set(next.width * 0.96, next.height * 0.96, 1)
      labelMesh.position.z = z + 0.006
      glow.scale.set(next.width * 0.88, next.height * 0.69, next.width * 0.65)
      glow.position.z = -next.width * 0.12
      groundMesh.scale.set(next.width * 4.2, next.width * 2.6, 1)
      ground.position.y = -next.height * 0.5 - next.height * 0.19
    }
    uniforms.uCardSize.value.set(next.width, next.height, next.thickness)
    uniforms.uCardColor.value.set(next.cardColor)
    uniforms.uSecondaryColor.value.set(next.secondaryColor)
    uniforms.uHighlightColor.value.set(next.highlightColor)
    uniforms.uShine.value = next.surfaceShine
    uniforms.uOpacity.value = next.opacity
    const transparent = next.opacity < 0.999
    if (material.transparent !== transparent) {
      material.transparent = transparent
      material.depthWrite = !transparent
      material.needsUpdate = true
    }
    rimMaterial.color.set(next.highlightColor).lerp(new THREE.Color(next.effectColor), 0.36)
    rimMaterial.opacity = Math.min(1, next.effectIntensity * 0.8) * next.opacity
    softRimMaterial.color.set(next.effectColor)
    softRimMaterial.opacity = Math.min(0.42, next.effectIntensity * 0.17) * next.opacity
    label.configure(next)
    labelMesh.visible = next.showLabel
    labelMaterial.opacity = next.opacity
    glowUniforms.uColor.value.set(next.effectColor)
    glowUniforms.uIntensity.value = next.effectIntensity
    glowUniforms.uOpacity.value = next.opacity
    groundUniforms.uColor.value.set(next.effectColor)
    groundUniforms.uIntensity.value = next.groundGlowIntensity * next.effectIntensity
    groundUniforms.uOpacity.value = next.opacity
    ground.visible = next.showGroundGlow
    options = next
  }
  configure(initial)
  return {
    group,
    ground,
    configure,
    update(time: number) { uniforms.uTime.value = time },
    dispose() {
      disposeGroup(group)
      disposeGroup(ground)
      label.dispose()
    },
  }
}
