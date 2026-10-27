<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  src: string
  poster: string
  alt: string
}>()

const hovered = ref(false)
const ready = ref(false)
const failed = ref(false)
const state = computed(() => hovered.value && !failed.value ? (ready.value ? 'playing' : 'loading') : 'poster')

function stop() {
  hovered.value = false
  ready.value = false
}

function enter(event: PointerEvent) {
  if (event.pointerType === 'touch' || document.hidden) { return }
  ready.value = false
  hovered.value = true
}

function onLoad(event: Event) {
  const image = event.target as HTMLImageElement
  if (hovered.value && image.isConnected && image.getAttribute('src') === props.src) {
    ready.value = true
  }
}

function onError() {
  failed.value = true
  ready.value = false
}

function onVisibilityChange() {
  if (document.hidden) { stop() }
}

watch(() => [props.src, props.poster], () => {
  stop()
  failed.value = false
})

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('blur', stop)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('blur', stop)
})
</script>

<template>
  <div
    class="animated-preview"
    :data-preview-state="state"
    @pointerenter="enter"
    @pointerleave="stop"
    @pointercancel="stop"
  >
    <img
      class="preview-poster"
      :src="poster"
      :alt="alt"
      width="600"
      height="400"
      loading="lazy"
      decoding="async"
    />
    <img
      v-if="hovered && !failed"
      class="preview-animation"
      :class="{ 'is-ready': ready }"
      :src="src"
      alt=""
      aria-hidden="true"
      width="600"
      height="400"
      decoding="async"
      @load="onLoad"
      @error="onError"
    />
  </div>
</template>

<style scoped>
.animated-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.animated-preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.preview-animation {
  position: absolute;
  inset: 0;
  opacity: 0;
}

.preview-animation.is-ready {
  opacity: 1;
}
</style>
