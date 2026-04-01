<script setup lang="ts">
import { useLoop, useTres } from '@tresjs/core'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { MeshDiscardMaterial, MeshTransmissionMaterial } from '@pmndrs/vanilla'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from 'vue'
import { DEFAULT_WATER_DROP_GLASS_PROPS, sanitizeWaterDropGlassProps } from './constants'
import type { WaterDropGlassMaterialProps } from './types'
import { createRainOnGlassSimulation } from './useRainOnGlass'
import glassFragmentShader from '../../shader/waterDropGlassMaterialComponent/glass.frag?raw'
import glassVertexShader from '../../shader/waterDropGlassMaterialComponent/glass.vert?raw'

type WaterDropGlassMaterial = CustomShaderMaterial<typeof THREE.MeshPhysicalMaterial> & THREE.MeshPhysicalMaterial
type WaterDropTransmissionMaterial = WaterDropGlassMaterial & {
  anisotropicBlur?: number
  buffer?: THREE.Texture | null
  chromaticAberration?: number
  distortion?: number
  temporalDistortion?: number
  time?: number
  _transmission?: number
  uniforms: Record<string, { value: unknown }>
}

const props = withDefaults(defineProps<WaterDropGlassMaterialProps>(), DEFAULT_WATER_DROP_GLASS_PROPS)
const { camera, renderer, scene, sizes } = useTres()

const safeConfig = computed(() => sanitizeWaterDropGlassProps(props))
const simulation = shallowRef<ReturnType<typeof createRainOnGlassSimulation> | null>(null)
const glassMesh = shallowRef<THREE.Mesh | null>(null)
const backdropRenderTarget = shallowRef<THREE.WebGLRenderTarget | null>(null)

const BACKDROP_RESOLUTION_SCALE = 0.75
const tempDrawingBufferSize = new THREE.Vector2()
const discardMaterial = new MeshDiscardMaterial()
let isCapturingBackdrop = false

const glassUniforms = {
  uDropletColor: { value: new THREE.Color('#ffffff') },
  uDropletGlow: { value: safeConfig.value.dropletGlow },
  uDropletRoughness: { value: safeConfig.value.dropletRoughness },
  uWaterMap: { value: null as THREE.Texture | null },
}

const assignTransmissionBuffer = (material: WaterDropTransmissionMaterial, texture: THREE.Texture | null) => {
  if (material.uniforms.buffer) {
    material.uniforms.buffer.value = texture
  }
}

const syncTransmissionUniforms = (material: WaterDropTransmissionMaterial, config: ReturnType<typeof sanitizeWaterDropGlassProps>) => {
  if (material.uniforms.transmission) {
    material.uniforms.transmission.value = 0
  }
  if (material.uniforms._transmission) {
    material.uniforms._transmission.value = config.transmission
  }
  if (material.uniforms.thickness) {
    material.uniforms.thickness.value = config.thickness
  }
  if (material.uniforms.attenuationDistance) {
    material.uniforms.attenuationDistance.value = config.attenuationDistance
  }
  if (material.uniforms.attenuationColor) {
    material.uniforms.attenuationColor.value = new THREE.Color(config.glassColor)
  }
  if (material.uniforms.anisotropicBlur) {
    material.uniforms.anisotropicBlur.value = 0.08
  }
  if (material.uniforms.chromaticAberration) {
    material.uniforms.chromaticAberration.value = 0.01
  }
  if (material.uniforms.distortion) {
    material.uniforms.distortion.value = 0
  }
  if (material.uniforms.temporalDistortion) {
    material.uniforms.temporalDistortion.value = 0
  }
}

const createBackdropRenderTarget = (width: number, height: number) => {
  return new THREE.WebGLRenderTarget(width, height, {
    depthBuffer: true,
    generateMipmaps: false,
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearFilter,
    stencilBuffer: false,
    type: THREE.HalfFloatType,
  })
}

const ensureBackdropTargetSize = () => {
  renderer.getDrawingBufferSize(tempDrawingBufferSize)

  const viewportWidth = Math.max(1, tempDrawingBufferSize.x)
  const viewportHeight = Math.max(1, tempDrawingBufferSize.y)
  const targetWidth = Math.max(1, Math.round(viewportWidth * BACKDROP_RESOLUTION_SCALE))
  const targetHeight = Math.max(1, Math.round(viewportHeight * BACKDROP_RESOLUTION_SCALE))

  if (!backdropRenderTarget.value) {
    backdropRenderTarget.value = createBackdropRenderTarget(targetWidth, targetHeight)
  }
  else if (backdropRenderTarget.value.width !== targetWidth || backdropRenderTarget.value.height !== targetHeight) {
    backdropRenderTarget.value.setSize(targetWidth, targetHeight)
  }

  if (glassMaterial.value) {
    assignTransmissionBuffer(glassMaterial.value, backdropRenderTarget.value.texture)
  }
}

const createGlassMaterial = (): WaterDropTransmissionMaterial => {
  const transmissionBaseMaterial = new MeshTransmissionMaterial({
    anisotropicBlur: 0.08,
    buffer: null,
    chromaticAberration: 0.01,
    distortion: 0,
    temporalDistortion: 0,
    transmissionSampler: false,
  })

  return new CustomShaderMaterial({
    attenuationColor: new THREE.Color(safeConfig.value.glassColor),
    attenuationDistance: safeConfig.value.attenuationDistance,
    baseMaterial: transmissionBaseMaterial,
    _transmission: safeConfig.value.transmission,
    clearcoat: safeConfig.value.clearcoat,
    clearcoatRoughness: safeConfig.value.clearcoatRoughness,
    color: new THREE.Color(safeConfig.value.glassColor),
    fragmentShader: glassFragmentShader,
    ior: safeConfig.value.ior,
    metalness: safeConfig.value.metalness,
    opacity: safeConfig.value.opacity,
    roughness: safeConfig.value.roughness,
    side: THREE.DoubleSide,
    silent: true,
    thickness: safeConfig.value.thickness,
    toneMapped: true,
    transmission: 0,
    uniforms: glassUniforms,
    vertexShader: glassVertexShader,
  }) as WaterDropTransmissionMaterial
}

const glassMaterial = shallowRef<WaterDropTransmissionMaterial | null>(createGlassMaterial())

const syncMaterialUniforms = () => {
  if (!glassMaterial.value) {
    return
  }

  const config = safeConfig.value
  const material = glassMaterial.value

  glassUniforms.uDropletColor.value.set('#ffffff')
  glassUniforms.uDropletGlow.value = config.dropletGlow
  glassUniforms.uDropletRoughness.value = config.dropletRoughness

  if (material.color && typeof (material.color as THREE.Color).set === 'function') {
    ;(material.color as THREE.Color).set(config.glassColor)
  }
  else {
    material.color = new THREE.Color(config.glassColor) as never
  }
  material.attenuationColor.set(config.glassColor)
  material.attenuationDistance = config.attenuationDistance
  material.clearcoat = config.clearcoat
  material.clearcoatRoughness = config.clearcoatRoughness
  material.ior = config.ior
  material.metalness = config.metalness
  material.opacity = config.opacity
  material.roughness = config.roughness
  material.thickness = config.thickness
  material.transmission = 0 as never
  material._transmission = config.transmission
  assignTransmissionBuffer(material, backdropRenderTarget.value?.texture ?? null)
  syncTransmissionUniforms(material, config)
  material.normalScale.set(config.normalStrength, config.normalStrength)
  material.clearcoatNormalScale.set(config.normalStrength, config.normalStrength)

  if (simulation.value) {
    glassUniforms.uWaterMap.value = simulation.value.waterTexture
    material.normalMap = simulation.value.normalTexture
    material.clearcoatNormalMap = simulation.value.normalTexture
  }

  material.needsUpdate = true
}

watch(
  [sizes.width, sizes.height],
  () => {
    ensureBackdropTargetSize()
  },
  { immediate: true },
)

const captureBackdrop = () => {
  if (
    isCapturingBackdrop
    || !glassMaterial.value
    || !glassMesh.value
    || !backdropRenderTarget.value
    || !scene.value
    || !camera.value
  ) {
    return
  }

  isCapturingBackdrop = true

  const currentRenderTarget = renderer.getRenderTarget() as THREE.WebGLRenderTarget | null
  const currentActiveCubeFace = renderer.getActiveCubeFace()
  const currentActiveMipmapLevel = renderer.getActiveMipmapLevel()
  const previousAutoClear = renderer.autoClear
  const previousMaterial = glassMesh.value.material

  glassMesh.value.material = discardMaterial

  renderer.autoClear = true
  renderer.setRenderTarget(backdropRenderTarget.value)
  renderer.clear()
  renderer.render(scene.value, camera.value)
  renderer.setRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel)
  renderer.autoClear = previousAutoClear

  glassMesh.value.material = previousMaterial
  assignTransmissionBuffer(glassMaterial.value, backdropRenderTarget.value.texture)
  isCapturingBackdrop = false
}

const rebuildSimulation = () => {
  simulation.value?.dispose()
  simulation.value = createRainOnGlassSimulation(safeConfig.value)
  syncMaterialUniforms()
}

watch(
  safeConfig,
  (config) => {
    if (!simulation.value) {
      rebuildSimulation()
      return
    }

    simulation.value.setConfig(config)
    syncMaterialUniforms()
  },
  { immediate: true },
)

const { onBeforeRender } = useLoop()
let lastElapsed: number | null = null

onBeforeRender(({ elapsed }) => {
  if (!simulation.value) {
    return
  }

  if (glassMaterial.value) {
    glassMaterial.value.time = elapsed
  }

  const deltaSeconds = lastElapsed === null
    ? 1 / 60
    : Math.max(1 / 240, elapsed - lastElapsed)

  lastElapsed = elapsed
  simulation.value.update(deltaSeconds)
  ensureBackdropTargetSize()
  captureBackdrop()
})

onMounted(async () => {
  await nextTick()
  ensureBackdropTargetSize()
  syncMaterialUniforms()
})

onBeforeUnmount(() => {
  simulation.value?.dispose()
  simulation.value = null
  discardMaterial.dispose()
  backdropRenderTarget.value?.dispose()
  backdropRenderTarget.value = null
  glassMaterial.value?.dispose()
  glassMaterial.value = null
})
</script>

<template>
  <TresGroup>
    <TresMesh ref="glassMesh" :render-order="8">
      <TresBoxGeometry :args="[safeConfig.length, safeConfig.width, safeConfig.thickness, 1, 1, 1]" />
      <primitive
        v-if="glassMaterial"
        :object="glassMaterial"
        attach="material"
      />
    </TresMesh>
  </TresGroup>
</template>
