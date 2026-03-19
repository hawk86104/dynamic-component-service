<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'
import {
  computed,
  onBeforeUnmount,
  shallowRef,
  watch,
} from 'vue'
import smokeFragmentShader from '../shader/flowingSmokeComponent/smoke.frag?raw'
import smokeVertexShader from '../shader/flowingSmokeComponent/smoke.vert?raw'

const props = withDefaults(
  defineProps<{
    color?: string
    density?: number
    directionX?: number
    directionY?: number
    directionZ?: number
    flowRate?: number
    lifeRange?: number
    opacity?: number
    particleSize?: number
    spread?: number
  }>(),
  {
    color: '#bfc7cf',
    density: 0.65,
    directionX: 0,
    directionY: 1,
    directionZ: 0,
    flowRate: 1.1,
    lifeRange: 4.8,
    opacity: 0.42,
    particleSize: 34,
    spread: 0.45,
  },
)

const MAX_PARTICLES = 360

const smokePoints = shallowRef<THREE.Points | null>(null)
const smokeGeometry = shallowRef<THREE.BufferGeometry | null>(null)
const smokeMaterial = shallowRef<THREE.ShaderMaterial | null>(null)

const clampNumber = (value: number | undefined, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback
  }
  return THREE.MathUtils.clamp(value as number, min, max)
}

const safeFlowRate = computed(() => clampNumber(props.flowRate, 0.05, 6, 1.1))
const safeDensity = computed(() => clampNumber(props.density, 0.05, 1, 0.65))
const safeSpread = computed(() => clampNumber(props.spread, 0.05, 3, 0.45))
const safeOpacity = computed(() => clampNumber(props.opacity, 0.05, 1, 0.42))
const safeParticleSize = computed(() => clampNumber(props.particleSize, 8, 90, 34))
const safeLifeRange = computed(() => clampNumber(props.lifeRange, 0.5, 14, 4.8))
const safeDirection = computed(() => {
  const direction = new THREE.Vector3(
    clampNumber(props.directionX, -1, 1, 0),
    clampNumber(props.directionY, -1, 1, 1),
    clampNumber(props.directionZ, -1, 1, 0),
  )

  if (direction.lengthSq() < 0.0001) {
    direction.set(0, 1, 0)
  }

  return direction.normalize()
})
const visibleParticleCount = computed(() => Math.max(8, Math.round(MAX_PARTICLES * safeDensity.value)))

const smokeUniforms = {
  uColor: { value: new THREE.Color(props.color) },
  uDensity: { value: safeDensity.value },
  uDirection: { value: safeDirection.value.clone() },
  uFlowRate: { value: safeFlowRate.value },
  uLifeRange: { value: safeLifeRange.value },
  uOpacity: { value: safeOpacity.value },
  uParticleSize: { value: safeParticleSize.value },
  uSpread: { value: safeSpread.value },
  uTime: { value: 0 },
}

const disposeSmokeCloud = () => {
  smokeGeometry.value?.dispose()
  smokeMaterial.value?.dispose()
  smokeGeometry.value = null
  smokeMaterial.value = null
  smokePoints.value = null
}

const createSmokeCloud = () => {
  disposeSmokeCloud()

  const positions = new Float32Array(MAX_PARTICLES * 3)
  const jitters = new Float32Array(MAX_PARTICLES * 3)
  const seeds = new Float32Array(MAX_PARTICLES)
  const lifeOffsets = new Float32Array(MAX_PARTICLES)
  const sizeFactors = new Float32Array(MAX_PARTICLES)

  for (let index = 0; index < MAX_PARTICLES; index += 1) {
    const cursor = index * 3
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * 0.08

    positions[cursor] = Math.cos(angle) * radius
    positions[cursor + 1] = (Math.random() - 0.5) * 0.05
    positions[cursor + 2] = Math.sin(angle) * radius

    jitters[cursor] = Math.random() * 2 - 1
    jitters[cursor + 1] = Math.random() * 2 - 1
    jitters[cursor + 2] = Math.random() * 2 - 1

    seeds[index] = Math.random()
    lifeOffsets[index] = Math.random()
    sizeFactors[index] = 0.75 + Math.random() * 0.95
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aJitter', new THREE.BufferAttribute(jitters, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aLifeOffset', new THREE.BufferAttribute(lifeOffsets, 1))
  geometry.setAttribute('aSizeFactor', new THREE.BufferAttribute(sizeFactors, 1))
  geometry.setDrawRange(0, visibleParticleCount.value)

  const material = new THREE.ShaderMaterial({
    blending: THREE.NormalBlending,
    depthTest: true,
    depthWrite: false,
    fragmentShader: smokeFragmentShader,
    transparent: true,
    uniforms: smokeUniforms,
    vertexShader: smokeVertexShader,
  })

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  points.renderOrder = 8

  smokeGeometry.value = geometry
  smokeMaterial.value = material
  smokePoints.value = points
}

createSmokeCloud()

watch(
  [() => props.color, safeDensity, safeDirection, safeFlowRate, safeLifeRange, safeOpacity, safeParticleSize, safeSpread],
  ([color, density, direction, flowRate, lifeRange, opacity, particleSize, spread]) => {
    if (!smokeMaterial.value || !smokeGeometry.value) {
      return
    }

    smokeMaterial.value.uniforms.uColor.value.set(color)
    smokeMaterial.value.uniforms.uDensity.value = density
    smokeMaterial.value.uniforms.uDirection.value.copy(direction)
    smokeMaterial.value.uniforms.uFlowRate.value = flowRate
    smokeMaterial.value.uniforms.uLifeRange.value = lifeRange
    smokeMaterial.value.uniforms.uOpacity.value = opacity
    smokeMaterial.value.uniforms.uParticleSize.value = particleSize
    smokeMaterial.value.uniforms.uSpread.value = spread
    smokeGeometry.value.setDrawRange(0, visibleParticleCount.value)
  },
  { immediate: true },
)

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  if (!smokeMaterial.value) {
    return
  }

  smokeMaterial.value.uniforms.uTime.value = elapsed
})

onBeforeUnmount(() => {
  disposeSmokeCloud()
})
</script>

<template>
  <TresGroup>
    <primitive
      v-if="smokePoints"
      :object="smokePoints"
    />
  </TresGroup>
</template>
