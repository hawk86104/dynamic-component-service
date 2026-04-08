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
import panelFragmentShader from '../shader/chipFloorGroundComponent/panel.frag?raw'
import panelVertexShader from '../shader/chipFloorGroundComponent/panel.vert?raw'

type ChipFloorGroundMaterial = CustomShaderMaterial<typeof THREE.MeshBasicMaterial>

const DEFAULTS = {
  baseColor: '#404854',
  chipHeight: 0.0568,
  dotDensity: 38,
  dotOpacity: 0.2,
  glowColor: '#00d0ff',
  glowIntensity: 1.14,
  iterations: 2,
  particleColor: '#ffffff',
  particleDensity: 15,
  particleSize: 0.008,
  particleSpeed: 1.5,
  patternScale: 0.4843,
  size: 14,
  traceColor: '#3a4048',
  trailColor: '#ffffff',
  trailLength: 12,
  trailSpeed: 0.5,
} as const

const INTERNAL_DEFAULTS = {
  maxGeometrySegments: 480,
  minGeometrySegments: 240,
  planeSize: 14,
} as const

const props = withDefaults(
  defineProps<{
    baseColor?: string
    chipHeight?: number
    dotDensity?: number
    dotOpacity?: number
    glowColor?: string
    glowIntensity?: number
    iterations?: number
    particleColor?: string
    particleDensity?: number
    particleSize?: number
    particleSpeed?: number
    patternScale?: number
    size?: number
    traceColor?: string
    trailColor?: string
    trailLength?: number
    trailSpeed?: number
  }>(),
  {
    baseColor: '#404854',
    chipHeight: 0.0568,
    dotDensity: 38,
    dotOpacity: 0.2,
    glowColor: '#00d0ff',
    glowIntensity: 1.14,
    iterations: 2,
    particleColor: '#ffffff',
    particleDensity: 15,
    particleSize: 0.008,
    particleSpeed: 1.5,
    patternScale: 0.4843,
    size: 14,
    traceColor: '#3a4048',
    trailColor: '#ffffff',
    trailLength: 12,
    trailSpeed: 0.5,
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

const safeChipHeight = computed(() => clampNumber(props.chipHeight, 0, 0.8, DEFAULTS.chipHeight))
const safeDotDensity = computed(() => clampNumber(props.dotDensity, 20, 120, DEFAULTS.dotDensity))
const safeDotOpacity = computed(() => clampNumber(props.dotOpacity, 0, 1, DEFAULTS.dotOpacity))
const safeGlowIntensity = computed(() => clampNumber(props.glowIntensity, 0, 5, DEFAULTS.glowIntensity))
const safeIterations = computed(() => Math.round(clampNumber(props.iterations, 2, 10, DEFAULTS.iterations)))
const safeParticleDensity = computed(() => clampNumber(props.particleDensity, 1, 30, DEFAULTS.particleDensity))
const safeParticleSize = computed(() => clampNumber(props.particleSize, 0.001, 0.02, DEFAULTS.particleSize))
const safeParticleSpeed = computed(() => clampNumber(props.particleSpeed, 0, 5, DEFAULTS.particleSpeed))
const safePatternScale = computed(() => clampNumber(props.patternScale, 0.1, 3, DEFAULTS.patternScale))
const safeSize = computed(() => clampNumber(props.size, 4, 40, DEFAULTS.size))
const safeTrailLength = computed(() => clampNumber(props.trailLength, 2, 30, DEFAULTS.trailLength))
const safeTrailSpeed = computed(() => clampNumber(props.trailSpeed, 0, 10, DEFAULTS.trailSpeed))
const geometrySegments = computed(() => Math.round(THREE.MathUtils.clamp(
  safeSize.value * 18 + safePatternScale.value * 60,
  INTERNAL_DEFAULTS.minGeometrySegments,
  INTERNAL_DEFAULTS.maxGeometrySegments,
)))

const createPanelMaterial = (): ChipFloorGroundMaterial => {
  return new CustomShaderMaterial({
    alphaTest: 0.02,
    baseMaterial: THREE.MeshBasicMaterial,
    color: 0xFFFFFF,
    depthTest: true,
    depthWrite: true,
    fragmentShader: panelFragmentShader,
    side: THREE.FrontSide,
    silent: true,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uBaseColor: { value: new THREE.Color(DEFAULTS.baseColor) },
      uDotDensity: { value: safeDotDensity.value },
      uDotOpacity: { value: safeDotOpacity.value },
      uExtrusion: { value: safeChipHeight.value },
      uGlowColor: { value: new THREE.Color(DEFAULTS.glowColor) },
      uGlowIntensity: { value: safeGlowIntensity.value },
      uIterations: { value: safeIterations.value },
      uParticleColor: { value: new THREE.Color(DEFAULTS.particleColor) },
      uParticleDensity: { value: safeParticleDensity.value },
      uParticleSize: { value: safeParticleSize.value },
      uParticleSpeed: { value: safeParticleSpeed.value },
      uPlaneSize: { value: INTERNAL_DEFAULTS.planeSize },
      uPatternScale: { value: safePatternScale.value },
      uTime: { value: 0 },
      uTraceColor: { value: new THREE.Color(DEFAULTS.traceColor) },
      uTrailColor: { value: new THREE.Color(DEFAULTS.trailColor) },
      uTrailLength: { value: safeTrailLength.value },
      uTrailSpeed: { value: safeTrailSpeed.value },
    },
    vertexShader: panelVertexShader,
  })
}

const panelMaterial = shallowRef<ChipFloorGroundMaterial | null>(createPanelMaterial())

const syncMaterialUniforms = () => {
  if (!panelMaterial.value) {
    return
  }

  const uniforms = panelMaterial.value.uniforms

  setMaterialColor(uniforms.uBaseColor, props.baseColor, DEFAULTS.baseColor)
  setMaterialColor(uniforms.uTraceColor, props.traceColor, DEFAULTS.traceColor)
  setMaterialColor(uniforms.uGlowColor, props.glowColor, DEFAULTS.glowColor)
  setMaterialColor(uniforms.uTrailColor, props.trailColor, DEFAULTS.trailColor)
  setMaterialColor(uniforms.uParticleColor, props.particleColor, DEFAULTS.particleColor)
  uniforms.uPatternScale.value = safePatternScale.value
  uniforms.uExtrusion.value = safeChipHeight.value
  uniforms.uDotDensity.value = safeDotDensity.value
  uniforms.uDotOpacity.value = safeDotOpacity.value
  uniforms.uIterations.value = safeIterations.value
  uniforms.uGlowIntensity.value = safeGlowIntensity.value
  uniforms.uTrailSpeed.value = safeTrailSpeed.value
  uniforms.uTrailLength.value = safeTrailLength.value
  uniforms.uParticleSpeed.value = safeParticleSpeed.value
  uniforms.uParticleDensity.value = safeParticleDensity.value
  uniforms.uParticleSize.value = safeParticleSize.value
  uniforms.uPlaneSize.value = safeSize.value
}

watch(
  [
    () => props.baseColor,
    () => props.glowColor,
    () => props.particleColor,
    () => props.traceColor,
    () => props.trailColor,
    safeChipHeight,
    safeDotDensity,
    safeDotOpacity,
    safeGlowIntensity,
    safeIterations,
    safeParticleDensity,
    safeParticleSize,
    safeParticleSpeed,
    safePatternScale,
    safeSize,
    safeTrailLength,
    safeTrailSpeed,
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
      <TresPlaneGeometry :args="[safeSize, safeSize, geometrySegments, geometrySegments]" />
      <primitive
        v-if="panelMaterial"
        :object="panelMaterial"
        attach="material"
      />
    </TresMesh>
  </TresGroup>
</template>
