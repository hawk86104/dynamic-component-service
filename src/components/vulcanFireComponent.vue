<script setup lang="ts">
import { useLoop, useTres } from '@tresjs/core'
import * as THREE from 'three'
import { computed, onBeforeUnmount, watch, watchEffect } from 'vue'
import {
  resolveVulcanFireSettings,
  VULCAN_FIRE_DEFAULTS,
} from './vulcanFireComponent/defaults'
import type { VulcanFireProps } from './vulcanFireComponent/defaults'
import { createVulcanParticleSystem } from './vulcanFireComponent/particles'
import { createVulcanFireVolume, createVulcanSmokeTexture } from './vulcanFireComponent/textures'
import fireFragmentShader from '../shader/vulcanFireComponent/fire.frag?raw'
import glowFragmentShader from '../shader/vulcanFireComponent/glow.frag?raw'
import glowVertexShader from '../shader/vulcanFireComponent/glow.vert?raw'
import particleVertexShader from '../shader/vulcanFireComponent/particle.vert?raw'
import smokeFragmentShader from '../shader/vulcanFireComponent/smoke.frag?raw'

const props = withDefaults(defineProps<VulcanFireProps>(), VULCAN_FIRE_DEFAULTS)
const settings = computed(() => resolveVulcanFireSettings(props))
const { camera } = useTres()
const root = new THREE.Group()
root.name = 'VulcanFire'

let fireVolume = createVulcanFireVolume(settings.value)
const smokeTexture = createVulcanSmokeTexture()
const fireUniforms = {
  uTime: { value: 0 },
  uPlaybackSpeed: { value: settings.value.playbackSpeed },
  uFireVolume: { value: fireVolume },
  uColorLow: { value: new THREE.Color(props.colorLow) },
  uColorMid: { value: new THREE.Color(props.colorMid) },
  uColorHigh: { value: new THREE.Color(props.colorHigh) },
  uIntensity: { value: settings.value.intensity },
}
const smokeUniforms = {
  uTime: { value: 0 },
  uPlaybackSpeed: { value: 0 },
  uSmokeTexture: { value: smokeTexture },
  uSmokeColor: { value: new THREE.Color(props.smokeColor) },
  uWarmColor: { value: new THREE.Color(props.colorMid) },
  uSmokeOpacity: { value: settings.value.smokeOpacity },
}
const glowUniforms = {
  uColor: { value: new THREE.Color(props.colorMid) },
  uIntensity: { value: settings.value.glowIntensity },
}

const createMaterial = (parameters: THREE.ShaderMaterialParameters) => new THREE.ShaderMaterial({
  transparent: true,
  depthTest: true,
  depthWrite: false,
  toneMapped: false,
  side: THREE.DoubleSide,
  clipping: true,
  ...parameters,
})

const fireMaterial = createMaterial({
  vertexShader: particleVertexShader,
  fragmentShader: fireFragmentShader,
  uniforms: fireUniforms,
})
const smokeMaterial = createMaterial({
  vertexShader: particleVertexShader,
  fragmentShader: smokeFragmentShader,
  uniforms: smokeUniforms,
})
const glowMaterial = createMaterial({
  vertexShader: glowVertexShader,
  fragmentShader: glowFragmentShader,
  uniforms: glowUniforms,
  blending: THREE.AdditiveBlending,
})
const fireSystem = createVulcanParticleSystem('fire', fireMaterial, settings.value.seed)
const smokeSystem = createVulcanParticleSystem('smoke', smokeMaterial, settings.value.seed)
const glowGeometry = new THREE.PlaneGeometry(1, 1)
const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
glowMesh.frustumCulled = false
glowMesh.renderOrder = 0

const fireLight = new THREE.PointLight(props.colorMid, settings.value.lightIntensity, 10, 2)
root.add(glowMesh, smokeSystem.mesh, fireSystem.mesh, fireLight)

let animationTime = 0
let disposed = false
let volumeTimer: ReturnType<typeof setTimeout> | undefined
const localToView = new THREE.Matrix4()

watchEffect(() => {
  const value = settings.value
  fireUniforms.uPlaybackSpeed.value = value.playbackSpeed
  fireUniforms.uIntensity.value = value.intensity
  fireUniforms.uColorLow.value.set(value.colorLow)
  fireUniforms.uColorMid.value.set(value.colorMid)
  fireUniforms.uColorHigh.value.set(value.colorHigh)
  smokeUniforms.uSmokeColor.value.set(value.smokeColor)
  smokeUniforms.uWarmColor.value.set(value.colorMid)
  smokeUniforms.uSmokeOpacity.value = value.smokeOpacity
  glowUniforms.uColor.value.set(value.colorMid)
  glowUniforms.uIntensity.value = value.glowIntensity * value.intensity

  const blending = value.additiveBlending ? THREE.AdditiveBlending : THREE.NormalBlending
  if (fireMaterial.blending !== blending) {
    fireMaterial.blending = blending
    fireMaterial.needsUpdate = true
  }

  const hasFire = value.fireCount > 0 && value.intensity > 0
  glowMesh.visible = value.glowEnabled && value.glowIntensity > 0 && hasFire
  const glowWidth = Math.max(value.sizeMax * 1.7, value.emitterRadius * 4)
  glowMesh.scale.set(glowWidth, value.sizeMax * 1.6, 1)
  glowMesh.position.y = value.sizeMax * 0.45
  fireLight.visible = value.lightEnabled && hasFire
  fireLight.color.set(value.colorMid)
  fireLight.intensity = value.lightIntensity
  fireLight.distance = Math.max(3, value.sizeMax * 6.25)
  fireLight.position.y = (value.sizeMin + value.sizeMax) * 0.42
})

watch(
  () => settings.value.seed,
  (seed) => {
    fireSystem.reseed(seed)
    smokeSystem.reseed(seed)
  },
)

watch(
  [
    () => settings.value.volumeSize,
    () => settings.value.volumeFrames,
    () => settings.value.volumeOctaves,
    () => settings.value.volumeFrequency,
    () => settings.value.turbulence,
    () => settings.value.flameWidth,
    () => settings.value.seed,
  ],
  () => {
    if (volumeTimer !== undefined) { clearTimeout(volumeTimer) }
    volumeTimer = setTimeout(() => {
      volumeTimer = undefined
      if (disposed) { return }
      const nextVolume = createVulcanFireVolume(settings.value)
      const previousVolume = fireVolume
      fireVolume = nextVolume
      fireUniforms.uFireVolume.value = nextVolume
      previousVolume.dispose()
    }, 150)
  },
)

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  const activeCamera = camera.value
  if (disposed || !activeCamera) { return }
  const value = settings.value
  const frameDelta = Number.isFinite(delta) ? THREE.MathUtils.clamp(delta, 0, 0.05) : 0
  const step = value.autoPlay ? frameDelta * value.animationSpeed : 0
  animationTime += step
  fireUniforms.uTime.value = animationTime

  // Update ancestors too: editor groups and parented cameras need world transforms.
  root.updateWorldMatrix(true, false)
  activeCamera.updateWorldMatrix(true, false)
  localToView.multiplyMatrices(activeCamera.matrixWorldInverse, root.matrixWorld)
  smokeSystem.update(step, value, localToView)
  fireSystem.update(step, value, localToView)
  fireLight.intensity = value.lightIntensity * (0.92 + Math.sin(animationTime * 13.7) * 0.05 + Math.sin(animationTime * 23.1) * 0.03)
})

onBeforeUnmount(() => {
  disposed = true
  if (volumeTimer !== undefined) { clearTimeout(volumeTimer) }
  fireSystem.dispose()
  smokeSystem.dispose()
  fireVolume.dispose()
  smokeTexture.dispose()
  fireMaterial.dispose()
  smokeMaterial.dispose()
  glowGeometry.dispose()
  glowMaterial.dispose()
  fireLight.dispose()
  root.clear()
})
</script>

<template>
  <primitive :object="root" />
</template>
