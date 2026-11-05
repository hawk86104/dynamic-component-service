<script setup lang="ts">
import { useLoop, useTres } from '@tresjs/core'
import { Group } from 'three'
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { getResUrl } from '../common/utils'
import { DIVINE_FIRE_DEFAULTS, resolveDivineFireSettings } from './divineFireComponent/defaults'
import type { DivineFireProps } from './divineFireComponent/defaults'
import { loadFireModel } from './divineFireComponent/modelLoader'
import { disposeFireGLTF } from './divineFireComponent/resources'
import { createCubeSubject, createFireSubject } from './divineFireComponent/runtime'
import type { FireSubject } from './divineFireComponent/runtime'

const props = withDefaults(defineProps<DivineFireProps>(), DIVINE_FIRE_DEFAULTS)
const emit = defineEmits<{
  loading: [event: { modelUrl: string }]
  loaded: [event: { modelUrl: string, source: 'cube' | 'model' }]
  loadError: [event: { modelUrl: string, message: string }]
}>()
const settings = computed(() => resolveDivineFireSettings(props))
const { invalidate } = useTres()
const root = new Group()
root.name = 'DivineFire'
let subject = createFireSubject(createCubeSubject(), [], settings.value)
root.add(subject.group)

let disposed = false
let mounted = false
let requestId = 0
let pending: AbortController | null = null
let loadTimer: ReturnType<typeof setTimeout> | undefined
let activeUrl = ''
let loading = false
let loadError = ''
let animationTime = 0
let intensity = 0
let transition: { from: number, target: number, duration: number, elapsed: number } | null = null

function setBurning(burning: boolean, duration?: number) {
  const seconds = duration ?? (burning ? settings.value.leadIn : settings.value.leadOut)
  const safeDuration = Number.isFinite(seconds) ? Math.min(5, Math.max(0, seconds)) : 0
  if (safeDuration === 0) {
    intensity = burning ? 1 : 0
    transition = null
  }
  else {
    transition = { from: intensity, target: burning ? 1 : 0, duration: safeDuration, elapsed: 0 }
  }
  subject.tick(0, animationTime, intensity)
  invalidate()
  return { burning }
}

function replaceSubject(next: FireSubject, url: string) {
  const previous = subject
  subject = next
  activeUrl = url
  loadError = ''
  loading = false
  subject.tick(0, animationTime, intensity)
  root.add(subject.group)
  previous.dispose()
  invalidate()
  emit('loaded', { modelUrl: url, source: url ? 'model' : 'cube' })
}

async function loadRequestedModel(url: string, id: number) {
  const controller = new AbortController()
  pending = controller
  loading = true
  emit('loading', { modelUrl: url })
  try {
    const gltf = await loadFireModel(url, controller.signal, getResUrl('draco/gltf/'))
    if (disposed || controller.signal.aborted || id !== requestId) {
      disposeFireGLTF(gltf)
      return
    }
    let next: FireSubject
    try {
      next = createFireSubject(
        gltf.scene,
        gltf.animations,
        settings.value,
        () => disposeFireGLTF(gltf),
      )
    }
    catch (error) {
      disposeFireGLTF(gltf)
      throw error
    }
    replaceSubject(next, url)
  }
  catch (error) {
    if (disposed || controller.signal.aborted || id !== requestId) { return }
    loadError = error instanceof Error ? error.message : String(error)
    emit('loadError', { modelUrl: url, message: loadError })
    console.warn('[DivineFire] 模型替换失败，保留当前对象。', loadError)
  }
  finally {
    if (id === requestId) {
      pending = null
      loading = false
    }
  }
}

function queueModel(url: string, immediate = false) {
  const id = ++requestId
  pending?.abort()
  pending = null
  clearTimeout(loadTimer)
  loading = false
  loadError = ''
  if (!url) {
    if (activeUrl) {
      replaceSubject(createFireSubject(createCubeSubject(), [], settings.value), '')
    }
    return
  }
  if (url === activeUrl) { return }
  if (immediate) { void loadRequestedModel(url, id) }
  else { loadTimer = setTimeout(() => { void loadRequestedModel(url, id) }, 400) }
}

watch(settings, value => subject.update(value))
watch(() => settings.value.burning, value => setBurning(value))
watch(() => settings.value.modelUrl, (url) => {
  if (mounted) { queueModel(url) }
})

const { onBeforeRender } = useLoop()
const { off: stopLoop } = onBeforeRender(({ delta }) => {
  if (disposed) { return }
  const realDelta = Number.isFinite(delta) ? Math.min(0.1, Math.max(0, delta)) : 0
  if (transition) {
    transition.elapsed += realDelta
    const progress = Math.min(1, transition.elapsed / transition.duration)
    const eased = transition.target > transition.from ? 1 - (1 - progress) ** 3 : progress ** 3
    intensity = transition.from + (transition.target - transition.from) * eased
    if (progress === 1) { transition = null }
  }
  const motionDelta = settings.value.autoPlay ? realDelta * settings.value.animationSpeed : 0
  animationTime += motionDelta
  subject.tick(motionDelta, animationTime, intensity)
  if (motionDelta > 0 || transition) { invalidate() }
})

onMounted(() => {
  mounted = true
  setBurning(settings.value.burning)
  if (settings.value.modelUrl) { queueModel(settings.value.modelUrl, true) }
  else { emit('loaded', { modelUrl: '', source: 'cube' }) }
})

onBeforeUnmount(() => {
  disposed = true
  mounted = false
  requestId++
  clearTimeout(loadTimer)
  pending?.abort()
  stopLoop()
  subject.dispose()
  root.clear()
})

defineExpose({
  getObject3D: () => root,
  getModelStatus: () => ({ loading, modelUrl: activeUrl, requestedUrl: settings.value.modelUrl, error: loadError }),
  ignite: (duration?: number) => setBurning(true, duration),
  extinguish: (duration?: number) => setBurning(false, duration),
})
</script>

<template>
  <primitive :object="root" :dispose="null" />
</template>
