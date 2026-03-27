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
import panelFragmentShader from '../shader/giltMosaicGroundPanelComponent/panel.frag?raw'
import panelVertexShader from '../shader/giltMosaicGroundPanelComponent/panel.vert?raw'

type GiltMosaicGroundPanelMaterial = CustomShaderMaterial<typeof THREE.MeshBasicMaterial>

const props = withDefaults(
  defineProps<{
    animationMode?: number
    baseColor?: string
    groutColor?: string
    groutWidth?: number
    highlightColor?: string
    length?: number
    lightSpeed?: number
    opacity?: number
    sheenColor?: string
    sparkleIntensity?: number
    tileDensity?: number
    waveDelay?: number
    waveDirection?: number
    waveSpeed?: number
    width?: number
  }>(),
  {
    animationMode: 1,
    baseColor: '#5e411f',
    groutColor: '#110b06',
    groutWidth: 0.06,
    highlightColor: '#ffdba6',
    length: 4,
    lightSpeed: 0.4,
    opacity: 0.94,
    sheenColor: '#e5aa55',
    sparkleIntensity: 1,
    tileDensity: 18,
    waveDelay: 1.5,
    waveDirection: 0,
    waveSpeed: 4,
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

const safeAnimationMode = computed(() => clampNumber(props.animationMode, 0, 1, 1))
const safeGroutWidth = computed(() => clampNumber(props.groutWidth, 0.01, 0.18, 0.06))
const safeLength = computed(() => clampNumber(props.length, 0.5, 30, 4))
const safeLightSpeed = computed(() => clampNumber(props.lightSpeed, 0, 3, 0.4))
const safeOpacity = computed(() => clampNumber(props.opacity, 0.05, 1, 0.94))
const safeSparkleIntensity = computed(() => clampNumber(props.sparkleIntensity, 0, 3, 1))
const safeTileDensity = computed(() => clampNumber(props.tileDensity, 6, 64, 18))
const safeWaveDelay = computed(() => clampNumber(props.waveDelay, 0, 6, 1.5))
const safeWaveDirection = computed(() => Math.round(clampNumber(props.waveDirection, 0, 3, 0)))
const safeWaveSpeed = computed(() => clampNumber(props.waveSpeed, 0.3, 12, 4))
const safeWidth = computed(() => clampNumber(props.width, 0.5, 30, 4))

const createPanelMaterial = (): GiltMosaicGroundPanelMaterial => {
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
      uAnimationMode: { value: safeAnimationMode.value },
      uBaseColor: { value: new THREE.Color(props.baseColor) },
      uGroutColor: { value: new THREE.Color(props.groutColor) },
      uGroutWidth: { value: safeGroutWidth.value },
      uHighlightColor: { value: new THREE.Color(props.highlightColor) },
      uLightSpeed: { value: safeLightSpeed.value },
      uOpacity: { value: safeOpacity.value },
      uPanelLength: { value: safeLength.value },
      uPanelWidth: { value: safeWidth.value },
      uSheenColor: { value: new THREE.Color(props.sheenColor) },
      uSparkleIntensity: { value: safeSparkleIntensity.value },
      uTileDensity: { value: safeTileDensity.value },
      uTime: { value: 0 },
      uWaveDelay: { value: safeWaveDelay.value },
      uWaveDirection: { value: safeWaveDirection.value },
      uWaveSpeed: { value: safeWaveSpeed.value },
    },
    vertexShader: panelVertexShader,
  })
}

const panelMaterial = shallowRef<GiltMosaicGroundPanelMaterial | null>(createPanelMaterial())

const syncMaterialUniforms = () => {
  if (!panelMaterial.value) {
    return
  }

  const uniforms = panelMaterial.value.uniforms

  uniforms.uAnimationMode.value = safeAnimationMode.value
  setMaterialColor(uniforms.uBaseColor, props.baseColor, '#5e411f')
  setMaterialColor(uniforms.uGroutColor, props.groutColor, '#110b06')
  setMaterialColor(uniforms.uSheenColor, props.sheenColor, '#e5aa55')
  setMaterialColor(uniforms.uHighlightColor, props.highlightColor, '#ffdba6')
  uniforms.uGroutWidth.value = safeGroutWidth.value
  uniforms.uLightSpeed.value = safeLightSpeed.value
  uniforms.uOpacity.value = safeOpacity.value
  uniforms.uPanelLength.value = safeLength.value
  uniforms.uPanelWidth.value = safeWidth.value
  uniforms.uSparkleIntensity.value = safeSparkleIntensity.value
  uniforms.uTileDensity.value = safeTileDensity.value
  uniforms.uWaveDelay.value = safeWaveDelay.value
  uniforms.uWaveDirection.value = safeWaveDirection.value
  uniforms.uWaveSpeed.value = safeWaveSpeed.value
}

watch(
  [
    safeAnimationMode,
    () => props.baseColor,
    () => props.groutColor,
    () => props.highlightColor,
    () => props.sheenColor,
    safeGroutWidth,
    safeLength,
    safeLightSpeed,
    safeOpacity,
    safeSparkleIntensity,
    safeTileDensity,
    safeWaveDelay,
    safeWaveDirection,
    safeWaveSpeed,
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
