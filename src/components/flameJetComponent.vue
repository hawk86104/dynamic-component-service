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
import flameFragmentShader from '../shader/flameJetComponent/flame.frag?raw'
import flameVertexShader from '../shader/flameJetComponent/flame.vert?raw'

type FlameCustomMaterial = CustomShaderMaterial<typeof THREE.MeshBasicMaterial>

const props = withDefaults(
  defineProps<{
    coreColor?: string
    crossPlane?: boolean
    intensity?: number
    jetSpeed?: number
    length?: number
    midColor?: string
    noiseScale?: number
    outerColor?: string
    taperPower?: number
    turbulence?: number
    width?: number
  }>(),
  {
    coreColor: '#ffc738',
    crossPlane: true,
    intensity: 1.55,
    jetSpeed: 1.7,
    length: 6,
    midColor: '#ff660d',
    noiseScale: 1,
    outerColor: '#d80f04',
    taperPower: 1.2,
    turbulence: 1,
    width: 2.2,
  },
)

const flameGroup = shallowRef<THREE.Group | null>(null)
const flameGeometry = shallowRef<THREE.PlaneGeometry | null>(null)
const flameMaterial = shallowRef<FlameCustomMaterial | null>(null)

const clampNumber = (value: number | undefined, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback
  }
  return THREE.MathUtils.clamp(value as number, min, max)
}

const safeLength = computed(() => clampNumber(props.length, 0.5, 30, 6))
const safeWidth = computed(() => clampNumber(props.width, 0.2, 12, 2.2))
const safeIntensity = computed(() => clampNumber(props.intensity, 0.1, 4, 1.55))
const safeJetSpeed = computed(() => clampNumber(props.jetSpeed, 0, 8, 1.7))
const safeTurbulence = computed(() => clampNumber(props.turbulence, 0, 3, 1))
const safeNoiseScale = computed(() => clampNumber(props.noiseScale, 0.1, 4, 1))
const safeTaperPower = computed(() => clampNumber(props.taperPower, 0.2, 5, 1.2))

const flameUniforms = {
  uCoreColor: { value: new THREE.Color(props.coreColor) },
  uIntensity: { value: safeIntensity.value },
  uJetSpeed: { value: safeJetSpeed.value },
  uMidColor: { value: new THREE.Color(props.midColor) },
  uNoiseScale: { value: safeNoiseScale.value },
  uOuterColor: { value: new THREE.Color(props.outerColor) },
  uTaperPower: { value: safeTaperPower.value },
  uTime: { value: 0 },
  uTurbulence: { value: safeTurbulence.value },
}

const createFlameMaterial = (): FlameCustomMaterial => {
  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshBasicMaterial,
    blending: THREE.AdditiveBlending,
    color: 0xFFFFFF,
    depthWrite: false,
    fragmentShader: flameFragmentShader,
    side: THREE.DoubleSide,
    silent: true,
    toneMapped: false,
    transparent: true,
    uniforms: flameUniforms,
    vertexShader: flameVertexShader,
  })
}

const disposeFlame = () => {
  flameGeometry.value?.dispose()
  flameMaterial.value?.dispose()
  flameGeometry.value = null
  flameMaterial.value = null
}

const createFlame = () => {
  disposeFlame()
  flameGeometry.value = new THREE.PlaneGeometry(safeLength.value, safeWidth.value, 1, 1)
  flameMaterial.value = createFlameMaterial()
}

createFlame()

watch(
  [safeLength, safeWidth],
  () => {
    flameGeometry.value?.dispose()
    flameGeometry.value = new THREE.PlaneGeometry(safeLength.value, safeWidth.value, 1, 1)
  },
)

watch(
  [
    () => props.coreColor,
    () => props.midColor,
    () => props.outerColor,
    safeIntensity,
    safeJetSpeed,
    safeTurbulence,
    safeNoiseScale,
    safeTaperPower,
  ],
  ([coreColor, midColor, outerColor, intensity, jetSpeed, turbulence, noiseScale, taperPower]) => {
    if (!flameMaterial.value) {
      return
    }

    flameMaterial.value.uniforms.uCoreColor.value.set(coreColor)
    flameMaterial.value.uniforms.uMidColor.value.set(midColor)
    flameMaterial.value.uniforms.uOuterColor.value.set(outerColor)
    flameMaterial.value.uniforms.uIntensity.value = intensity
    flameMaterial.value.uniforms.uJetSpeed.value = jetSpeed
    flameMaterial.value.uniforms.uTurbulence.value = turbulence
    flameMaterial.value.uniforms.uNoiseScale.value = noiseScale
    flameMaterial.value.uniforms.uTaperPower.value = taperPower
  },
  { immediate: true },
)

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  if (!flameMaterial.value) {
    return
  }
  flameMaterial.value.uniforms.uTime.value = elapsed
})

onBeforeUnmount(() => {
  disposeFlame()
})

// 让火焰从喷嘴根部沿 +X 方向喷出（局部坐标）
const flameOriginX = computed(() => safeLength.value / 2)
</script>

<template>
  <TresGroup ref="flameGroup">
    <TresMesh
      v-if="flameGeometry && flameMaterial"
      :position="[flameOriginX, 0, 0]"
      :render-order="9"
    >
      <primitive :object="flameGeometry" attach="geometry" />
      <primitive :object="flameMaterial" attach="material" />
    </TresMesh>

    <TresMesh
      v-if="crossPlane && flameGeometry && flameMaterial"
      :position="[flameOriginX, 0, 0]"
      :rotation="[Math.PI / 2, 0, 0]"
      :render-order="9"
    >
      <primitive :object="flameGeometry" attach="geometry" />
      <primitive :object="flameMaterial" attach="material" />
    </TresMesh>
  </TresGroup>
</template>
