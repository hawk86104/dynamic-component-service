<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'
import {
  computed,
  onBeforeUnmount,
  shallowRef,
  watch,
} from 'vue'
import { DEFAULT_WATER_DROP_GLASS_PROPS, sanitizeWaterDropGlassProps } from './constants'
import type { WaterDropGlassMaterialProps } from './types'
import { createRainOnGlassSimulation } from './useRainOnGlass'
import glassFragmentShader from '../../shader/waterDropGlassMaterialComponent/glass.frag?raw'
import glassVertexShader from '../../shader/waterDropGlassMaterialComponent/glass.vert?raw'

const props = withDefaults(defineProps<WaterDropGlassMaterialProps>(), DEFAULT_WATER_DROP_GLASS_PROPS)

const safeConfig = computed(() => sanitizeWaterDropGlassProps(props))
const simulation = shallowRef<ReturnType<typeof createRainOnGlassSimulation> | null>(null)

const glassUniforms = {
  uAlphaMultiply: { value: safeConfig.value.alphaMultiply },
  uAlphaSubtract: { value: safeConfig.value.alphaSubtract },
  uBackgroundMap: { value: null as THREE.Texture | null },
  uBrightness: { value: safeConfig.value.brightness },
  uForegroundMap: { value: null as THREE.Texture | null },
  uMapResolution: { value: new THREE.Vector2(1024, 1024) },
  uOpacity: { value: safeConfig.value.opacity },
  uRefraction: { value: safeConfig.value.refraction },
  uRenderShadow: { value: safeConfig.value.showShadow },
  uRenderShine: { value: safeConfig.value.showShine },
  uShineMap: { value: null as THREE.Texture | null },
  uWaterMap: { value: null as THREE.Texture | null },
}

const createGlassMaterial = () => {
  return new THREE.ShaderMaterial({
    depthTest: true,
    depthWrite: false,
    fragmentShader: glassFragmentShader,
    side: THREE.DoubleSide,
    toneMapped: false,
    transparent: true,
    uniforms: glassUniforms,
    vertexShader: glassVertexShader,
  })
}

const glassMaterial = shallowRef(createGlassMaterial())

const syncMaterialUniforms = () => {
  const config = safeConfig.value

  glassUniforms.uAlphaMultiply.value = config.alphaMultiply
  glassUniforms.uAlphaSubtract.value = config.alphaSubtract
  glassUniforms.uBrightness.value = config.brightness
  glassUniforms.uOpacity.value = config.opacity
  glassUniforms.uRefraction.value = config.refraction
  glassUniforms.uRenderShadow.value = config.showShadow
  glassUniforms.uRenderShine.value = config.showShine

  if (simulation.value) {
    glassUniforms.uBackgroundMap.value = simulation.value.backgroundTexture
    glassUniforms.uForegroundMap.value = simulation.value.foregroundTexture
    glassUniforms.uMapResolution.value.copy(simulation.value.resolution)
    glassUniforms.uShineMap.value = simulation.value.shineTexture
    glassUniforms.uWaterMap.value = simulation.value.waterTexture
  }

  glassMaterial.value.needsUpdate = true
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

  const deltaSeconds = lastElapsed === null
    ? 1 / 60
    : Math.max(1 / 240, elapsed - lastElapsed)

  lastElapsed = elapsed
  simulation.value.update(deltaSeconds)
})

onBeforeUnmount(() => {
  simulation.value?.dispose()
  simulation.value = null
  glassMaterial.value.dispose()
})
</script>

<template>
  <TresGroup>
    <TresMesh :render-order="8">
      <TresPlaneGeometry :args="[safeConfig.size, safeConfig.size, 1, 1]" />
      <primitive
        v-if="glassMaterial"
        :object="glassMaterial"
        attach="material"
      />
    </TresMesh>
  </TresGroup>
</template>
