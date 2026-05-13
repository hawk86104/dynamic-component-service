<script setup lang="ts">
// 模型生三维粒子器组件
// 通过 URL 加载 GLB 模型（支持 DRACO 压缩），对其网格表面采样，生成随风流动的粒子拖尾
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'
import { onBeforeUnmount, shallowRef, watch } from 'vue'
import { loadGLTFFromUrl } from './modelLoader'
import {
  applyModelOpacity,
  buildParticleCloud,
  collectSamplingMeshes,
  createParticleUniforms,
  disposeBuiltCloud,
  disposeLoadedScene,
  disposeSamplingMeshes,
  type BuiltCloud,
  type ParticleUniforms,
} from './particleCloud'
import {
  clampNumber,
  computeWindDirection,
  resolveColorScheme,
} from './utils'

const props = withDefaults(
  defineProps<{
    modelUrl?: string
    modelUrlDraft?: string
    outlineDensity?: number
    particleSpeed?: number
    trailLength?: number
    windAzimuth?: number
    windElevation?: number
    particleDensity?: number
    trailDensity?: number
    colorScheme?: string
    particleSize?: number
    particleSizeMultiplier?: number
    opacity?: number
    turbulence?: number
    showModel?: boolean
    modelOpacity?: number
    offsetX?: number
    offsetY?: number
    offsetZ?: number
  }>(),
  {
    modelUrl: '',
    modelUrlDraft: '',
    outlineDensity: 0.55,
    particleSpeed: 1.4,
    trailLength: 2.5,
    windAzimuth: 60,
    windElevation: 20,
    particleDensity: 0.6,
    trailDensity: 0.6,
    colorScheme: 'fire',
    particleSize: 0.8,
    particleSizeMultiplier: 1,
    opacity: 0.9,
    turbulence: 1.1,
    showModel: true,
    modelOpacity: 1,
    offsetX: 0,
    offsetY: 0,
    offsetZ: 0,
  },
)

const rootGroup = shallowRef(new THREE.Group())
const modelGroup = shallowRef(new THREE.Group())
const particleGroup = shallowRef(new THREE.Group())
rootGroup.value.add(modelGroup.value)
rootGroup.value.add(particleGroup.value)

const loadedGltfScene = shallowRef<THREE.Object3D | null>(null)
const currentCloud = shallowRef<BuiltCloud | null>(null)
// 记录当前已加载的 url，避免 draft 重复提交触发重复加载
const loadedUrl = shallowRef<string>('')

const initialScheme = resolveColorScheme(props.colorScheme)
const initialWind = computeWindDirection(
  clampNumber(props.windAzimuth, -180, 180, 60),
  clampNumber(props.windElevation, -89, 89, 20),
)

const computeEffectiveParticleSize = () => {
  const base = clampNumber(props.particleSize, 0.1, 2, 0.8)
  const multiplier = clampNumber(props.particleSizeMultiplier, 0.05, 100, 1)
  return base * multiplier
}

const particleUniforms: ParticleUniforms = createParticleUniforms({
  windDir: initialWind,
  particleSpeed: clampNumber(props.particleSpeed, 0, 6, 1.4),
  trailLength: clampNumber(props.trailLength, 0.1, 20, 2.5),
  particleSize: computeEffectiveParticleSize(),
  turbulence: clampNumber(props.turbulence, 0, 4, 1.1),
  opacity: clampNumber(props.opacity, 0.05, 1, 0.9),
  colorA: initialScheme.colorA,
  colorB: initialScheme.colorB,
  colorC: initialScheme.colorC,
})

const disposeCurrentCloud = () => {
  disposeBuiltCloud(currentCloud.value)
  currentCloud.value = null
}

const rebuildCloud = () => {
  disposeCurrentCloud()
  if (!loadedGltfScene.value) return

  // 把顶点烘到 rootGroup 的 local 空间，这样渲染时 rootGroup.worldMatrix 只会
  // 被应用一次；否则在带缩放或被移动过的父级下会出现「双重变换」：粒子飞出视野
  // （GIS 下 scaleFactor=200 导致完全不可见）或与模型产生可见的位置偏移（移动
  // 物体后重建粒子）。
  const samplingMeshes = collectSamplingMeshes(
    loadedGltfScene.value,
    rootGroup.value as unknown as THREE.Object3D,
  )
  const cloud = buildParticleCloud(samplingMeshes, particleUniforms, {
    outlineDensity: clampNumber(props.outlineDensity, 0.05, 1, 0.55),
    particleDensity: clampNumber(props.particleDensity, 0.05, 1, 0.6),
    trailDensity: clampNumber(props.trailDensity, 0.05, 1, 0.6),
  })
  disposeSamplingMeshes(samplingMeshes)

  if (cloud) {
    particleGroup.value.add(cloud.points)
    currentCloud.value = cloud
  }
}

const applyParticleOffset = () => {
  particleGroup.value.position.set(
    clampNumber(props.offsetX, -100, 100, 0),
    clampNumber(props.offsetY, -100, 100, 0),
    clampNumber(props.offsetZ, -100, 100, 0),
  )
}

applyParticleOffset()

const mountLoadedScene = (scene: THREE.Object3D) => {
  disposeLoadedScene(loadedGltfScene.value)
  loadedGltfScene.value = scene
  modelGroup.value.add(scene)
  applyModelOpacity(
    scene,
    props.showModel ?? true,
    clampNumber(props.modelOpacity, 0, 1, 1),
  )
  rebuildCloud()
}

const loadFromUrl = async (url: string) => {
  const trimmed = (url ?? '').trim()
  if (!trimmed) return
  try {
    const gltf = await loadGLTFFromUrl(trimmed)
    mountLoadedScene(gltf.scene as unknown as THREE.Object3D)
    loadedUrl.value = trimmed
  }
  catch (err) {
    console.warn('[modelParticleGenerator] 加载 GLB 失败:', err)
  }
}

// 面板「确认生成」触发：以草稿 URL 为准，同步成正式 modelUrl 并加载
const applyModelUrlAction = () => {
  const url = (props.modelUrlDraft ?? props.modelUrl ?? '').trim()

  // 当新 url 与 props.modelUrl 相同时，返回值不会引起 prop 变化，watcher
  // 也就不会触发 —— 这覆盖了「同 URL 重新生成」和「清除后再次点确认生成」
  // 两种场景，都需要手动触发加载
  if (url && url === (props.modelUrl ?? '').trim()) {
    void loadFromUrl(url)
  }

  return {
    modelUrl: url,
    modelUrlDraft: url,
  }
}

const clearModel = () => {
  disposeCurrentCloud()
  disposeLoadedScene(loadedGltfScene.value)
  loadedGltfScene.value = null
  loadedUrl.value = ''
}

// 初始化按 modelUrl 加载
if (props.modelUrl) {
  void loadFromUrl(props.modelUrl)
}

watch(() => props.modelUrl, (url) => {
  const trimmed = (url ?? '').trim()
  if (trimmed && trimmed !== loadedUrl.value) {
    void loadFromUrl(trimmed)
  }
})

watch(
  () => [props.outlineDensity, props.particleDensity, props.trailDensity],
  () => rebuildCloud(),
)

watch(
  () => [props.windAzimuth, props.windElevation],
  ([az, el]) => {
    const dir = computeWindDirection(
      clampNumber(az as number, -180, 180, 60),
      clampNumber(el as number, -89, 89, 20),
    )
    particleUniforms.uWindDir.value.copy(dir)
  },
)

watch(() => props.particleSpeed, (value) => {
  particleUniforms.uParticleSpeed.value = clampNumber(value, 0, 6, 1.4)
})

watch(() => props.trailLength, (value) => {
  particleUniforms.uTrailLength.value = clampNumber(value, 0.1, 20, 2.5)
})

const syncEffectiveParticleSize = () => {
  const size = computeEffectiveParticleSize()
  particleUniforms.uParticleSize.value = size
  if (currentCloud.value) {
    ;(currentCloud.value.material as unknown as THREE.PointsMaterial).size = size
  }
}

watch(() => props.particleSize, () => syncEffectiveParticleSize())
watch(() => props.particleSizeMultiplier, () => syncEffectiveParticleSize())

watch(() => props.opacity, (value) => {
  particleUniforms.uOpacity.value = clampNumber(value, 0.05, 1, 0.9)
})

watch(() => props.turbulence, (value) => {
  particleUniforms.uTurbulence.value = clampNumber(value, 0, 4, 1.1)
})

watch(() => props.colorScheme, (value) => {
  const scheme = resolveColorScheme(value)
  particleUniforms.uColorA.value.copy(scheme.colorA)
  particleUniforms.uColorB.value.copy(scheme.colorB)
  particleUniforms.uColorC.value.copy(scheme.colorC)
})

watch(
  () => [props.showModel, props.modelOpacity],
  ([visible, opacity]) => {
    applyModelOpacity(
      loadedGltfScene.value,
      (visible as boolean) ?? true,
      clampNumber(opacity as number, 0, 1, 1),
    )
  },
)

watch(() => [props.offsetX, props.offsetY, props.offsetZ], () => applyParticleOffset())

const { onBeforeRender } = useLoop()
const tmpWorldScale = new THREE.Vector3()
onBeforeRender(({ elapsed }) => {
  particleUniforms.uTime.value = elapsed

  // 补偿父级 world scale（例如 gisPlaneEditor 里 scaleFactor=200 的父级）
  // 父级放大 N 倍会让相机空间 -mvZ 同比变大，shader 里的 perspective = 220/-mvZ
  // 随之变成 1/N，粒子 pointSize 退化成亚像素并被 fragment 里的 discard 丢掉。
  // 所以这里读取父级 world scale，在 shader 里反向乘回去。
  rootGroup.value.updateWorldMatrix(true, false)
  rootGroup.value.getWorldScale(tmpWorldScale)
  const worldScale = Math.max(tmpWorldScale.x, tmpWorldScale.y, tmpWorldScale.z)
  particleUniforms.uWorldScale.value = worldScale > 0 ? worldScale : 1
})

onBeforeUnmount(() => {
  disposeCurrentCloud()
  disposeLoadedScene(loadedGltfScene.value)
  loadedGltfScene.value = null
  rootGroup.value.removeFromParent()
})

defineExpose({ applyModelUrlAction, clearModel })
</script>

<template>
  <primitive
    v-if="rootGroup"
    :object="rootGroup"
  />
</template>
