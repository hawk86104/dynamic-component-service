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
import panelFragmentShader from '../shader/dreamyFluidPanelComponent/panel.frag?raw'
import panelVertexShader from '../shader/dreamyFluidPanelComponent/panel.vert?raw'

type DreamyFluidPanelMaterial = CustomShaderMaterial<typeof THREE.MeshBasicMaterial>

const props = withDefaults(
  defineProps<{
    baseColor?: string
    highlightColor?: string
    length?: number
    opacity?: number
    sequinSize?: number
    sheenColor?: string
    shimmerSpeed?: number
    sparkleIntensity?: number
    tileDensity?: number
    waveIntensity?: number
    waveSpeed?: number
    width?: number
  }>(),
  {
    baseColor: '#10204f',
    highlightColor: '#ffe7ba',
    length: 4,
    opacity: 0.92,
    sequinSize: 0.38,
    sheenColor: '#6fd8ff',
    shimmerSpeed: 1.15,
    sparkleIntensity: 1.05,
    tileDensity: 28,
    waveIntensity: 0.92,
    waveSpeed: 0.86,
    width: 4,
  },
)

const clampNumber = (value: number | undefined, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return THREE.MathUtils.clamp(value as number, min, max)
}

const setMaterialColor = (uniform: THREE.IUniform<THREE.Color>, value: string | undefined, fallback: string) => {
  try {
    uniform.value.set(value ?? fallback)
  }
  catch {
    uniform.value.set(fallback)
  }
}

const safeLength = computed(() => clampNumber(props.length, 0.5, 20, 4))
const safeOpacity = computed(() => clampNumber(props.opacity, 0.08, 1, 0.92))
const safeTileDensity = computed(() => clampNumber(props.tileDensity, 8, 72, 28))
const safeSequinSize = computed(() => clampNumber(props.sequinSize, 0.15, 0.48, 0.38))
const safeWaveSpeed = computed(() => clampNumber(props.waveSpeed, 0, 4, 0.86))
const safeWaveIntensity = computed(() => clampNumber(props.waveIntensity, 0, 2.5, 0.92))
const safeShimmerSpeed = computed(() => clampNumber(props.shimmerSpeed, 0, 4, 1.15))
const safeSparkleIntensity = computed(() => clampNumber(props.sparkleIntensity, 0, 3, 1.05))
const safeWidth = computed(() => clampNumber(props.width, 0.5, 20, 4))

const createPanelMaterial = (): DreamyFluidPanelMaterial => {
  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshBasicMaterial,
    color: 0xFFFFFF,
    depthTest: true,
    depthWrite: false,
    fragmentShader: panelFragmentShader,
    side: THREE.DoubleSide,
    silent: true,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uBaseColor: { value: new THREE.Color(props.baseColor) },
      uHighlightColor: { value: new THREE.Color(props.highlightColor) },
      uPanelLength: { value: safeLength.value },
      uPanelWidth: { value: safeWidth.value },
      uOpacity: { value: safeOpacity.value },
      uSequinSize: { value: safeSequinSize.value },
      uSheenColor: { value: new THREE.Color(props.sheenColor) },
      uShimmerSpeed: { value: safeShimmerSpeed.value },
      uSparkleIntensity: { value: safeSparkleIntensity.value },
      uTileDensity: { value: safeTileDensity.value },
      uTime: { value: 0 },
      uWaveIntensity: { value: safeWaveIntensity.value },
      uWaveSpeed: { value: safeWaveSpeed.value },
    },
    vertexShader: panelVertexShader,
  })
}

const panelMaterial = shallowRef<DreamyFluidPanelMaterial | null>(createPanelMaterial())

const syncMaterialUniforms = () => {
  if (!panelMaterial.value) {
    return
  }

  const uniforms = panelMaterial.value.uniforms

  setMaterialColor(uniforms.uBaseColor, props.baseColor, '#10204f')
  setMaterialColor(uniforms.uSheenColor, props.sheenColor, '#6fd8ff')
  setMaterialColor(uniforms.uHighlightColor, props.highlightColor, '#ffe7ba')
  uniforms.uPanelLength.value = safeLength.value
  uniforms.uPanelWidth.value = safeWidth.value
  uniforms.uOpacity.value = safeOpacity.value
  uniforms.uTileDensity.value = safeTileDensity.value
  uniforms.uSequinSize.value = safeSequinSize.value
  uniforms.uWaveSpeed.value = safeWaveSpeed.value
  uniforms.uWaveIntensity.value = safeWaveIntensity.value
  uniforms.uShimmerSpeed.value = safeShimmerSpeed.value
  uniforms.uSparkleIntensity.value = safeSparkleIntensity.value
}

watch(
  [
    () => props.baseColor,
    () => props.highlightColor,
    () => props.sheenColor,
    safeLength,
    safeOpacity,
    safeTileDensity,
    safeSequinSize,
    safeWaveSpeed,
    safeWaveIntensity,
    safeShimmerSpeed,
    safeSparkleIntensity,
    safeWidth,
  ],
  syncMaterialUniforms,
  { immediate: true },
)

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  if (!panelMaterial.value) {
    return
  }

  panelMaterial.value.uniforms.uTime.value = elapsed
})

onBeforeUnmount(() => {
  panelMaterial.value?.dispose()
  panelMaterial.value = null
})
</script>

<template>
  <TresGroup>
    <TresMesh :position="[0, 0, 0]" :rotation="[-Math.PI / 2, 0, 0]" :render-order="4">
      <TresPlaneGeometry :args="[safeLength, safeWidth, 1, 1]" />
      <primitive
        v-if="panelMaterial"
        :object="panelMaterial"
        attach="material"
      />
    </TresMesh>
  </TresGroup>
</template>
