<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
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

type WaterDropGlassMaterial = CustomShaderMaterial<typeof THREE.MeshPhysicalMaterial> & THREE.MeshPhysicalMaterial

const props = withDefaults(defineProps<WaterDropGlassMaterialProps>(), DEFAULT_WATER_DROP_GLASS_PROPS)

const safeConfig = computed(() => sanitizeWaterDropGlassProps(props))
const simulation = shallowRef<ReturnType<typeof createRainOnGlassSimulation> | null>(null)

const glassUniforms = {
  uDropletColor: { value: new THREE.Color('#ffffff') },
  uDropletGlow: { value: safeConfig.value.dropletGlow },
  uDropletRoughness: { value: safeConfig.value.dropletRoughness },
  uWaterMap: { value: null as THREE.Texture | null },
}

const createGlassMaterial = (): WaterDropGlassMaterial => {
  return new CustomShaderMaterial({
    attenuationColor: new THREE.Color(safeConfig.value.glassColor),
    attenuationDistance: safeConfig.value.attenuationDistance,
    baseMaterial: THREE.MeshPhysicalMaterial,
    clearcoat: safeConfig.value.clearcoat,
    clearcoatRoughness: safeConfig.value.clearcoatRoughness,
    color: new THREE.Color(safeConfig.value.glassColor).getHex(),
    fragmentShader: glassFragmentShader,
    ior: safeConfig.value.ior,
    metalness: safeConfig.value.metalness,
    opacity: safeConfig.value.opacity,
    roughness: safeConfig.value.roughness,
    side: THREE.FrontSide,
    silent: true,
    thickness: safeConfig.value.thickness,
    toneMapped: true,
    transmission: safeConfig.value.transmission,
    transparent: true,
    uniforms: glassUniforms,
    vertexShader: glassVertexShader,
  }) as WaterDropGlassMaterial
}

const glassMaterial = shallowRef<WaterDropGlassMaterial | null>(createGlassMaterial())

const syncMaterialUniforms = () => {
  if (!glassMaterial.value) {
    return
  }

  const config = safeConfig.value
  const material = glassMaterial.value

  glassUniforms.uDropletColor.value.set('#ffffff')
  glassUniforms.uDropletGlow.value = config.dropletGlow
  glassUniforms.uDropletRoughness.value = config.dropletRoughness

  material.color.set(config.glassColor)
  material.attenuationColor.set(config.glassColor)
  material.attenuationDistance = config.attenuationDistance
  material.clearcoat = config.clearcoat
  material.clearcoatRoughness = config.clearcoatRoughness
  material.ior = config.ior
  material.metalness = config.metalness
  material.opacity = config.opacity
  material.roughness = config.roughness
  material.thickness = config.thickness
  material.transmission = config.transmission
  material.normalScale.set(config.normalStrength, config.normalStrength)
  material.clearcoatNormalScale.set(config.normalStrength, config.normalStrength)

  if (simulation.value) {
    glassUniforms.uWaterMap.value = simulation.value.waterTexture
    material.normalMap = simulation.value.normalTexture
    material.clearcoatNormalMap = simulation.value.normalTexture
  }

  material.needsUpdate = true
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
  glassMaterial.value?.dispose()
  glassMaterial.value = null
})
</script>

<template>
  <TresGroup>
    <TresMesh :render-order="8">
      <TresBoxGeometry :args="[safeConfig.length, safeConfig.width, safeConfig.thickness, 1, 1, 1]" />
      <primitive
        v-if="glassMaterial"
        :object="glassMaterial"
        attach="material"
      />
    </TresMesh>
  </TresGroup>
</template>
