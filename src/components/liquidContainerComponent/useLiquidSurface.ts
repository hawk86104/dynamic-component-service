import * as THREE from 'three'
import type { ContainerGeometryBundle, SafeLiquidContainerProps } from './types'

export const createSurfaceUniforms = (config: SafeLiquidContainerProps, geometry: ContainerGeometryBundle) => ({
  uTime: { value: 0 },
  uAmplitude: { value: config.waveAmplitude },
  uFrequency: { value: config.waveFrequency },
  uRandomness: { value: config.waveRandomness },
  uSpeed: { value: config.waveSpeed },
  uTopColor: { value: new THREE.Color(config.topColor) },
  uEdgeColor: { value: new THREE.Color(config.edgeColor) },
  uOpacity: { value: THREE.MathUtils.clamp(config.opacity + 0.08, 0, 1) },
  uSurfaceRadius: { value: geometry.surfaceRadius },
  uIsCircular: { value: geometry.surfaceShape === 'circle' ? 1 : 0 },
})

export const syncSurfaceUniforms = (
  uniforms: ReturnType<typeof createSurfaceUniforms>,
  config: SafeLiquidContainerProps,
  geometry: ContainerGeometryBundle,
) => {
  uniforms.uAmplitude.value = config.waveAmplitude
  uniforms.uFrequency.value = config.waveFrequency
  uniforms.uRandomness.value = config.waveRandomness
  uniforms.uSpeed.value = config.waveSpeed
  uniforms.uTopColor.value.set(config.topColor)
  uniforms.uEdgeColor.value.set(config.edgeColor)
  uniforms.uOpacity.value = THREE.MathUtils.clamp(config.opacity + 0.08, 0, 1)
  uniforms.uSurfaceRadius.value = geometry.surfaceRadius
  uniforms.uIsCircular.value = geometry.surfaceShape === 'circle' ? 1 : 0
}
