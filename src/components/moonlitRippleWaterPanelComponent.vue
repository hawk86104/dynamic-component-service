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
import panelFragmentShader from '../shader/moonlitRippleWaterPanelComponent/panel.frag?raw'
import panelVertexShader from '../shader/moonlitRippleWaterPanelComponent/panel.vert?raw'

type MoonlitRippleWaterMaterial = CustomShaderMaterial<typeof THREE.MeshBasicMaterial>

const props = withDefaults(
  defineProps<{
    cameraTilt?: number
    deepColor?: string
    fresnelStrength?: number
    moonColor?: string
    moonGlow?: number
    opacity?: number
    rippleSpeed?: number
    shallowColor?: string
    size?: number
    waveIntensity?: number
  }>(),
  {
    cameraTilt: 0.15,
    deepColor: '#07131f',
    fresnelStrength: 1,
    moonColor: '#eef6ff',
    moonGlow: 1,
    opacity: 0.95,
    rippleSpeed: 0.5,
    shallowColor: '#2f7ca6',
    size: 4,
    waveIntensity: 1,
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

const safeCameraTilt = computed(() => clampNumber(props.cameraTilt, -0.3, 1, 0.15))
const safeFresnelStrength = computed(() => clampNumber(props.fresnelStrength, 0, 2, 1))
const safeMoonGlow = computed(() => clampNumber(props.moonGlow, 0.3, 2, 1))
const safeOpacity = computed(() => clampNumber(props.opacity, 0.05, 1, 0.95))
const safeRippleSpeed = computed(() => clampNumber(props.rippleSpeed, 0.1, 1.5, 0.5))
const safeSize = computed(() => clampNumber(props.size, 0.5, 30, 4))
const safeWaveIntensity = computed(() => clampNumber(props.waveIntensity, 0, 3, 1))

const createPanelMaterial = (): MoonlitRippleWaterMaterial => {
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
      uCameraTilt: { value: safeCameraTilt.value },
      uDeepColor: { value: new THREE.Color(props.deepColor) },
      uFresnelStrength: { value: safeFresnelStrength.value },
      uMoonColor: { value: new THREE.Color(props.moonColor) },
      uMoonGlow: { value: safeMoonGlow.value },
      uOpacity: { value: safeOpacity.value },
      uPanelSize: { value: safeSize.value },
      uRippleSpeed: { value: safeRippleSpeed.value },
      uShallowColor: { value: new THREE.Color(props.shallowColor) },
      uTime: { value: 0 },
      uWaveIntensity: { value: safeWaveIntensity.value },
    },
    vertexShader: panelVertexShader,
  })
}

const panelMaterial = shallowRef<MoonlitRippleWaterMaterial | null>(createPanelMaterial())

const syncMaterialUniforms = () => {
  if (!panelMaterial.value) {
    return
  }

  const uniforms = panelMaterial.value.uniforms

  uniforms.uCameraTilt.value = safeCameraTilt.value
  setMaterialColor(uniforms.uDeepColor, props.deepColor, '#07131f')
  uniforms.uFresnelStrength.value = safeFresnelStrength.value
  setMaterialColor(uniforms.uMoonColor, props.moonColor, '#eef6ff')
  uniforms.uMoonGlow.value = safeMoonGlow.value
  uniforms.uOpacity.value = safeOpacity.value
  uniforms.uPanelSize.value = safeSize.value
  uniforms.uRippleSpeed.value = safeRippleSpeed.value
  setMaterialColor(uniforms.uShallowColor, props.shallowColor, '#2f7ca6')
  uniforms.uWaveIntensity.value = safeWaveIntensity.value
}

watch(
  [
    () => props.deepColor,
    () => props.moonColor,
    () => props.shallowColor,
    safeCameraTilt,
    safeFresnelStrength,
    safeMoonGlow,
    safeOpacity,
    safeRippleSpeed,
    safeSize,
    safeWaveIntensity,
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
      <TresPlaneGeometry :args="[safeSize, safeSize, 1, 1]" />
      <primitive
        v-if="panelMaterial"
        :object="panelMaterial"
        attach="material"
      />
    </TresMesh>
  </TresGroup>
</template>
