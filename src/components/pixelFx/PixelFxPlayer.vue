<script setup lang="ts">
import { useLoop, useTres } from '@tresjs/core'
import * as THREE from 'three'
import { onBeforeUnmount, watch } from 'vue'
import { PIXEL_FX_DEFAULTS } from './defaults'
import type { PixelFxEffectId } from './effects'
import { loadPixelFxEffect } from './loader'
import { createPixelFxRuntime } from './runtime'
import type { PixelFxRuntime } from './runtime'
import type { PixelFxProps } from './types'

const props = withDefaults(defineProps<PixelFxProps & { effectId: PixelFxEffectId }>(), PIXEL_FX_DEFAULTS)
const root = new THREE.Group()
root.name = 'PixelFX'
const { camera } = useTres()
let runtime: PixelFxRuntime | null = null
let generation = 0

function syncAppearance(): void {
  runtime?.setAppearance(props.width, props.opacity, props.mirror)
}

function restart(): void {
  runtime?.restart()
}

watch(() => props.effectId, async (effectId) => {
  const request = ++generation
  runtime?.dispose()
  runtime = null
  try {
    const module = await loadPixelFxEffect(effectId)
    if (request !== generation) {
      return
    }
    runtime = createPixelFxRuntime(module, { palette: props.palette, seed: props.seed })
    root.add(runtime.object)
    runtime.setMode(props.renderMode)
    runtime.setResolutionScale(props.resolutionScale)
    syncAppearance()
  }
  catch (error) {
    if (request === generation) {
      console.error(`Could not load PixelFX ${effectId}`, error)
    }
  }
}, { immediate: true })

watch(() => props.renderMode, mode => runtime?.setMode(mode))
watch(() => props.resolutionScale, scale => runtime?.setResolutionScale(scale))
watch(() => [props.width, props.opacity, props.mirror], syncAppearance)
watch(() => [props.loop, props.palette, props.seed], () => {
  runtime?.restart({ palette: props.palette, seed: props.seed })
})

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  if (runtime && props.playing) {
    runtime.tick(delta, props.playbackRate, props.loop)
  }
  if (camera.value) {
    runtime?.faceCamera(camera.value)
  }
})

onBeforeUnmount(() => {
  ++generation
  runtime?.dispose()
  runtime = null
  root.clear()
})

defineExpose({ restart })
</script>

<template>
  <primitive :object="root" />
</template>
