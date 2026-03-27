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
import liquidFragmentShader from '../../shader/liquidBubbleComponent/liquid.frag?raw'
import liquidVertexShader from '../../shader/liquidBubbleComponent/liquid.vert?raw'
import {
  clampInteger,
  clampNumber,
  type LiquidBubbleShape,
  normalizeShapeType,
  setMaterialColor,
} from './shared'
import { createBubbleField } from './useBubbleField'

type LiquidMaterial = CustomShaderMaterial<typeof THREE.MeshBasicMaterial>

const props = withDefaults(
  defineProps<{
    bubbleColor?: string
    bubbleCount?: number
    bubbleOpacity?: number
    bubbleSize?: number
    bubbleSpeed?: number
    bubbleSpread?: number
    depth?: number
    height?: number
    liquidColor?: string
    liquidTopColor?: string
    opacity?: number
    radius?: number
    shapeType?: LiquidBubbleShape
    width?: number
  }>(),
  {
    bubbleColor: '#fff8e8',
    bubbleCount: 110,
    bubbleOpacity: 0.72,
    bubbleSize: 0.14,
    bubbleSpeed: 0.72,
    bubbleSpread: 0.3,
    depth: 1.4,
    height: 3.2,
    liquidColor: '#b98038',
    liquidTopColor: '#f6d490',
    opacity: 0.7,
    radius: 0.92,
    shapeType: 'cylinder',
    width: 1.6,
  },
)

const liquidMaterial = shallowRef<LiquidMaterial | null>(null)
const bubbleField = shallowRef<ReturnType<typeof createBubbleField> | null>(null)

const safeShapeType = computed(() => normalizeShapeType(props.shapeType))
const safeWidth = computed(() => clampNumber(props.width, 0.4, 8, 1.6))
const safeDepth = computed(() => clampNumber(props.depth, 0.4, 8, 1.4))
const safeHeight = computed(() => clampNumber(props.height, 0.8, 8, 3.2))
const safeRadius = computed(() => clampNumber(props.radius, 0.2, 4, 0.92))
const safeOpacity = computed(() => clampNumber(props.opacity, 0.08, 0.95, 0.7))
const safeBubbleCount = computed(() => clampInteger(props.bubbleCount, 0, 240, 110))
const safeBubbleOpacity = computed(() => clampNumber(props.bubbleOpacity, 0.05, 1, 0.72))
const safeBubbleSpeed = computed(() => clampNumber(props.bubbleSpeed, 0.1, 4, 0.72))
const safeBubbleSize = computed(() => clampNumber(props.bubbleSize, 0.002, 1, 0.14))
const safeBubbleSpread = computed(() => clampNumber(props.bubbleSpread, 0.02, 1.2, 0.3))

const effectiveDepth = computed(() => (safeShapeType.value === 'box' ? safeDepth.value : safeRadius.value * 2))
const effectiveWidth = computed(() => (safeShapeType.value === 'box' ? safeWidth.value : safeRadius.value * 2))

const createLiquidMaterial = () => {
  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshBasicMaterial,
    color: 0xFFFFFF,
    depthTest: true,
    depthWrite: false,
    fragmentShader: liquidFragmentShader,
    side: THREE.DoubleSide,
    silent: true,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uBaseColor: { value: new THREE.Color(props.liquidColor) },
      uDepth: { value: effectiveDepth.value },
      uHeight: { value: safeHeight.value },
      uOpacity: { value: safeOpacity.value },
      uRadius: { value: safeRadius.value },
      uShapeType: { value: safeShapeType.value === 'box' ? 0 : 1 },
      uTopColor: { value: new THREE.Color(props.liquidTopColor) },
      uWidth: { value: effectiveWidth.value },
    },
    vertexShader: liquidVertexShader,
  })
}

const syncLiquidMaterial = () => {
  if (!liquidMaterial.value) {
    return
  }

  const uniforms = liquidMaterial.value.uniforms

  setMaterialColor(uniforms.uBaseColor, props.liquidColor, '#b98038')
  setMaterialColor(uniforms.uTopColor, props.liquidTopColor, '#f6d490')
  uniforms.uDepth.value = effectiveDepth.value
  uniforms.uHeight.value = safeHeight.value
  uniforms.uOpacity.value = safeOpacity.value
  uniforms.uRadius.value = safeRadius.value
  uniforms.uShapeType.value = safeShapeType.value === 'box' ? 0 : 1
  uniforms.uWidth.value = effectiveWidth.value
}

const syncBubbleField = () => {
  if (!bubbleField.value) {
    return
  }

  bubbleField.value.sync({
    bubbleColor: props.bubbleColor,
    bubbleCount: safeBubbleCount.value,
    bubbleOpacity: safeBubbleOpacity.value,
    bubbleSize: safeBubbleSize.value,
    bubbleSpeed: safeBubbleSpeed.value,
    bubbleSpread: safeBubbleSpread.value,
    depth: effectiveDepth.value,
    height: safeHeight.value,
    radius: safeRadius.value,
    shapeType: safeShapeType.value,
    width: effectiveWidth.value,
  })
}

liquidMaterial.value = createLiquidMaterial()
bubbleField.value = createBubbleField({
  bubbleColor: props.bubbleColor,
  bubbleCount: safeBubbleCount.value,
  bubbleOpacity: safeBubbleOpacity.value,
  bubbleSize: safeBubbleSize.value,
  bubbleSpeed: safeBubbleSpeed.value,
  bubbleSpread: safeBubbleSpread.value,
  depth: effectiveDepth.value,
  height: safeHeight.value,
  radius: safeRadius.value,
  shapeType: safeShapeType.value,
  width: effectiveWidth.value,
})

watch(
  [
    () => props.liquidColor,
    () => props.liquidTopColor,
    effectiveDepth,
    effectiveWidth,
    safeHeight,
    safeOpacity,
    safeRadius,
    safeShapeType,
  ],
  syncLiquidMaterial,
  { immediate: true },
)

watch(
  [
    () => props.bubbleColor,
    effectiveDepth,
    effectiveWidth,
    safeBubbleCount,
    safeBubbleOpacity,
    safeBubbleSize,
    safeBubbleSpeed,
    safeBubbleSpread,
    safeHeight,
    safeRadius,
    safeShapeType,
  ],
  syncBubbleField,
  { immediate: true },
)

watch(
  safeShapeType,
  (shapeType) => {
    bubbleField.value?.setShapeType(shapeType)
    syncBubbleField()
    syncLiquidMaterial()
  },
)

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  bubbleField.value?.setTime(elapsed)
})

onBeforeUnmount(() => {
  liquidMaterial.value?.dispose()
  bubbleField.value?.dispose()
  liquidMaterial.value = null
  bubbleField.value = null
})
</script>

<template>
  <TresGroup>
    <TresMesh :position="[0, safeHeight / 2, 0]" :render-order="4">
      <TresBoxGeometry
        v-if="safeShapeType === 'box'"
        :args="[safeWidth, safeHeight, safeDepth]"
      />
      <TresCylinderGeometry
        v-else
        :args="[safeRadius, safeRadius, safeHeight, 56, 1, false]"
      />
      <primitive
        v-if="liquidMaterial"
        :object="liquidMaterial"
        attach="material"
      />
    </TresMesh>

    <primitive
      v-if="bubbleField"
      :object="bubbleField.points"
      :position="[0, safeHeight / 2, 0]"
    />
  </TresGroup>
</template>
