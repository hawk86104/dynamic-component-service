<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  computed,
  onBeforeUnmount,
  shallowRef,
  watch,
} from 'vue'
import projectileFragmentShader from '../shader/chargedBlastProjectileComponent/projectile.frag?raw'
import projectileVertexShader from '../shader/chargedBlastProjectileComponent/projectile.vert?raw'
import trailFragmentShader from '../shader/chargedBlastProjectileComponent/trail.frag?raw'
import trailVertexShader from '../shader/chargedBlastProjectileComponent/trail.vert?raw'

type ProjectileCustomMaterial = CustomShaderMaterial<typeof THREE.MeshBasicMaterial>

const props = withDefaults(
  defineProps<{
    autoPlay?: boolean
    fireDirectionX?: number
    fireDirectionY?: number
    fireDirectionZ?: number
    fireSpeed?: number
    loopInterval?: number
    maxDistance?: number
    projBandWidth?: number
    projColorA?: string
    projColorB?: string
    projColorC?: string
    projFresnelColor?: string
    projFresnelEmit?: number
    projFresnelPower?: number
    projGradientSpeed?: number
    projPulseScale?: number
    projPulseSpeed?: number
    projRadius?: number
    projTailLength?: number
    shotToken?: number
    trailColor?: string
    trailEdgeSoftness?: number
    trailLength?: number
    trailOpacity?: number
    trailSegments?: number
    trailWidth?: number
  }>(),
  {
    autoPlay: true,
    fireDirectionX: 0,
    fireDirectionY: 0,
    fireDirectionZ: -1,
    fireSpeed: 11,
    loopInterval: 1.6,
    maxDistance: 60,
    projBandWidth: 0.25,
    projColorA: '#0051dc',
    projColorB: '#e0ffff',
    projColorC: '#a9ffff',
    projFresnelColor: '#abe5ff',
    projFresnelEmit: 1.3,
    projFresnelPower: 2,
    projGradientSpeed: 1.9,
    projPulseScale: 1.2,
    projPulseSpeed: 16,
    projRadius: 0.5,
    projTailLength: 1.2,
    shotToken: 0,
    trailColor: '#32bef0',
    trailEdgeSoftness: 4.7,
    trailLength: 3.2,
    trailOpacity: 0.54,
    trailSegments: 20,
    trailWidth: 1.17,
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

const safeFireSpeed = computed(() => clampNumber(props.fireSpeed, 0.1, 60, 11))
const safeLoopInterval = computed(() => clampNumber(props.loopInterval, 0.2, 10, 1.6))
const safeMaxDistance = computed(() => clampNumber(props.maxDistance, 0.5, 120, 60))
const safeProjBandWidth = computed(() => clampNumber(props.projBandWidth, 0.05, 3, 0.25))
const safeProjFresnelEmit = computed(() => clampNumber(props.projFresnelEmit, 0, 5, 1.3))
const safeProjFresnelPower = computed(() => clampNumber(props.projFresnelPower, 0.1, 10, 2))
const safeProjGradientSpeed = computed(() => clampNumber(props.projGradientSpeed, 0, 10, 1.9))
const safeProjPulseScale = computed(() => clampNumber(props.projPulseScale, 1, 2, 1.2))
const safeProjPulseSpeed = computed(() => clampNumber(props.projPulseSpeed, 0.5, 20, 16))
const safeProjRadius = computed(() => clampNumber(props.projRadius, 0.01, 1, 0.5))
const safeProjTailLength = computed(() => clampNumber(props.projTailLength, 0.05, 3, 1.2))
const safeTrailEdgeSoftness = computed(() => clampNumber(props.trailEdgeSoftness, 0.1, 8, 4.7))
const safeTrailLength = computed(() => clampNumber(props.trailLength, 0.1, 10, 3.2))
const safeTrailOpacity = computed(() => clampNumber(props.trailOpacity, 0, 1, 0.54))
const safeTrailSegments = computed(() => Math.round(clampNumber(props.trailSegments, 3, 64, 20)))
const safeTrailWidth = computed(() => clampNumber(props.trailWidth, 0.01, 2, 1.17))
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
const projectileMesh = shallowRef<THREE.Mesh | null>(null)
const trailMesh = shallowRef<THREE.Mesh | null>(null)
const projectileGeometry = shallowRef<THREE.BufferGeometry | null>(null)
const trailGeometry = shallowRef<THREE.CylinderGeometry | null>(null)

const createProjectileMaterial = (): ProjectileCustomMaterial => {
  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshBasicMaterial,
    color: 0xFFFFFF,
    fragmentShader: projectileFragmentShader,
    silent: true,
    toneMapped: false,
    uniforms: {
      uBandWidth: { value: safeProjBandWidth.value },
      uColorA: { value: new THREE.Color(props.projColorA) },
      uColorB: { value: new THREE.Color(props.projColorB) },
      uColorC: { value: new THREE.Color(props.projColorC) },
      uFresnelColor: { value: new THREE.Color(props.projFresnelColor) },
      uFresnelEmission: { value: safeProjFresnelEmit.value },
      uFresnelPower: { value: safeProjFresnelPower.value },
      uGradientSpeed: { value: safeProjGradientSpeed.value },
      uTailY: { value: -safeProjTailLength.value },
      uTime: { value: 0 },
      uTipY: { value: safeProjRadius.value },
    },
    vertexShader: projectileVertexShader,
  })
}

const createTrailMaterial = (): ProjectileCustomMaterial => {
  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshBasicMaterial,
    color: 0xFFFFFF,
    depthWrite: false,
    fragmentShader: trailFragmentShader,
    side: THREE.DoubleSide,
    silent: true,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uColor: { value: new THREE.Color(props.trailColor) },
      uEdgeSoftness: { value: safeTrailEdgeSoftness.value },
      uOpacity: { value: safeTrailOpacity.value },
    },
    vertexShader: trailVertexShader,
  })
}

const projectileMaterial = createProjectileMaterial()
const trailMaterial = createTrailMaterial()

const upAxis = new THREE.Vector3(0, 1, 0)
const orientation = new THREE.Quaternion()

let activeShot = false
let replayTimer = 0
let traveledDistance = 0
let previousShotToken = props.shotToken

const createProjectileGeometry = (radius: number, tailLength: number) => {
  const safeRadius = Math.max(0.001, radius)
  const safeTail = Math.max(0.001, tailLength)
  const sphere = new THREE.SphereGeometry(safeRadius, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)
  const cone = new THREE.CylinderGeometry(safeRadius, 0, safeTail, 12, 1)
  cone.translate(0, -safeTail / 2, 0)
  const merged = mergeGeometries([sphere, cone]) ?? new THREE.BufferGeometry()
  sphere.dispose()
  cone.dispose()
  return merged
}

const createTrailGeometry = (width: number, length: number, segments: number) => {
  const safeWidth = Math.max(0.001, width / 2)
  const safeLength = Math.max(0.001, length)
  const safeSegments = Math.max(3, Math.round(segments))
  const geometry = new THREE.CylinderGeometry(safeWidth, 0, safeLength, safeSegments, 16, true)
  geometry.translate(0, -safeLength / 2, 0)
  return geometry
}

const applyOrientation = () => {
  if (!rootGroup.value) {
    return
  }

  orientation.setFromUnitVectors(upAxis, safeDirection.value)
  rootGroup.value.quaternion.copy(orientation)
}

const deactivateShot = () => {
  activeShot = false
  replayTimer = 0
  traveledDistance = 0

  if (rootGroup.value) {
    rootGroup.value.visible = false
    rootGroup.value.position.set(0, 0, 0)
  }
}

const spawnShot = () => {
  if (!rootGroup.value) {
    return
  }

  activeShot = true
  replayTimer = 0
  traveledDistance = 0
  rootGroup.value.visible = true
  rootGroup.value.position.set(0, 0, 0)
  applyOrientation()
}

const triggerShotAction = () => {
  spawnShot()
}

const refreshProjectileGeometry = () => {
  const nextGeometry = createProjectileGeometry(safeProjRadius.value, safeProjTailLength.value)
  const previousGeometry = projectileGeometry.value
  projectileGeometry.value = nextGeometry

  if (projectileMesh.value) {
    projectileMesh.value.geometry = nextGeometry
  }

  previousGeometry?.dispose()
}

const refreshTrailGeometry = () => {
  const nextGeometry = createTrailGeometry(safeTrailWidth.value, safeTrailLength.value, safeTrailSegments.value)
  const previousGeometry = trailGeometry.value
  trailGeometry.value = nextGeometry

  if (trailMesh.value) {
    trailMesh.value.geometry = nextGeometry
  }

  previousGeometry?.dispose()
}

const syncProjectileUniforms = () => {
  setMaterialColor(projectileMaterial.uniforms.uColorA, props.projColorA, '#0051dc')
  setMaterialColor(projectileMaterial.uniforms.uColorB, props.projColorB, '#e0ffff')
  setMaterialColor(projectileMaterial.uniforms.uColorC, props.projColorC, '#a9ffff')
  setMaterialColor(projectileMaterial.uniforms.uFresnelColor, props.projFresnelColor, '#abe5ff')
  projectileMaterial.uniforms.uBandWidth.value = safeProjBandWidth.value
  projectileMaterial.uniforms.uGradientSpeed.value = safeProjGradientSpeed.value
  projectileMaterial.uniforms.uTipY.value = safeProjRadius.value
  projectileMaterial.uniforms.uTailY.value = -safeProjTailLength.value
  projectileMaterial.uniforms.uFresnelPower.value = safeProjFresnelPower.value
  projectileMaterial.uniforms.uFresnelEmission.value = safeProjFresnelEmit.value
}

const syncTrailUniforms = () => {
  setMaterialColor(trailMaterial.uniforms.uColor, props.trailColor, '#32bef0')
  trailMaterial.uniforms.uOpacity.value = safeTrailOpacity.value
  trailMaterial.uniforms.uEdgeSoftness.value = safeTrailEdgeSoftness.value
}

const createRootGroup = () => {
  projectileGeometry.value = createProjectileGeometry(safeProjRadius.value, safeProjTailLength.value)
  trailGeometry.value = createTrailGeometry(safeTrailWidth.value, safeTrailLength.value, safeTrailSegments.value)

  const nextProjectileMesh = new THREE.Mesh(projectileGeometry.value, projectileMaterial)
  nextProjectileMesh.frustumCulled = false

  const nextTrailMesh = new THREE.Mesh(trailGeometry.value, trailMaterial)
  nextTrailMesh.frustumCulled = false

  const group = new THREE.Group()
  group.visible = false
  group.add(nextProjectileMesh)
  group.add(nextTrailMesh)

  projectileMesh.value = nextProjectileMesh
  trailMesh.value = nextTrailMesh
  rootGroup.value = group

  if (props.autoPlay) {
    spawnShot()
  }
}

createRootGroup()

watch(
  [
    () => props.projColorA,
    () => props.projColorB,
    () => props.projColorC,
    () => props.projFresnelColor,
    safeProjBandWidth,
    safeProjFresnelEmit,
    safeProjFresnelPower,
    safeProjGradientSpeed,
    safeProjRadius,
    safeProjTailLength,
  ],
  syncProjectileUniforms,
  { immediate: true },
)

watch(
  [
    () => props.trailColor,
    safeTrailEdgeSoftness,
    safeTrailOpacity,
  ],
  syncTrailUniforms,
  { immediate: true },
)

watch([safeProjRadius, safeProjTailLength], refreshProjectileGeometry)
watch([safeTrailLength, safeTrailSegments, safeTrailWidth], refreshTrailGeometry)
watch(safeDirection, applyOrientation)

watch(
  () => props.autoPlay,
  (autoPlay) => {
    if (autoPlay) {
      spawnShot()
    }
    else {
      deactivateShot()
    }
  },
)

watch(
  () => props.shotToken,
  (nextToken) => {
    if (props.autoPlay || nextToken === previousShotToken) {
      previousShotToken = nextToken
      return
    }

    previousShotToken = nextToken
    spawnShot()
  },
)

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta, elapsed }) => {
  projectileMaterial.uniforms.uTime.value = elapsed

  if (!rootGroup.value || !projectileMesh.value) {
    return
  }

  if (!activeShot) {
    if (props.autoPlay) {
      replayTimer += delta
      if (replayTimer >= safeLoopInterval.value) {
        spawnShot()
      }
    }
    return
  }

  applyOrientation()

  const step = safeFireSpeed.value * delta
  traveledDistance += step
  rootGroup.value.position.addScaledVector(safeDirection.value, step)

  const pulse = 1 + (safeProjPulseScale.value - 1) * (Math.sin(elapsed * safeProjPulseSpeed.value) * 0.5 + 0.5)
  projectileMesh.value.scale.setScalar(pulse)

  if (traveledDistance >= safeMaxDistance.value) {
    deactivateShot()
  }
})

onBeforeUnmount(() => {
  rootGroup.value?.removeFromParent()
  rootGroup.value = null
  projectileMesh.value = null
  trailMesh.value = null
  projectileGeometry.value?.dispose()
  projectileGeometry.value = null
  trailGeometry.value?.dispose()
  trailGeometry.value = null
  projectileMaterial.dispose()
  trailMaterial.dispose()
})

defineExpose({
  triggerShotAction,
})
</script>

<template>
  <primitive
    v-if="rootGroup"
    :object="rootGroup"
  />
</template>
