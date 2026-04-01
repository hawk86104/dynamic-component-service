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
import panelFragmentShader from '../shader/vertigoHaloComponent/panel.frag?raw'
import panelVertexShader from '../shader/vertigoHaloComponent/panel.vert?raw'

type VertigoHaloMaterial = CustomShaderMaterial<typeof THREE.MeshBasicMaterial>

const props = withDefaults(
  defineProps<{
    accentColor?: string
    baseColor?: string
    edgeGlow?: number
    flashIntensity?: number
    gradientSpeed?: number
    highlightColor?: string
    opacity?: number
    pulseIntensity?: number
    ringFrequency?: number
    rotationSpeed?: number
    segmentCount?: number
    size?: number
    tunnelSpeed?: number
    voidColor?: string
  }>(),
  {
    accentColor: '#ff2244',
    baseColor: '#cc1133',
    edgeGlow: 1,
    flashIntensity: 1,
    gradientSpeed: 0.2,
    highlightColor: '#c8956c',
    opacity: 0.92,
    pulseIntensity: 1,
    ringFrequency: 10,
    rotationSpeed: 0.35,
    segmentCount: 16,
    size: 4,
    tunnelSpeed: 0.15,
    voidColor: '#220033',
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

const safeOpacity = computed(() => clampNumber(props.opacity, 0.05, 1, 0.92))
const safeTunnelSpeed = computed(() => clampNumber(props.tunnelSpeed, 0, 1.5, 0.15))
const safeRotationSpeed = computed(() => clampNumber(props.rotationSpeed, 0, 1.5, 0.35))
const safeRingFrequency = computed(() => clampNumber(props.ringFrequency, 4, 24, 10))
const safeSegmentCount = computed(() => Math.round(clampNumber(props.segmentCount, 6, 32, 16)))
const safePulseIntensity = computed(() => clampNumber(props.pulseIntensity, 0, 2, 1))
const safeFlashIntensity = computed(() => clampNumber(props.flashIntensity, 0, 2, 1))
const safeEdgeGlow = computed(() => clampNumber(props.edgeGlow, 0, 2, 1))
const safeGradientSpeed = computed(() => clampNumber(props.gradientSpeed, -1, 1, 0.2))

const createPanelMaterial = (): VertigoHaloMaterial => {
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
      uAccentColor: { value: new THREE.Color(props.accentColor) },
      uBaseColor: { value: new THREE.Color(props.baseColor) },
      uEdgeGlow: { value: safeEdgeGlow.value },
      uFlashIntensity: { value: safeFlashIntensity.value },
      uGradientSpeed: { value: safeGradientSpeed.value },
      uHighlightColor: { value: new THREE.Color(props.highlightColor) },
      uOpacity: { value: safeOpacity.value },
      uPulseIntensity: { value: safePulseIntensity.value },
      uRingFrequency: { value: safeRingFrequency.value },
      uRotationSpeed: { value: safeRotationSpeed.value },
      uSegmentCount: { value: safeSegmentCount.value },
      uTime: { value: 0 },
      uTunnelSpeed: { value: safeTunnelSpeed.value },
      uVoidColor: { value: new THREE.Color(props.voidColor) },
    },
    vertexShader: panelVertexShader,
  })
}

const panelMaterial = shallowRef<VertigoHaloMaterial | null>(createPanelMaterial())

const syncMaterialUniforms = () => {
  if (!panelMaterial.value) {
    return
  }

  const uniforms = panelMaterial.value.uniforms

  setMaterialColor(uniforms.uAccentColor, props.accentColor, '#ff2244')
  setMaterialColor(uniforms.uBaseColor, props.baseColor, '#cc1133')
  setMaterialColor(uniforms.uHighlightColor, props.highlightColor, '#c8956c')
  setMaterialColor(uniforms.uVoidColor, props.voidColor, '#220033')
  uniforms.uEdgeGlow.value = safeEdgeGlow.value
  uniforms.uFlashIntensity.value = safeFlashIntensity.value
  uniforms.uGradientSpeed.value = safeGradientSpeed.value
  uniforms.uOpacity.value = safeOpacity.value
  uniforms.uPulseIntensity.value = safePulseIntensity.value
  uniforms.uRingFrequency.value = safeRingFrequency.value
  uniforms.uRotationSpeed.value = safeRotationSpeed.value
  uniforms.uSegmentCount.value = safeSegmentCount.value
  uniforms.uTunnelSpeed.value = safeTunnelSpeed.value
}

watch(
  [
    () => props.accentColor,
    () => props.baseColor,
    () => props.gradientSpeed,
    () => props.highlightColor,
    () => props.voidColor,
    safeEdgeGlow,
    safeFlashIntensity,
    safeGradientSpeed,
    safeOpacity,
    safePulseIntensity,
    safeRingFrequency,
    safeRotationSpeed,
    safeSegmentCount,
    safeTunnelSpeed,
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
      <TresPlaneGeometry :args="[5, 5, 1, 1]" />
      <primitive
        v-if="panelMaterial"
        :object="panelMaterial"
        attach="material"
      />
    </TresMesh>
  </TresGroup>
</template>
