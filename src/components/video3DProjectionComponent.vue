<script setup lang="ts">
import { useLoop, useTres } from '@tresjs/core'
import { WebGLRenderer } from 'three'
import type { Object3D } from 'three/src/core/Object3D.js'
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { VIDEO_3D_DEFAULTS } from './video3DProjectionComponent/defaults'
import type { Video3DProjectionOptions } from './video3DProjectionComponent/defaults'
import { createProjectionDemo } from './video3DProjectionComponent/demoReceivers'
import { createVideoProjector } from './video3DProjectionComponent/projector'
import { createProjectionVideoSource } from './video3DProjectionComponent/videoSource'
import type { VideoReadyEvent } from './video3DProjectionComponent/videoSource'

const props = withDefaults(defineProps<Partial<Video3DProjectionOptions>>(), VIDEO_3D_DEFAULTS)
const emit = defineEmits<{
  ready: [event: VideoReadyEvent]
  error: [error: Error]
}>()
const { scene, invalidate } = useTres()
const currentOptions = (): Video3DProjectionOptions => ({ ...props })
const projector = createVideoProjector(currentOptions())
const videoSource = createProjectionVideoSource({
  onTexture: texture => projector.setTexture(texture),
  onReady: event => emit('ready', event),
  onError: (error) => {
    emit('error', error)
    console.warn('[video3DProjectionComponent]', error.message)
  },
  invalidate,
})
let mounted = false
let demo: ReturnType<typeof createProjectionDemo> | null = null

function syncDemo(show: boolean) {
  if (show && !demo) {
    demo = createProjectionDemo(scene.value)
  }
  else if (!show && demo) { demo.dispose(); demo = null }
}

syncDemo(props.showDemoReceivers)
videoSource.configure(props)
watch(currentOptions, (options) => {
  projector.configure(options)
  videoSource.configure(options)
  syncDemo(options.showDemoReceivers)
  invalidate()
})
watch(() => props.videoUrl, (url) => {
  if (mounted) { videoSource.setSource(url) }
})

const { onBeforeRender } = useLoop()
const { off } = onBeforeRender(({ renderer, scene, camera }) => {
  if (renderer instanceof WebGLRenderer) {
    projector.update(renderer, scene.value, videoSource.isReady(), camera.value)
    // Also keeps older browsers without requestVideoFrameCallback current in on-demand scenes.
    if (videoSource.isPlaying()) { invalidate() }
  }
})

onMounted(() => {
  mounted = true
  videoSource.setSource(props.videoUrl)
})
onBeforeUnmount(() => {
  mounted = false
  off()
  videoSource.dispose()
  demo?.dispose()
  demo = null
  projector.dispose()
})

function setTargets(targets: Object3D | Object3D[] | null) {
  projector.setTargets(targets)
  invalidate()
}

defineExpose({
  videoPlay: videoSource.play,
  videoPause: videoSource.pause,
  videoStop: videoSource.stop,
  setTargets,
  getTargets: projector.getTargets,
  getObject3D: () => projector.root,
  getProjectorCamera: () => projector.camera,
  getVideoElement: videoSource.getVideoElement,
})
</script>

<template>
  <primitive :object="projector.root" :dispose="null" />
</template>
