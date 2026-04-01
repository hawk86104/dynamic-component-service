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
import panelFragmentShader from '../shader/currentRipplePanelComponent/panel.frag?raw'
import panelVertexShader from '../shader/currentRipplePanelComponent/panel.vert?raw'

type CurrentRipplePanelMaterial = CustomShaderMaterial<typeof THREE.MeshBasicMaterial>

const props = withDefaults(
  defineProps<{
    baseColor?: string
    currentColor?: string
    flowSpeed?: number
    gridDensity?: number
    highlightColor?: string
    length?: number
    opacity?: number
    pulseFrequency?: number
    pulseIntensity?: number
    rippleScale?: number
    shimmerIntensity?: number
    width?: number
    wireWidth?: number
  }>(),
  {
    baseColor: '#081321',
    currentColor: '#18c8ff',
    flowSpeed: 1,
    gridDensity: 26,
    highlightColor: '#f0fcff',
    length: 4,
    opacity: 0.95,
    pulseFrequency: 0.48,
    pulseIntensity: 1.12,
    rippleScale: 1,
    shimmerIntensity: 1.18,
    width: 4,
    wireWidth: 0.08,
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

const safeFlowSpeed = computed(() => clampNumber(props.flowSpeed, 0, 3, 1))
const safeGridDensity = computed(() => clampNumber(props.gridDensity, 6, 72, 26))
const safeLength = computed(() => clampNumber(props.length, 0.5, 30, 4))
const safeOpacity = computed(() => clampNumber(props.opacity, 0.05, 1, 0.95))
const safePulseFrequency = computed(() => clampNumber(props.pulseFrequency, 0.05, 3, 0.48))
const safePulseIntensity = computed(() => clampNumber(props.pulseIntensity, 0, 3, 1.12))
const safeRippleScale = computed(() => clampNumber(props.rippleScale, 0.4, 3, 1))
const safeShimmerIntensity = computed(() => clampNumber(props.shimmerIntensity, 0, 3, 1.18))
const safeWidth = computed(() => clampNumber(props.width, 0.5, 30, 4))
const safeWireWidth = computed(() => clampNumber(props.wireWidth, 0.02, 0.22, 0.08))

const createPanelMaterial = (): CurrentRipplePanelMaterial => {
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
      uCurrentColor: { value: new THREE.Color(props.currentColor) },
      uFlowSpeed: { value: safeFlowSpeed.value },
      uGridDensity: { value: safeGridDensity.value },
      uHighlightColor: { value: new THREE.Color(props.highlightColor) },
      uOpacity: { value: safeOpacity.value },
      uPanelLength: { value: safeLength.value },
      uPanelWidth: { value: safeWidth.value },
      uPulseFrequency: { value: safePulseFrequency.value },
      uPulseIntensity: { value: safePulseIntensity.value },
      uRippleScale: { value: safeRippleScale.value },
      uShimmerIntensity: { value: safeShimmerIntensity.value },
      uTime: { value: 0 },
      uWireWidth: { value: safeWireWidth.value },
    },
    vertexShader: panelVertexShader,
  })
}

const panelMaterial = shallowRef<CurrentRipplePanelMaterial | null>(createPanelMaterial())

const syncMaterialUniforms = () => {
  if (!panelMaterial.value) {
    return
  }

  const uniforms = panelMaterial.value.uniforms

  setMaterialColor(uniforms.uBaseColor, props.baseColor, '#081321')
  setMaterialColor(uniforms.uCurrentColor, props.currentColor, '#18c8ff')
  setMaterialColor(uniforms.uHighlightColor, props.highlightColor, '#f0fcff')
  uniforms.uFlowSpeed.value = safeFlowSpeed.value
  uniforms.uGridDensity.value = safeGridDensity.value
  uniforms.uOpacity.value = safeOpacity.value
  uniforms.uPanelLength.value = safeLength.value
  uniforms.uPanelWidth.value = safeWidth.value
  uniforms.uPulseFrequency.value = safePulseFrequency.value
  uniforms.uPulseIntensity.value = safePulseIntensity.value
  uniforms.uRippleScale.value = safeRippleScale.value
  uniforms.uShimmerIntensity.value = safeShimmerIntensity.value
  uniforms.uWireWidth.value = safeWireWidth.value
}

watch(
  [
    () => props.baseColor,
    () => props.currentColor,
    () => props.highlightColor,
    safeFlowSpeed,
    safeGridDensity,
    safeLength,
    safeOpacity,
    safePulseFrequency,
    safePulseIntensity,
    safeRippleScale,
    safeShimmerIntensity,
    safeWidth,
    safeWireWidth,
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
