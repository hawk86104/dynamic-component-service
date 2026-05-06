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
import coreFragmentShader from '../shader/lightSpeedShieldDeployComponent/core.frag?raw'
import coreVertexShader from '../shader/lightSpeedShieldDeployComponent/core.vert?raw'
import shieldFragmentShader from '../shader/lightSpeedShieldDeployComponent/shield.frag?raw'
import shieldVertexShader from '../shader/lightSpeedShieldDeployComponent/shield.vert?raw'

type LightSpeedShieldMaterial = CustomShaderMaterial<typeof THREE.MeshBasicMaterial>

const props = withDefaults(
  defineProps<{
    autoAnimate?: boolean
    collapseDuration?: number
    coreColor?: string
    coreIntensity?: number
    coreRadiusRatio?: number
    deployDuration?: number
    deployProgress?: number
    deployToken?: number
    fresnelStrength?: number
    hexColor?: string
    hexOpacity?: number
    hexScale?: number
    hexWidth?: number
    holdDuration?: number
    hotColor?: string
    noiseScale?: number
    noiseSpeed?: number
    opacity?: number
    pulseIntensity?: number
    pulseSpeed?: number
    radius?: number
    rimColor?: string
    shellColor?: string
    startScale?: number
    sweepIntensity?: number
    sweepWidth?: number
  }>(),
  {
    autoAnimate: true,
    collapseDuration: 0.35,
    coreColor: '#69f6ff',
    coreIntensity: 2.2,
    coreRadiusRatio: 0.58,
    deployDuration: 0.86,
    deployProgress: 1,
    deployToken: 0,
    fresnelStrength: 1.9,
    hexColor: '#2e91ff',
    hexOpacity: 0.86,
    hexScale: 5.7,
    hexWidth: 0.075,
    holdDuration: 1.15,
    hotColor: '#e7ffff',
    noiseScale: 2.1,
    noiseSpeed: 0.62,
    opacity: 0.78,
    pulseIntensity: 0.8,
    pulseSpeed: 1.15,
    radius: 1.8,
    rimColor: '#baf7ff',
    shellColor: '#48c8ff',
    startScale: 0.32,
    sweepIntensity: 1.55,
    sweepWidth: 0.18,
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

const safeCollapseDuration = computed(() => clampNumber(props.collapseDuration, 0.08, 3, 0.35))
const safeCoreIntensity = computed(() => clampNumber(props.coreIntensity, 0, 8, 2.2))
const safeCoreRadiusRatio = computed(() => clampNumber(props.coreRadiusRatio, 0.1, 0.95, 0.58))
const safeDeployDuration = computed(() => clampNumber(props.deployDuration, 0.12, 5, 0.86))
const safeDeployProgress = computed(() => clampNumber(props.deployProgress, 0, 1, 1))
const safeFresnelStrength = computed(() => clampNumber(props.fresnelStrength, 0, 6, 1.9))
const safeHexOpacity = computed(() => clampNumber(props.hexOpacity, 0, 2, 0.86))
const safeHexScale = computed(() => clampNumber(props.hexScale, 1, 18, 5.7))
const safeHexWidth = computed(() => clampNumber(props.hexWidth, 0.01, 0.2, 0.075))
const safeHoldDuration = computed(() => clampNumber(props.holdDuration, 0, 6, 1.15))
const safeNoiseScale = computed(() => clampNumber(props.noiseScale, 0.1, 10, 2.1))
const safeNoiseSpeed = computed(() => clampNumber(props.noiseSpeed, 0, 4, 0.62))
const safeOpacity = computed(() => clampNumber(props.opacity, 0, 1, 0.78))
const safePulseIntensity = computed(() => clampNumber(props.pulseIntensity, 0, 3, 0.8))
const safePulseSpeed = computed(() => clampNumber(props.pulseSpeed, 0, 5, 1.15))
const safeRadius = computed(() => clampNumber(props.radius, 0.2, 8, 1.8))
const safeStartScale = computed(() => clampNumber(props.startScale, 0.02, 1, 0.32))
const safeSweepIntensity = computed(() => clampNumber(props.sweepIntensity, 0, 5, 1.55))
const safeSweepWidth = computed(() => clampNumber(props.sweepWidth, 0.02, 0.8, 0.18))

const shellMaterial = shallowRef<LightSpeedShieldMaterial | null>(null)
const coreMaterial = shallowRef<LightSpeedShieldMaterial | null>(null)

let elapsedTime = 0
let manualDeployActive = false
let manualDeployStart = 0
let previousDeployToken = props.deployToken

const createShellMaterial = (): LightSpeedShieldMaterial => {
  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshBasicMaterial,
    blending: THREE.AdditiveBlending,
    color: 0xFFFFFF,
    depthWrite: false,
    fragmentShader: shieldFragmentShader,
    side: THREE.FrontSide,
    silent: true,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: safeDeployProgress.value },
      uRadius: { value: safeRadius.value },
      uShellColor: { value: new THREE.Color(props.shellColor) },
      uHexColor: { value: new THREE.Color(props.hexColor) },
      uRimColor: { value: new THREE.Color(props.rimColor) },
      uOpacity: { value: safeOpacity.value },
      uHexScale: { value: safeHexScale.value },
      uHexWidth: { value: safeHexWidth.value },
      uHexOpacity: { value: safeHexOpacity.value },
      uFresnelStrength: { value: safeFresnelStrength.value },
      uSweepWidth: { value: safeSweepWidth.value },
      uSweepIntensity: { value: safeSweepIntensity.value },
      uNoiseScale: { value: safeNoiseScale.value },
      uNoiseSpeed: { value: safeNoiseSpeed.value },
      uStartScale: { value: safeStartScale.value },
      uPulseSpeed: { value: safePulseSpeed.value },
      uPulseIntensity: { value: safePulseIntensity.value },
    },
    vertexShader: shieldVertexShader,
  })
}

const createCoreMaterial = (): LightSpeedShieldMaterial => {
  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshBasicMaterial,
    blending: THREE.AdditiveBlending,
    color: 0xFFFFFF,
    depthWrite: false,
    fragmentShader: coreFragmentShader,
    side: THREE.FrontSide,
    silent: true,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: safeDeployProgress.value },
      uCoreColor: { value: new THREE.Color(props.coreColor) },
      uHotColor: { value: new THREE.Color(props.hotColor) },
      uCoreIntensity: { value: safeCoreIntensity.value },
      uNoiseScale: { value: safeNoiseScale.value },
      uNoiseSpeed: { value: safeNoiseSpeed.value },
      uPulseSpeed: { value: safePulseSpeed.value },
      uPulseIntensity: { value: safePulseIntensity.value },
    },
    vertexShader: coreVertexShader,
  })
}

const syncMaterialUniforms = () => {
  if (!shellMaterial.value || !coreMaterial.value) {
    return
  }

  const shellUniforms = shellMaterial.value.uniforms
  const coreUniforms = coreMaterial.value.uniforms

  setMaterialColor(shellUniforms.uShellColor, props.shellColor, '#48c8ff')
  setMaterialColor(shellUniforms.uHexColor, props.hexColor, '#2e91ff')
  setMaterialColor(shellUniforms.uRimColor, props.rimColor, '#baf7ff')
  setMaterialColor(coreUniforms.uCoreColor, props.coreColor, '#69f6ff')
  setMaterialColor(coreUniforms.uHotColor, props.hotColor, '#e7ffff')

  shellUniforms.uRadius.value = safeRadius.value
  shellUniforms.uOpacity.value = safeOpacity.value
  shellUniforms.uHexScale.value = safeHexScale.value
  shellUniforms.uHexWidth.value = safeHexWidth.value
  shellUniforms.uHexOpacity.value = safeHexOpacity.value
  shellUniforms.uFresnelStrength.value = safeFresnelStrength.value
  shellUniforms.uSweepWidth.value = safeSweepWidth.value
  shellUniforms.uSweepIntensity.value = safeSweepIntensity.value
  shellUniforms.uNoiseScale.value = safeNoiseScale.value
  shellUniforms.uNoiseSpeed.value = safeNoiseSpeed.value
  shellUniforms.uStartScale.value = safeStartScale.value
  shellUniforms.uPulseSpeed.value = safePulseSpeed.value
  shellUniforms.uPulseIntensity.value = safePulseIntensity.value

  coreUniforms.uCoreIntensity.value = safeCoreIntensity.value
  coreUniforms.uNoiseScale.value = safeNoiseScale.value
  coreUniforms.uNoiseSpeed.value = safeNoiseSpeed.value
  coreUniforms.uPulseSpeed.value = safePulseSpeed.value
  coreUniforms.uPulseIntensity.value = safePulseIntensity.value
}

const getAutoProgress = (elapsed: number) => {
  const deployDuration = safeDeployDuration.value
  const holdDuration = safeHoldDuration.value
  const collapseDuration = safeCollapseDuration.value
  const cycleDuration = Math.max(0.001, deployDuration + holdDuration + collapseDuration)
  const phase = elapsed % cycleDuration

  if (phase <= deployDuration) {
    return THREE.MathUtils.smootherstep(phase / deployDuration, 0, 1)
  }

  if (phase <= deployDuration + holdDuration) {
    return 1
  }

  const collapseProgress = (phase - deployDuration - holdDuration) / collapseDuration
  return 1 - THREE.MathUtils.smootherstep(collapseProgress, 0, 1)
}

const getManualProgress = (elapsed: number) => {
  if (!manualDeployActive) {
    return safeDeployProgress.value
  }

  const deployProgress = (elapsed - manualDeployStart) / safeDeployDuration.value
  if (deployProgress >= 1) {
    manualDeployActive = false
    return 1
  }

  return THREE.MathUtils.smootherstep(deployProgress, 0, 1)
}

const triggerDeployAction = () => {
  manualDeployStart = elapsedTime
  manualDeployActive = true
}

shellMaterial.value = createShellMaterial()
coreMaterial.value = createCoreMaterial()

watch(
  [
    () => props.shellColor,
    () => props.hexColor,
    () => props.rimColor,
    () => props.coreColor,
    () => props.hotColor,
    safeCoreIntensity,
    safeFresnelStrength,
    safeHexOpacity,
    safeHexScale,
    safeHexWidth,
    safeNoiseScale,
    safeNoiseSpeed,
    safeOpacity,
    safePulseIntensity,
    safePulseSpeed,
    safeRadius,
    safeStartScale,
    safeSweepIntensity,
    safeSweepWidth,
  ],
  syncMaterialUniforms,
  { immediate: true },
)

watch(
  () => props.deployToken,
  (nextToken) => {
    if (nextToken === previousDeployToken) {
      return
    }

    previousDeployToken = nextToken
    if (!props.autoAnimate) {
      triggerDeployAction()
    }
  },
)

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  elapsedTime = elapsed
  const progress = props.autoAnimate ? getAutoProgress(elapsed) : getManualProgress(elapsed)

  if (shellMaterial.value) {
    shellMaterial.value.uniforms.uTime.value = elapsed
    shellMaterial.value.uniforms.uProgress.value = progress
  }

  if (coreMaterial.value) {
    coreMaterial.value.uniforms.uTime.value = elapsed
    coreMaterial.value.uniforms.uProgress.value = progress
  }
})

defineExpose({
  triggerDeployAction,
})

onBeforeUnmount(() => {
  shellMaterial.value?.dispose()
  coreMaterial.value?.dispose()
  shellMaterial.value = null
  coreMaterial.value = null
})
</script>

<template>
  <TresGroup>
    <TresMesh :render-order="12">
      <TresSphereGeometry :args="[safeRadius, 96, 64]" />
      <primitive
        v-if="shellMaterial"
        :object="shellMaterial"
        attach="material"
      />
    </TresMesh>
    <TresMesh :render-order="11">
      <TresSphereGeometry :args="[safeRadius * safeCoreRadiusRatio, 64, 48]" />
      <primitive
        v-if="coreMaterial"
        :object="coreMaterial"
        attach="material"
      />
    </TresMesh>
  </TresGroup>
</template>
