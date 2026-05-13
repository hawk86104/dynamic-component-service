<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import type { TresObject } from '@tresjs/core'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import {
  computed,
  onBeforeUnmount,
  shallowRef,
  watch,
} from 'vue'
import panelFragmentShader from '../shader/radiantSwirlSkillComponent/panel.frag?raw'
import panelVertexShader from '../shader/radiantSwirlSkillComponent/panel.vert?raw'

type RadiantSwirlSkillMaterial = CustomShaderMaterial<typeof THREE.MeshBasicMaterial>

const props = withDefaults(
  defineProps<{
    animationSpeed?: number
    autoAnimate?: boolean
    baseColor?: string
    bladeCount?: number
    coreColor?: string
    coreIntensity?: number
    glowColor?: string
    highlightColor?: string
    noiseScale?: number
    opacity?: number
    progress?: number
    radius?: number
    sparkleIntensity?: number
    swirlIntensity?: number
  }>(),
  {
    animationSpeed: 0.6,
    autoAnimate: true,
    baseColor: '#0d3b1a',
    bladeCount: 9,
    coreColor: '#e8ffc7',
    coreIntensity: 1.8,
    glowColor: '#7cff4c',
    highlightColor: '#d6ff86',
    noiseScale: 1.2,
    opacity: 1,
    progress: 0.5,
    radius: 4,
    sparkleIntensity: 1,
    swirlIntensity: 2.4,
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

const safeAnimationSpeed = computed(() => clampNumber(props.animationSpeed, -1, 1, 0.6))
const safeBladeCount = computed(() => clampNumber(props.bladeCount, 1, 32, 9))
const safeCoreIntensity = computed(() => clampNumber(props.coreIntensity, 0, 6, 1.8))
const safeNoiseScale = computed(() => clampNumber(props.noiseScale, 0.1, 6, 1.2))
const safeOpacity = computed(() => clampNumber(props.opacity, 0.05, 1, 1))
const safeProgress = computed(() => clampNumber(props.progress, 0, 1, 0.5))
const safeRadius = computed(() => clampNumber(props.radius, 0.5, 30, 4))
const safeSparkleIntensity = computed(() => clampNumber(props.sparkleIntensity, 0, 4, 1))
const safeSwirlIntensity = computed(() => clampNumber(props.swirlIntensity, 0, 8, 2.4))

// 圆柱: 半径 = safeRadius/2, 高度 = safeRadius, 形状刚好是 "直径=高度" 的矮柱
// 这让归一化用一个 halfSize 就够: xz 方向和 y 方向归一化因子相同
const safeHalfSize = computed(() => Math.max(safeRadius.value * 0.5, 0.0001))
const safeCenterY = computed(() => safeRadius.value * 0.5)

const invModelMatrix = new THREE.Matrix4()
const meshRef = shallowRef<TresObject | null>(null)

const createPanelMaterial = (): RadiantSwirlSkillMaterial => {
  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshBasicMaterial,
    color: 0xFFFFFF,
    depthTest: true,
    depthWrite: false,
    fragmentShader: panelFragmentShader,
    side: THREE.BackSide,
    silent: true,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uBaseColor: { value: new THREE.Color(props.baseColor) },
      uBladeCount: { value: safeBladeCount.value },
      uCoreColor: { value: new THREE.Color(props.coreColor) },
      uCoreIntensity: { value: safeCoreIntensity.value },
      uGlowColor: { value: new THREE.Color(props.glowColor) },
      uHalfSize: { value: safeHalfSize.value },
      uHighlightColor: { value: new THREE.Color(props.highlightColor) },
      uInvModel: { value: invModelMatrix },
      uNoiseScale: { value: safeNoiseScale.value },
      uOpacity: { value: safeOpacity.value },
      uProgress: { value: safeProgress.value },
      uSparkleIntensity: { value: safeSparkleIntensity.value },
      uSwirlIntensity: { value: safeSwirlIntensity.value },
      uTime: { value: 0 },
    },
    vertexShader: panelVertexShader,
  })
}

const panelMaterial = shallowRef<RadiantSwirlSkillMaterial | null>(createPanelMaterial())

const syncMaterialUniforms = () => {
  if (!panelMaterial.value) {
    return
  }

  const uniforms = panelMaterial.value.uniforms

  setMaterialColor(uniforms.uBaseColor, props.baseColor, '#0d3b1a')
  setMaterialColor(uniforms.uCoreColor, props.coreColor, '#e8ffc7')
  setMaterialColor(uniforms.uGlowColor, props.glowColor, '#7cff4c')
  setMaterialColor(uniforms.uHighlightColor, props.highlightColor, '#d6ff86')
  uniforms.uBladeCount.value = safeBladeCount.value
  uniforms.uCoreIntensity.value = safeCoreIntensity.value
  uniforms.uHalfSize.value = safeHalfSize.value
  uniforms.uNoiseScale.value = safeNoiseScale.value
  uniforms.uOpacity.value = safeOpacity.value
  uniforms.uSparkleIntensity.value = safeSparkleIntensity.value
  uniforms.uSwirlIntensity.value = safeSwirlIntensity.value

  if (!props.autoAnimate) {
    uniforms.uProgress.value = safeProgress.value
  }
}

watch(
  [
    () => props.autoAnimate,
    () => props.baseColor,
    () => props.coreColor,
    () => props.glowColor,
    () => props.highlightColor,
    safeBladeCount,
    safeCoreIntensity,
    safeHalfSize,
    safeNoiseScale,
    safeOpacity,
    safeProgress,
    safeSparkleIntensity,
    safeSwirlIntensity,
  ],
  syncMaterialUniforms,
  { immediate: true },
)

// 相位累加器: 所有动画只由 phase 驱动, 速度为 0 时 phase 不变 -> 画面完全静止
// 负值则反向回放
let phase = 0
let lastElapsed: number | null = null

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  if (!panelMaterial.value) {
    return
  }

  const delta = lastElapsed === null ? 0 : Math.max(0, elapsed - lastElapsed)
  lastElapsed = elapsed
  phase += delta * safeAnimationSpeed.value

  const uniforms = panelMaterial.value.uniforms
  uniforms.uTime.value = phase

  if (props.autoAnimate) {
    // autoAnimate 下也由 phase 推进 progress, 速度 0 时 progress 冻结
    const raw = phase * 0.5
    uniforms.uProgress.value = ((raw % 1) + 1) % 1
  }

  const mesh = meshRef.value as THREE.Mesh | null
  if (mesh) {
    invModelMatrix.copy(mesh.matrixWorld).invert()
    uniforms.uInvModel.value = invModelMatrix
  }
})

onBeforeUnmount(() => {
  panelMaterial.value?.dispose()
  panelMaterial.value = null
})
</script>

<template>
  <TresGroup>
    <!-- 圆柱容器: 半径 = safeRadius/2, 高度 = safeRadius, 中心上移半径让底面贴地 -->
    <TresMesh
      ref="meshRef"
      :position="[0, safeCenterY, 0]"
      :render-order="8"
    >
      <TresCylinderGeometry :args="[safeHalfSize, safeHalfSize, safeRadius, 64, 1, false]" />
      <primitive
        v-if="panelMaterial"
        :object="panelMaterial"
        attach="material"
      />
    </TresMesh>
  </TresGroup>
</template>
