import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import fragmentShader from '../../shader/flowerTributeCardComponent/trail.frag?raw'
import vertexShader from '../../shader/flowerTributeCardComponent/trail.vert?raw'
import { CardMotionHistory } from './motionHistory'
import { createTrailGeometry } from './trailGeometry'

import { CARD_TRAIL_DEFAULTS, type CardTrailParams } from './defaults'

type NumericTrailKey = {
  [K in keyof CardTrailParams]: CardTrailParams[K] extends number ? K : never
}[keyof CardTrailParams]

const sanitizeColor = (value: string, fallback: string) =>
  typeof value === 'string' && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value.trim()) ? value.trim() : fallback

export function sanitizeTrailParams(params: CardTrailParams): CardTrailParams {
  const clamp = (key: NumericTrailKey, min: number, max: number) => {
    const value = params[key]
    return Number.isFinite(value) ? THREE.MathUtils.clamp(value, min, max) : CARD_TRAIL_DEFAULTS[key]
  }
  return {
    particleGradient: params.particleGradient ?? CARD_TRAIL_DEFAULTS.particleGradient,
    particleColor: sanitizeColor(params.particleColor, CARD_TRAIL_DEFAULTS.particleColor),
    particleColorStart: sanitizeColor(params.particleColorStart, CARD_TRAIL_DEFAULTS.particleColorStart),
    particleColorMiddle: sanitizeColor(params.particleColorMiddle, CARD_TRAIL_DEFAULTS.particleColorMiddle),
    particleColorEnd: sanitizeColor(params.particleColorEnd, CARD_TRAIL_DEFAULTS.particleColorEnd),
    outlineDensity: clamp('outlineDensity', 0.05, 1),
    particleDensity: clamp('particleDensity', 0.05, 1),
    trailDensity: clamp('trailDensity', 0.05, 1),
    particleSize: clamp('particleSize', 0.1, 2),
    particleSizeMultiplier: clamp('particleSizeMultiplier', 0.05, 20),
    particleOpacity: clamp('particleOpacity', 0, 1),
    particleSpeed: clamp('particleSpeed', 0, 6),
    trailLength: clamp('trailLength', 0.1, 20),
    turbulence: clamp('turbulence', 0, 4),
    trailAmplitude: clamp('trailAmplitude', 0, 5),
  }
}

export function createCardParticleTrail() {
  const history = new CardMotionHistory()
  const uniforms = {
    uHistory: { value: history.matrices },
    uPhase: { value: 0 },
    uParticleSize: { value: CARD_TRAIL_DEFAULTS.particleSize * CARD_TRAIL_DEFAULTS.particleSizeMultiplier },
    uWorldScale: { value: 1 },
    uAmplitude: { value: CARD_TRAIL_DEFAULTS.trailAmplitude },
    uTurbulence: { value: CARD_TRAIL_DEFAULTS.turbulence },
    uCornerRadius: { value: 0.06 },
    uCardWidth: { value: 6.45 * 941 / 1672 },
    uTrailLength: { value: CARD_TRAIL_DEFAULTS.trailLength },
    uOpacity: { value: 0.75 },
    uColorA: { value: new THREE.Color(CARD_TRAIL_DEFAULTS.particleColorStart) },
    uColorB: { value: new THREE.Color(CARD_TRAIL_DEFAULTS.particleColorMiddle) },
    uColorC: { value: new THREE.Color(CARD_TRAIL_DEFAULTS.particleColorEnd) },
  }
  const material = new CustomShaderMaterial({
    baseMaterial: THREE.PointsMaterial,
    vertexShader,
    fragmentShader,
    uniforms,
    blending: THREE.NormalBlending,
    depthTest: true,
    depthWrite: false,
    sizeAttenuation: true,
    transparent: true,
    toneMapped: false,
    silent: true,
  })
  const points = new THREE.Points(new THREE.BufferGeometry(), material)
  points.frustumCulled = false
  points.renderOrder = 8
  const scale = new THREE.Vector3()
  let params = { ...CARD_TRAIL_DEFAULTS }
  return {
    points,
    configure(value: CardTrailParams) {
      params = sanitizeTrailParams(value)
      uniforms.uParticleSize.value = params.particleSize * params.particleSizeMultiplier
      uniforms.uAmplitude.value = params.trailAmplitude
      uniforms.uTrailLength.value = params.trailLength
      uniforms.uTurbulence.value = params.turbulence
      uniforms.uOpacity.value = params.particleOpacity
      uniforms.uColorA.value.set(params.particleGradient ? params.particleColorStart : params.particleColor)
      uniforms.uColorB.value.set(params.particleGradient ? params.particleColorMiddle : params.particleColor)
      uniforms.uColorC.value.set(params.particleGradient ? params.particleColorEnd : params.particleColor)
    },
    rebuild(height: number, radius: number) {
      uniforms.uCardWidth.value = height * 941 / 1672
      uniforms.uCornerRadius.value = radius
      const previous = points.geometry
      points.geometry = createTrailGeometry(height, radius, params)
      previous.dispose()
      history.reset()
    },
    update(emitter: Pick<THREE.Object3D, 'matrixWorld' | 'updateWorldMatrix'>, delta: number) {
      emitter.updateWorldMatrix(true, false)
      const valid = history.update(emitter.matrixWorld, delta, params.trailLength / 3)
      points.visible = valid && params.trailAmplitude > 0 && params.particleOpacity > 0
      scale.setFromMatrixScale(emitter.matrixWorld)
      uniforms.uWorldScale.value = Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z))
      if (Number.isFinite(delta) && delta >= 0 && delta <= 0.5) {
        uniforms.uPhase.value += delta * params.particleSpeed * 0.3
      }
    },
    dispose() {
      points.removeFromParent()
      points.geometry.dispose()
      material.dispose()
      history.reset()
    },
  }
}
