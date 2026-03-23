<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import {
  onBeforeUnmount,
  shallowRef,
  watch,
} from 'vue'
import shieldFragmentShader from '../shader/superEnergyShieldComponent/shield.frag?raw'
import shieldVertexShader from '../shader/superEnergyShieldComponent/shield.vert?raw'

type ImpactPointLike = THREE.Vector3 | { x: number, y: number, z: number }
type ShieldCustomMaterial = CustomShaderMaterial<typeof THREE.MeshBasicMaterial>

const props = withDefaults(
  defineProps<{
    color?: string
    edgeWidth?: number
    enableSelfHit?: boolean
    fadeStart?: number
    flashIntensity?: number
    flashSpeed?: number
    flowIntensity?: number
    flowScale?: number
    flowSpeed?: number
    fresnelPower?: number
    fresnelStrength?: number
    hexOpacity?: number
    hexScale?: number
    hitDuration?: number
    hitImpactRadius?: number
    hitIntensity?: number
    hitMaxRadius?: number
    hitRingSpeed?: number
    hitRingWidth?: number
    noiseEdgeColor?: string
    noiseEdgeIntensity?: number
    noiseEdgeSmoothness?: number
    noiseEdgeWidth?: number
    noiseScale?: number
    opacity?: number
    showHex?: boolean
  }>(),
  {
    color: '#26aeff',
    edgeWidth: 0.06,
    enableSelfHit: false,
    fadeStart: 0,
    flashIntensity: 0.11,
    flashSpeed: 0.6,
    flowIntensity: 4,
    flowScale: 2.4,
    flowSpeed: 1.13,
    fresnelPower: 1.8,
    fresnelStrength: 1.75,
    hexOpacity: 0.13,
    hexScale: 3,
    hitDuration: 1.8,
    hitImpactRadius: 0.3,
    hitIntensity: 4.1,
    hitMaxRadius: 0.85,
    hitRingSpeed: 1.75,
    hitRingWidth: 0.12,
    noiseEdgeColor: '#26aeff',
    noiseEdgeIntensity: 10,
    noiseEdgeSmoothness: 0.5,
    noiseEdgeWidth: 0.02,
    noiseScale: 1.3,
    opacity: 0.76,
    showHex: true,
  },
)

const BASE_SHIELD_RADIUS = 1.8
const MAX_HITS = 6
const DEFAULT_HIT_TIME = -999

const shieldMesh = shallowRef<THREE.Mesh | null>(null)
const shieldMaterial = shallowRef<ShieldCustomMaterial | null>(null)

let elapsedTime = 0
let hitIndex = 0

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

const createShieldMaterial = () => {
  const hitPositions = Array.from({ length: MAX_HITS }, () => new THREE.Vector3(0, BASE_SHIELD_RADIUS, 0))
  const hitTimes = Array.from({ length: MAX_HITS }, () => DEFAULT_HIT_TIME)

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
      uColor: { value: new THREE.Color(props.color) },
      uLife: { value: 1 },
      uHexScale: { value: props.hexScale },
      uEdgeWidth: { value: props.edgeWidth },
      uFresnelPower: { value: props.fresnelPower },
      uFresnelStrength: { value: props.fresnelStrength },
      uOpacity: { value: props.opacity },
      uReveal: { value: 0 },
      uFlashSpeed: { value: props.flashSpeed },
      uFlashIntensity: { value: props.flashIntensity },
      uNoiseScale: { value: props.noiseScale },
      uNoiseEdgeColor: { value: new THREE.Color(props.noiseEdgeColor) },
      uNoiseEdgeWidth: { value: props.noiseEdgeWidth },
      uNoiseEdgeIntensity: { value: props.noiseEdgeIntensity },
      uNoiseEdgeSmoothness: { value: props.noiseEdgeSmoothness },
      uHexOpacity: { value: props.hexOpacity },
      uShowHex: { value: props.showHex ? 1 : 0 },
      uFlowScale: { value: props.flowScale },
      uFlowSpeed: { value: props.flowSpeed },
      uFlowIntensity: { value: props.flowIntensity },
      uHitPos: { value: hitPositions },
      uHitTime: { value: hitTimes },
      uHitRingSpeed: { value: props.hitRingSpeed },
      uHitRingWidth: { value: props.hitRingWidth },
      uHitMaxRadius: { value: props.hitMaxRadius },
      uHitDuration: { value: props.hitDuration },
      uHitIntensity: { value: props.hitIntensity },
      uHitImpactRadius: { value: props.hitImpactRadius },
      uFadeStart: { value: props.fadeStart },
    },
    vertexShader: shieldVertexShader,
  })
}

const resetHitBuffer = () => {
  if (!shieldMaterial.value) {
    return
  }

  const hitPositions = shieldMaterial.value.uniforms.uHitPos.value as THREE.Vector3[]
  const hitTimes = shieldMaterial.value.uniforms.uHitTime.value as number[]

  hitPositions.forEach((point) => {
    point.set(0, BASE_SHIELD_RADIUS, 0)
  })
  hitTimes.fill(DEFAULT_HIT_TIME)
  hitIndex = 0
}

const syncMaterialUniforms = () => {
  if (!shieldMaterial.value) {
    return
  }

  const uniforms = shieldMaterial.value.uniforms

  setMaterialColor(uniforms.uColor, props.color, '#26aeff')
  setMaterialColor(uniforms.uNoiseEdgeColor, props.noiseEdgeColor, '#26aeff')

  uniforms.uHexScale.value = clampNumber(props.hexScale, 1, 20, 3)
  uniforms.uHexOpacity.value = clampNumber(props.hexOpacity, 0, 1, 0.13)
  uniforms.uShowHex.value = props.showHex ? 1 : 0
  uniforms.uEdgeWidth.value = clampNumber(props.edgeWidth, 0.01, 0.2, 0.06)
  uniforms.uFresnelPower.value = clampNumber(props.fresnelPower, 0.5, 5, 1.8)
  uniforms.uFresnelStrength.value = clampNumber(props.fresnelStrength, 0, 3, 1.75)
  uniforms.uOpacity.value = clampNumber(props.opacity, 0, 1, 0.76)
  uniforms.uFadeStart.value = clampNumber(props.fadeStart, -1, 1, 0)
  uniforms.uFlashSpeed.value = clampNumber(props.flashSpeed, 0.5, 8, 0.6)
  uniforms.uFlashIntensity.value = clampNumber(props.flashIntensity, 0, 1, 0.11)
  uniforms.uNoiseScale.value = clampNumber(props.noiseScale, 0.5, 10, 1.3)
  uniforms.uNoiseEdgeWidth.value = clampNumber(props.noiseEdgeWidth, 0.01, 0.5, 0.02)
  uniforms.uNoiseEdgeIntensity.value = clampNumber(props.noiseEdgeIntensity, 0, 10, 10)
  uniforms.uNoiseEdgeSmoothness.value = clampNumber(props.noiseEdgeSmoothness, 0, 1, 0.5)
  uniforms.uFlowScale.value = clampNumber(props.flowScale, 0.1, 8, 2.4)
  uniforms.uFlowSpeed.value = clampNumber(props.flowSpeed, 0, 2, 1.13)
  uniforms.uFlowIntensity.value = clampNumber(props.flowIntensity, 0, 4, 4)
  uniforms.uHitRingSpeed.value = clampNumber(props.hitRingSpeed, 0.1, 6, 1.75)
  uniforms.uHitRingWidth.value = clampNumber(props.hitRingWidth, 0.01, 0.5, 0.12)
  uniforms.uHitMaxRadius.value = clampNumber(props.hitMaxRadius, 0.2, Math.PI, 0.85)
  uniforms.uHitDuration.value = clampNumber(props.hitDuration, 0.5, 6, 1.8)
  uniforms.uHitIntensity.value = clampNumber(props.hitIntensity, 0, 8, 4.1)
  uniforms.uHitImpactRadius.value = clampNumber(props.hitImpactRadius, 0.1, 1.5, 0.3)
}

const toVector3 = (point: ImpactPointLike) => {
  return point instanceof THREE.Vector3 ? point.clone() : new THREE.Vector3(point.x, point.y, point.z)
}

const registerImpactLocal = (point: ImpactPointLike) => {
  if (!shieldMaterial.value) {
    return
  }

  const localPoint = toVector3(point)
  const uniforms = shieldMaterial.value.uniforms
  const hitPositions = uniforms.uHitPos.value as THREE.Vector3[]
  const hitTimes = uniforms.uHitTime.value as number[]
  const nextIndex = hitIndex % MAX_HITS

  hitPositions[nextIndex].copy(localPoint)
  hitTimes[nextIndex] = elapsedTime
  hitIndex += 1
}

const registerImpactWorld = (point: ImpactPointLike) => {
  if (!shieldMesh.value) {
    return
  }

  const localPoint = shieldMesh.value.worldToLocal(toVector3(point))
  registerImpactLocal(localPoint)
}

const registerImpact = (point: ImpactPointLike, space: 'local' | 'world' = 'world') => {
  if (space === 'local') {
    registerImpactLocal(point)
    return
  }
  registerImpactWorld(point)
}

const handleSelfHit = (event: { point?: THREE.Vector3 | null }) => {
  if (!props.enableSelfHit || !event.point) {
    return
  }

  registerImpactWorld(event.point)
}

shieldMaterial.value = createShieldMaterial()

watch(
  () => [
    props.color,
    props.edgeWidth,
    props.fadeStart,
    props.flashIntensity,
    props.flashSpeed,
    props.flowIntensity,
    props.flowScale,
    props.flowSpeed,
    props.fresnelPower,
    props.fresnelStrength,
    props.hexOpacity,
    props.hexScale,
    props.hitDuration,
    props.hitImpactRadius,
    props.hitIntensity,
    props.hitMaxRadius,
    props.hitRingSpeed,
    props.hitRingWidth,
    props.noiseEdgeColor,
    props.noiseEdgeIntensity,
    props.noiseEdgeSmoothness,
    props.noiseEdgeWidth,
    props.noiseScale,
    props.opacity,
    props.showHex,
  ],
  syncMaterialUniforms,
  { immediate: true },
)

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  elapsedTime = elapsed

  if (!shieldMaterial.value) {
    return
  }

  shieldMaterial.value.uniforms.uTime.value = elapsed
})

defineExpose({
  registerImpact,
  registerImpactLocal,
  registerImpactWorld,
  resetHitBuffer,
})

onBeforeUnmount(() => {
  shieldMaterial.value?.dispose()
  shieldMaterial.value = null
  shieldMesh.value = null
})
</script>

<template>
  <TresGroup>
    <TresMesh
      ref="shieldMesh"
      :render-order="8"
      @click="handleSelfHit"
    >
      <TresSphereGeometry :args="[BASE_SHIELD_RADIUS, 64, 64]" />
      <primitive
        v-if="shieldMaterial"
        :object="shieldMaterial"
        attach="material"
      />
    </TresMesh>
  </TresGroup>
</template>
