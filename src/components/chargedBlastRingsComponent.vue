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
import ringFragmentShader from '../shader/chargedBlastRingsComponent/ring.frag?raw'
import ringVertexShader from '../shader/chargedBlastRingsComponent/ring.vert?raw'

type RingCustomMaterial = CustomShaderMaterial<typeof THREE.MeshBasicMaterial>

interface RingParticle {
  active: boolean
  life: number
  maxLife: number
  posY: number
}

const props = withDefaults(
  defineProps<{
    autoPlay?: boolean
    burstToken?: number
    carrierRadius?: number
    carrierTailLength?: number
    fireDirectionX?: number
    fireDirectionY?: number
    fireDirectionZ?: number
    fireSpeed?: number
    loopInterval?: number
    maxDistance?: number
    ringColorA?: string
    ringColorB?: string
    ringEmission?: number
    ringGradientAngle?: number
    ringInterval?: number
    ringLifetime?: number
    ringMaxCount?: number
    ringMaxRadius?: number
    ringPeakAt?: number
    ringSpeed?: number
    ringTubeRatio?: number
  }>(),
  {
    autoPlay: true,
    burstToken: 0,
    carrierRadius: 0.5,
    carrierTailLength: 1.2,
    fireDirectionX: 0,
    fireDirectionY: 0,
    fireDirectionZ: -1,
    fireSpeed: 11,
    loopInterval: 1.6,
    maxDistance: 60,
    ringColorA: '#a9ffff',
    ringColorB: '#03ffff',
    ringEmission: 4,
    ringGradientAngle: -30,
    ringInterval: 0.27,
    ringLifetime: 0.75,
    ringMaxCount: 2,
    ringMaxRadius: 0.6,
    ringPeakAt: 2.5,
    ringSpeed: 3.5,
    ringTubeRatio: 0.15,
  },
)

const DEG2RAD = Math.PI / 180
const MAX_RINGS = 16

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

const safeCarrierRadius = computed(() => clampNumber(props.carrierRadius, 0.01, 2, 0.5))
const safeCarrierTailLength = computed(() => clampNumber(props.carrierTailLength, 0.05, 4, 1.2))
const safeFireSpeed = computed(() => clampNumber(props.fireSpeed, 0.1, 60, 11))
const safeLoopInterval = computed(() => clampNumber(props.loopInterval, 0.2, 10, 1.6))
const safeMaxDistance = computed(() => clampNumber(props.maxDistance, 0.5, 120, 60))
const safeRingEmission = computed(() => clampNumber(props.ringEmission, 0, 20, 4))
const safeRingGradientAngle = computed(() => clampNumber(props.ringGradientAngle, -180, 180, -30))
const safeRingInterval = computed(() => clampNumber(props.ringInterval, 0.01, 2, 0.27))
const safeRingLifetime = computed(() => clampNumber(props.ringLifetime, 0.05, 3, 0.75))
const safeRingMaxCount = computed(() => Math.round(clampNumber(props.ringMaxCount, 1, MAX_RINGS, 2)))
const safeRingMaxRadius = computed(() => clampNumber(props.ringMaxRadius, 0.01, 2, 0.6))
const safeRingPeakAt = computed(() => clampNumber(props.ringPeakAt, 1, 8, 2.5))
const safeRingSpeed = computed(() => clampNumber(props.ringSpeed, 0.1, 15, 3.5))
const safeRingTubeRatio = computed(() => clampNumber(props.ringTubeRatio, 0.01, 0.3, 0.15))
const safeDirection = computed(() => {
  const direction = new THREE.Vector3(
    clampNumber(props.fireDirectionX, -1, 1, 0),
    clampNumber(props.fireDirectionY, -1, 1, 0),
    clampNumber(props.fireDirectionZ, -1, 1, -1),
  )

  if (direction.lengthSq() < 0.0001) {
    direction.set(0, 0, -1)
  }

  return direction.normalize()
})

const rootGroup = shallowRef<THREE.Group | null>(null)
const instancedMesh = shallowRef<THREE.InstancedMesh | null>(null)
const ringGeometry = shallowRef<THREE.TorusGeometry | null>(null)

const createRingMaterial = (): RingCustomMaterial => {
  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshBasicMaterial,
    blending: THREE.AdditiveBlending,
    color: 0xFFFFFF,
    depthWrite: false,
    fragmentShader: ringFragmentShader,
    silent: true,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uColorA: { value: new THREE.Color(props.ringColorA) },
      uColorB: { value: new THREE.Color(props.ringColorB) },
      uEmission: { value: safeRingEmission.value },
      uGradientAngle: { value: safeRingGradientAngle.value * DEG2RAD },
      uTubeRadius: { value: safeRingTubeRatio.value },
    },
    vertexShader: ringVertexShader,
  })
}

const ringMaterial = createRingMaterial()

const rings = Array.from({ length: MAX_RINGS }, (): RingParticle => ({
  active: false,
  life: 0,
  maxLife: 0,
  posY: 0,
}))

const dummy = new THREE.Object3D()
const upAxis = new THREE.Vector3(0, 1, 0)
const orientation = new THREE.Quaternion()

let activeBurst = false
let ringSpawnTimer = safeRingInterval.value
let replayTimer = 0
let traveledDistance = 0
let previousBurstToken = props.burstToken

const createRingGeometry = (tubeRatio: number) => {
  const geometry = new THREE.TorusGeometry(1, Math.max(0.01, tubeRatio), 8, 48)
  geometry.rotateX(Math.PI / 2)
  return geometry
}

const resetInstances = () => {
  if (!instancedMesh.value) {
    return
  }

  dummy.scale.setScalar(0)
  dummy.updateMatrix()

  for (let index = 0; index < MAX_RINGS; index += 1) {
    rings[index].active = false
    rings[index].life = 0
    rings[index].maxLife = 0
    rings[index].posY = 0
    instancedMesh.value.setMatrixAt(index, dummy.matrix)
  }

  instancedMesh.value.instanceMatrix.needsUpdate = true
}

const applyOrientation = () => {
  if (!rootGroup.value) {
    return
  }

  orientation.setFromUnitVectors(upAxis, safeDirection.value)
  rootGroup.value.quaternion.copy(orientation)
}

const deactivateBurst = () => {
  activeBurst = false
  replayTimer = 0
  traveledDistance = 0
  ringSpawnTimer = safeRingInterval.value
  resetInstances()

  if (rootGroup.value) {
    rootGroup.value.visible = false
    rootGroup.value.position.set(0, 0, 0)
  }
}

const spawnBurst = () => {
  if (!rootGroup.value) {
    return
  }

  activeBurst = true
  replayTimer = 0
  traveledDistance = 0
  ringSpawnTimer = safeRingInterval.value
  resetInstances()
  rootGroup.value.visible = true
  rootGroup.value.position.set(0, 0, 0)
  applyOrientation()
}

const createRootGroup = () => {
  ringGeometry.value = createRingGeometry(safeRingTubeRatio.value)

  const mesh = new THREE.InstancedMesh(ringGeometry.value, ringMaterial, MAX_RINGS)
  mesh.frustumCulled = false
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

  const group = new THREE.Group()
  group.visible = false
  group.add(mesh)

  instancedMesh.value = mesh
  rootGroup.value = group
  resetInstances()

  if (props.autoPlay) {
    spawnBurst()
  }
}

const syncMaterialUniforms = () => {
  setMaterialColor(ringMaterial.uniforms.uColorA, props.ringColorA, '#a9ffff')
  setMaterialColor(ringMaterial.uniforms.uColorB, props.ringColorB, '#03ffff')
  ringMaterial.uniforms.uEmission.value = safeRingEmission.value
  ringMaterial.uniforms.uGradientAngle.value = safeRingGradientAngle.value * DEG2RAD
  ringMaterial.uniforms.uTubeRadius.value = safeRingTubeRatio.value
}

const refreshGeometry = () => {
  const nextGeometry = createRingGeometry(safeRingTubeRatio.value)
  const previousGeometry = ringGeometry.value

  ringGeometry.value = nextGeometry
  if (instancedMesh.value) {
    instancedMesh.value.geometry = nextGeometry
  }

  previousGeometry?.dispose()
}

createRootGroup()

watch(
  [
    () => props.ringColorA,
    () => props.ringColorB,
    safeRingEmission,
    safeRingGradientAngle,
    safeRingTubeRatio,
  ],
  syncMaterialUniforms,
  { immediate: true },
)

watch(safeRingTubeRatio, refreshGeometry)

watch(
  () => props.autoPlay,
  (autoPlay) => {
    if (autoPlay) {
      spawnBurst()
    }
    else {
      deactivateBurst()
    }
  },
)

watch(
  () => props.burstToken,
  (nextToken) => {
    if (props.autoPlay || nextToken === previousBurstToken) {
      previousBurstToken = nextToken
      return
    }

    previousBurstToken = nextToken
    spawnBurst()
  },
)

watch(safeDirection, applyOrientation)

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta }) => {
  if (!rootGroup.value || !instancedMesh.value) {
    return
  }

  if (!activeBurst) {
    if (props.autoPlay) {
      replayTimer += delta
      if (replayTimer >= safeLoopInterval.value) {
        spawnBurst()
      }
    }
    return
  }

  applyOrientation()

  const step = safeFireSpeed.value * delta
  traveledDistance += step
  rootGroup.value.position.addScaledVector(safeDirection.value, step)

  if (traveledDistance >= safeMaxDistance.value) {
    deactivateBurst()
    return
  }

  ringSpawnTimer += delta
  if (ringSpawnTimer >= safeRingInterval.value) {
    ringSpawnTimer -= safeRingInterval.value
    const maxCount = Math.min(Math.max(1, safeRingMaxCount.value), MAX_RINGS)
    for (let index = 0; index < maxCount; index += 1) {
      if (!rings[index].active) {
        rings[index].active = true
        rings[index].life = 0
        rings[index].maxLife = safeRingLifetime.value
        rings[index].posY = safeCarrierRadius.value
        break
      }
    }
  }

  for (let index = 0; index < MAX_RINGS; index += 1) {
    const ring = rings[index]

    if (!ring.active) {
      dummy.scale.setScalar(0)
      dummy.updateMatrix()
      instancedMesh.value.setMatrixAt(index, dummy.matrix)
      continue
    }

    ring.life += delta
    ring.posY -= safeRingSpeed.value * delta

    if (ring.life >= ring.maxLife || ring.posY < -safeCarrierTailLength.value) {
      ring.active = false
      dummy.scale.setScalar(0)
      dummy.updateMatrix()
      instancedMesh.value.setMatrixAt(index, dummy.matrix)
      continue
    }

    const progress = ring.life / ring.maxLife
    const skewedProgress = 1 - (1 - progress) ** safeRingPeakAt.value
    const scale = Math.sin(skewedProgress * Math.PI) * safeRingMaxRadius.value

    dummy.position.set(0, ring.posY, 0)
    dummy.rotation.set(0, 0, 0)
    dummy.scale.setScalar(Math.max(0, scale))
    dummy.updateMatrix()
    instancedMesh.value.setMatrixAt(index, dummy.matrix)
  }

  instancedMesh.value.instanceMatrix.needsUpdate = true
})

onBeforeUnmount(() => {
  rootGroup.value?.removeFromParent()
  rootGroup.value = null
  instancedMesh.value = null
  ringGeometry.value?.dispose()
  ringGeometry.value = null
  ringMaterial.dispose()
})
</script>

<template>
  <primitive
    v-if="rootGroup"
    :object="rootGroup"
  />
</template>
