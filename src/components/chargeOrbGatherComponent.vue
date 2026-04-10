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
import baseVertexShader from '../shader/chargeOrbGatherComponent/base.vert?raw'
import fresnelFragmentShader from '../shader/chargeOrbGatherComponent/fresnel.frag?raw'
import glowFragmentShader from '../shader/chargeOrbGatherComponent/glow.frag?raw'
import noiseFragmentShader from '../shader/chargeOrbGatherComponent/noise.frag?raw'

type OrbCustomMaterial = CustomShaderMaterial<typeof THREE.MeshBasicMaterial>

interface Particle {
  active: boolean
  life: number
  maxLife: number
  phase: number
  pos: THREE.Vector3
}

const props = withDefaults(
  defineProps<{
    autoAnimate?: boolean
    bodyFalloff?: number
    chargeProgress?: number
    coreBoost?: number
    coreFalloff?: number
    cycleDuration?: number
    flowIntensity?: number
    fresnelEmission?: number
    fresnelPower?: number
    glowColorInner?: string
    glowColorOuter?: string
    glowEdgeSoftness?: number
    glowEmission?: number
    glowEnabled?: boolean
    glowFalloffPower?: number
    glowSizeMult?: number
    noiseColor?: string
    noiseScale?: number
    noiseSpeed?: number
    orbCoreColor?: string
    orbMaxSize?: number
    orbRimColor?: string
    particleColor?: string
    particleCount?: number
    particleEmission?: number
    particleLength?: number
    particleLifetime?: number
    particleSpawnRadius?: number
    particleSpeed?: number
    particleTurbulence?: number
    particleWidth?: number
    warpStrength?: number
  }>(),
  {
    autoAnimate: true,
    bodyFalloff: 5.6,
    chargeProgress: 0,
    coreBoost: 2.3,
    coreFalloff: 4.4,
    cycleDuration: 2.4,
    flowIntensity: 4.7,
    fresnelEmission: 1.8,
    fresnelPower: 0.1,
    glowColorInner: '#cb5151',
    glowColorOuter: '#000000',
    glowEdgeSoftness: 4,
    glowEmission: 1.6,
    glowEnabled: false,
    glowFalloffPower: 6,
    glowSizeMult: 1.7,
    noiseColor: '#128bff',
    noiseScale: 0.4,
    noiseSpeed: 1.35,
    orbCoreColor: '#eaf8fc',
    orbMaxSize: 0.4,
    orbRimColor: '#0c61f5',
    particleColor: '#59afff',
    particleCount: 16,
    particleEmission: 3,
    particleLength: 0.13,
    particleLifetime: 0.6,
    particleSpawnRadius: 2.1,
    particleSpeed: 3.9,
    particleTurbulence: 1.1,
    particleWidth: 0.1,
    warpStrength: 2.3,
  },
)

const MAX_PARTICLES = 40

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

const safeBodyFalloff = computed(() => clampNumber(props.bodyFalloff, 0.1, 8, 5.6))
const safeChargeProgress = computed(() => clampNumber(props.chargeProgress, 0, 1, 0))
const safeCoreBoost = computed(() => clampNumber(props.coreBoost, 0, 10, 2.3))
const safeCoreFalloff = computed(() => clampNumber(props.coreFalloff, 0.5, 10, 4.4))
const safeCycleDuration = computed(() => clampNumber(props.cycleDuration, 0.6, 8, 2.4))
const safeFlowIntensity = computed(() => clampNumber(props.flowIntensity, 0, 15, 4.7))
const safeFresnelEmission = computed(() => clampNumber(props.fresnelEmission, 0.1, 30, 1.8))
const safeFresnelPower = computed(() => clampNumber(props.fresnelPower, 0.1, 4, 0.1))
const safeGlowEdgeSoftness = computed(() => clampNumber(props.glowEdgeSoftness, 0.1, 8, 4))
const safeGlowEmission = computed(() => clampNumber(props.glowEmission, 0, 8, 1.6))
const safeGlowFalloffPower = computed(() => clampNumber(props.glowFalloffPower, 0.1, 8, 6))
const safeGlowSizeMult = computed(() => clampNumber(props.glowSizeMult, 1, 10, 1.7))
const safeNoiseScale = computed(() => clampNumber(props.noiseScale, 0.1, 20, 0.4))
const safeNoiseSpeed = computed(() => clampNumber(props.noiseSpeed, 0, 4, 1.35))
const safeOrbMaxSize = computed(() => clampNumber(props.orbMaxSize, 0.01, 3, 0.4))
const safeParticleCount = computed(() => Math.round(clampNumber(props.particleCount, 1, MAX_PARTICLES, 16)))
const safeParticleEmission = computed(() => clampNumber(props.particleEmission, 0.1, 20, 3))
const safeParticleLength = computed(() => clampNumber(props.particleLength, 0.005, 0.5, 0.13))
const safeParticleLifetime = computed(() => clampNumber(props.particleLifetime, 0.1, 3, 0.6))
const safeParticleSpawnRadius = computed(() => clampNumber(props.particleSpawnRadius, 0.1, 5, 2.1))
const safeParticleSpeed = computed(() => clampNumber(props.particleSpeed, 0.1, 10, 3.9))
const safeParticleTurbulence = computed(() => clampNumber(props.particleTurbulence, 0, 5, 1.1))
const safeParticleWidth = computed(() => clampNumber(props.particleWidth, 0.005, 0.3, 0.1))
const safeWarpStrength = computed(() => clampNumber(props.warpStrength, 0, 8, 2.3))

const rootGroup = shallowRef<THREE.Group | null>(null)
const glowMesh = shallowRef<THREE.Mesh | null>(null)
const fresnelMesh = shallowRef<THREE.Mesh | null>(null)
const noiseMesh = shallowRef<THREE.Mesh | null>(null)
const particleMesh = shallowRef<THREE.InstancedMesh | null>(null)

const sphereGeometry = new THREE.SphereGeometry(1, 32, 32)
const capsuleGeometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8)

const createGlowMaterial = (): OrbCustomMaterial => {
  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshBasicMaterial,
    blending: THREE.AdditiveBlending,
    color: 0xFFFFFF,
    depthTest: true,
    depthWrite: false,
    fragmentShader: glowFragmentShader,
    silent: true,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uColorInner: { value: new THREE.Color(props.glowColorInner) },
      uColorOuter: { value: new THREE.Color(props.glowColorOuter) },
      uEdgeSoftness: { value: safeGlowEdgeSoftness.value },
      uEmission: { value: safeGlowEmission.value },
      uFalloffPower: { value: safeGlowFalloffPower.value },
      uProgress: { value: 0 },
    },
    vertexShader: baseVertexShader,
  })
}

const createFresnelMaterial = (): OrbCustomMaterial => {
  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshBasicMaterial,
    blending: THREE.AdditiveBlending,
    color: 0xFFFFFF,
    depthTest: true,
    depthWrite: false,
    fragmentShader: fresnelFragmentShader,
    silent: true,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uBodyFalloff: { value: safeBodyFalloff.value },
      uCoreBoost: { value: safeCoreBoost.value },
      uCoreColor: { value: new THREE.Color(props.orbCoreColor) },
      uCoreFalloff: { value: safeCoreFalloff.value },
      uEmission: { value: safeFresnelEmission.value },
      uFresnelPower: { value: safeFresnelPower.value },
      uProgress: { value: 0 },
      uRimColor: { value: new THREE.Color(props.orbRimColor) },
    },
    vertexShader: baseVertexShader,
  })
}

const createNoiseMaterial = (): OrbCustomMaterial => {
  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshBasicMaterial,
    blending: THREE.AdditiveBlending,
    color: 0xFFFFFF,
    depthTest: true,
    depthWrite: false,
    fragmentShader: noiseFragmentShader,
    silent: true,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uColor: { value: new THREE.Color(props.noiseColor) },
      uFlowIntensity: { value: safeFlowIntensity.value },
      uNoiseScale: { value: safeNoiseScale.value },
      uNoiseSpeed: { value: safeNoiseSpeed.value },
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uWarpStrength: { value: safeWarpStrength.value },
    },
    vertexShader: baseVertexShader,
  })
}

const glowMaterial = createGlowMaterial()
const fresnelMaterial = createFresnelMaterial()
const noiseMaterial = createNoiseMaterial()

const particlesMaterial = new THREE.MeshBasicMaterial({
  blending: THREE.AdditiveBlending,
  color: new THREE.Color(props.particleColor).multiplyScalar(safeParticleEmission.value),
  depthWrite: false,
  toneMapped: false,
  transparent: true,
})

const particles = Array.from({ length: MAX_PARTICLES }, (): Particle => ({
  active: false,
  life: 0,
  maxLife: 0,
  phase: 0,
  pos: new THREE.Vector3(),
}))

const dummy = new THREE.Object3D()
const toCenter = new THREE.Vector3()
const spawnDirection = new THREE.Vector3()
const particleDirection = new THREE.Vector3()
const particleQuaternion = new THREE.Quaternion()
const upVector = new THREE.Vector3(0, 1, 0)

let previousProgress = 0

const createRootGroup = () => {
  const nextGlowMesh = new THREE.Mesh(sphereGeometry, glowMaterial)
  nextGlowMesh.renderOrder = 10
  nextGlowMesh.visible = false
  nextGlowMesh.frustumCulled = false

  const nextFresnelMesh = new THREE.Mesh(sphereGeometry, fresnelMaterial)
  nextFresnelMesh.renderOrder = 11
  nextFresnelMesh.visible = false
  nextFresnelMesh.frustumCulled = false

  const nextNoiseMesh = new THREE.Mesh(sphereGeometry, noiseMaterial)
  nextNoiseMesh.renderOrder = 12
  nextNoiseMesh.visible = false
  nextNoiseMesh.frustumCulled = false

  const nextParticleMesh = new THREE.InstancedMesh(capsuleGeometry, particlesMaterial, MAX_PARTICLES)
  nextParticleMesh.renderOrder = 9
  nextParticleMesh.frustumCulled = false
  nextParticleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

  dummy.scale.setScalar(0)
  dummy.updateMatrix()
  for (let index = 0; index < MAX_PARTICLES; index += 1) {
    nextParticleMesh.setMatrixAt(index, dummy.matrix)
  }
  nextParticleMesh.instanceMatrix.needsUpdate = true

  const group = new THREE.Group()
  group.add(nextParticleMesh)
  group.add(nextGlowMesh)
  group.add(nextFresnelMesh)
  group.add(nextNoiseMesh)

  glowMesh.value = nextGlowMesh
  fresnelMesh.value = nextFresnelMesh
  noiseMesh.value = nextNoiseMesh
  particleMesh.value = nextParticleMesh
  rootGroup.value = group
}

const syncMaterialUniforms = () => {
  setMaterialColor(glowMaterial.uniforms.uColorInner, props.glowColorInner, '#cb5151')
  setMaterialColor(glowMaterial.uniforms.uColorOuter, props.glowColorOuter, '#000000')
  glowMaterial.uniforms.uEmission.value = safeGlowEmission.value
  glowMaterial.uniforms.uFalloffPower.value = safeGlowFalloffPower.value
  glowMaterial.uniforms.uEdgeSoftness.value = safeGlowEdgeSoftness.value

  setMaterialColor(fresnelMaterial.uniforms.uCoreColor, props.orbCoreColor, '#eaf8fc')
  setMaterialColor(fresnelMaterial.uniforms.uRimColor, props.orbRimColor, '#0c61f5')
  fresnelMaterial.uniforms.uEmission.value = safeFresnelEmission.value
  fresnelMaterial.uniforms.uFresnelPower.value = safeFresnelPower.value
  fresnelMaterial.uniforms.uBodyFalloff.value = safeBodyFalloff.value
  fresnelMaterial.uniforms.uCoreFalloff.value = safeCoreFalloff.value
  fresnelMaterial.uniforms.uCoreBoost.value = safeCoreBoost.value

  setMaterialColor(noiseMaterial.uniforms.uColor, props.noiseColor, '#128bff')
  noiseMaterial.uniforms.uNoiseScale.value = safeNoiseScale.value
  noiseMaterial.uniforms.uNoiseSpeed.value = safeNoiseSpeed.value
  noiseMaterial.uniforms.uFlowIntensity.value = safeFlowIntensity.value
  noiseMaterial.uniforms.uWarpStrength.value = safeWarpStrength.value

  particlesMaterial.color.set(props.particleColor ?? '#59afff').multiplyScalar(safeParticleEmission.value)
}

const getProgress = (elapsed: number) => {
  if (!props.autoAnimate) {
    return safeChargeProgress.value
  }

  const duration = safeCycleDuration.value
  const phase = (elapsed % duration) / duration

  if (phase < 0.8) {
    return THREE.MathUtils.smootherstep(phase / 0.8, 0, 1)
  }

  return 1 - THREE.MathUtils.smootherstep((phase - 0.8) / 0.2, 0, 1)
}

const fastFadeParticles = () => {
  for (let index = 0; index < MAX_PARTICLES; index += 1) {
    const particle = particles[index]
    if (particle.active) {
      particle.life = Math.max(particle.life, particle.maxLife - 0.08)
    }
  }
}

createRootGroup()

watch(
  [
    () => props.glowColorInner,
    () => props.glowColorOuter,
    () => props.noiseColor,
    () => props.orbCoreColor,
    () => props.orbRimColor,
    () => props.particleColor,
    safeBodyFalloff,
    safeCoreBoost,
    safeCoreFalloff,
    safeFlowIntensity,
    safeFresnelEmission,
    safeFresnelPower,
    safeGlowEdgeSoftness,
    safeGlowEmission,
    safeGlowFalloffPower,
    safeNoiseScale,
    safeNoiseSpeed,
    safeParticleEmission,
    safeWarpStrength,
  ],
  syncMaterialUniforms,
  { immediate: true },
)

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta, elapsed }) => {
  if (!glowMesh.value || !fresnelMesh.value || !noiseMesh.value || !particleMesh.value) {
    return
  }

  const progress = getProgress(elapsed)
  const pulse = progress > 0.001 ? 1 + Math.sin(elapsed * 10) * 0.06 * progress : 0
  const orbScale = progress * safeOrbMaxSize.value * pulse
  const visible = orbScale > 0.001

  if (progress < 0.02 && previousProgress > 0.35) {
    fastFadeParticles()
  }
  previousProgress = progress

  glowMaterial.uniforms.uProgress.value = progress
  fresnelMaterial.uniforms.uProgress.value = progress
  noiseMaterial.uniforms.uProgress.value = progress
  noiseMaterial.uniforms.uTime.value = elapsed

  glowMesh.value.visible = visible && props.glowEnabled
  glowMesh.value.scale.setScalar(Math.max(0, orbScale * safeGlowSizeMult.value))

  fresnelMesh.value.visible = visible
  fresnelMesh.value.scale.setScalar(Math.max(0, orbScale))

  noiseMesh.value.visible = visible
  noiseMesh.value.scale.setScalar(Math.max(0, orbScale))

  if (progress > 0.001) {
    let activeCount = 0
    for (let index = 0; index < MAX_PARTICLES; index += 1) {
      if (particles[index].active) {
        activeCount += 1
      }
    }

    const targetCount = Math.floor(progress * safeParticleCount.value)
    for (let index = 0; index < MAX_PARTICLES && activeCount < targetCount; index += 1) {
      const particle = particles[index]
      if (particle.active) {
        continue
      }

      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      spawnDirection.set(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
      )

      particle.pos.copy(spawnDirection).multiplyScalar(safeParticleSpawnRadius.value * (0.8 + Math.random() * 0.2))
      particle.maxLife = safeParticleLifetime.value * (0.6 + Math.random() * 0.4)
      particle.life = 0
      particle.phase = Math.random() * Math.PI * 2
      particle.active = true
      activeCount += 1
    }
  }

  for (let index = 0; index < MAX_PARTICLES; index += 1) {
    const particle = particles[index]

    if (!particle.active) {
      dummy.scale.setScalar(0)
      dummy.updateMatrix()
      particleMesh.value.setMatrixAt(index, dummy.matrix)
      continue
    }

    particle.life += delta

    if (particle.life >= particle.maxLife) {
      particle.active = false
      dummy.scale.setScalar(0)
      dummy.updateMatrix()
      particleMesh.value.setMatrixAt(index, dummy.matrix)
      continue
    }

    toCenter.copy(particle.pos).multiplyScalar(-1)
    const distance = toCenter.length()

    if (distance < 0.04) {
      particle.active = false
      dummy.scale.setScalar(0)
      dummy.updateMatrix()
      particleMesh.value.setMatrixAt(index, dummy.matrix)
      continue
    }

    const pullFactor = Math.max(0, 1 - distance / safeParticleSpawnRadius.value) ** 2
    const pull = safeParticleSpeed.value * (1 + pullFactor * 4)
    toCenter.multiplyScalar((pull * delta) / distance)
    particle.pos.add(toCenter)

    if (safeParticleTurbulence.value > 0) {
      const lifeWave = particle.life * 6
      const turbulence = safeParticleTurbulence.value * delta * (distance / safeParticleSpawnRadius.value)
      particle.pos.x += Math.sin(lifeWave * 1.3 + particle.phase) * turbulence
      particle.pos.y += Math.sin(lifeWave * 0.9 + particle.phase + 1.1) * turbulence
      particle.pos.z += Math.sin(lifeWave * 1.7 + particle.phase + 2.5) * turbulence
    }

    const timeProgress = particle.life / particle.maxLife
    const fade = timeProgress < 0.25 ? timeProgress / 0.25 : 1 - (timeProgress - 0.25) / 0.75

    particleDirection.copy(particle.pos).multiplyScalar(-1).normalize()
    particleQuaternion.setFromUnitVectors(upVector, particleDirection)

    dummy.position.copy(particle.pos)
    dummy.quaternion.copy(particleQuaternion)
    dummy.scale.set(
      safeParticleWidth.value * Math.max(0, fade),
      safeParticleLength.value * Math.max(0, fade),
      safeParticleWidth.value * Math.max(0, fade),
    )
    dummy.updateMatrix()
    particleMesh.value.setMatrixAt(index, dummy.matrix)
  }

  particleMesh.value.instanceMatrix.needsUpdate = true
})

onBeforeUnmount(() => {
  rootGroup.value?.removeFromParent()
  rootGroup.value = null
  glowMesh.value = null
  fresnelMesh.value = null
  noiseMesh.value = null
  particleMesh.value = null
  sphereGeometry.dispose()
  capsuleGeometry.dispose()
  glowMaterial.dispose()
  fresnelMaterial.dispose()
  noiseMaterial.dispose()
  particlesMaterial.dispose()
})
</script>

<template>
  <primitive
    v-if="rootGroup"
    :object="rootGroup"
  />
</template>
