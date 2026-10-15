<script setup lang="ts">
import { useTres } from '@tresjs/core'
import { Html } from '@tresjs/cientos'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getResUrl } from '../../common/utils'
import { createIsoGlowController } from './controller'
import type { ModelErrorEvent, ModelLoadedEvent, ModelLoadingEvent } from './controller'
import { ISO_GLOW_DEFAULTS } from './defaults'
import type { IsoGlowPreset } from './defaults'
import { loadIsoGlowGLTF } from './modelLoader'

const props = defineProps({
  modelUrl: { type: String, required: true },
  enabled: { type: Boolean, default: ISO_GLOW_DEFAULTS.enabled },
  stylePreset: { type: String, default: ISO_GLOW_DEFAULTS.stylePreset },
  surfaceColor: { type: String, default: ISO_GLOW_DEFAULTS.surfaceColor },
  surfaceOpacity: { type: Number, default: ISO_GLOW_DEFAULTS.surfaceOpacity },
  showEdges: { type: Boolean, default: ISO_GLOW_DEFAULTS.showEdges },
  edgeColor: { type: String, default: ISO_GLOW_DEFAULTS.edgeColor },
  edgeOpacity: { type: Number, default: ISO_GLOW_DEFAULTS.edgeOpacity },
  edgeThreshold: { type: Number, default: ISO_GLOW_DEFAULTS.edgeThreshold },
  emissiveColor: { type: String, default: ISO_GLOW_DEFAULTS.emissiveColor },
  emissiveIntensity: { type: Number, default: ISO_GLOW_DEFAULTS.emissiveIntensity },
})

const emit = defineEmits<{
  loading: [event: ModelLoadingEvent]
  loaded: [event: ModelLoadedEvent]
  loadError: [event: ModelErrorEvent]
}>()

const { invalidate } = useTres()
const loadError = ref('')
const currentStyle = () => ({ ...props, stylePreset: props.stylePreset as IsoGlowPreset })
const controller = createIsoGlowController({
  load: (url, signal) => loadIsoGlowGLTF(url, signal, getResUrl('draco/gltf/'), document.baseURI),
  invalidate,
  onLoading: (event) => {
    loadError.value = ''
    emit('loading', event)
  },
  onLoaded: event => emit('loaded', event),
  onError: (event) => {
    loadError.value = [event.message, ...event.resourceUrls].join('\n')
    emit('loadError', event)
  },
}, currentStyle())
let mounted = false

onMounted(() => {
  mounted = true
  void controller.setModelUrl(props.modelUrl)
})

watch(() => props.modelUrl, (url) => {
  if (mounted) { void controller.setModelUrl(url) }
})

watch(currentStyle, style => controller.update(style))
onBeforeUnmount(() => {
  mounted = false
  controller.dispose()
})

defineExpose({ getObject3D: () => controller.group })
</script>

<template>
  <TresGroup>
    <primitive :object="controller.group" :dispose="null" />
    <Html v-if="loadError" :calculate-position="() => [16, 16]" :z-index-range="[10, 10]">
      <div class="isoglow-load-error" role="alert">{{ loadError }}</div>
    </Html>
  </TresGroup>
</template>

<style scoped>
.isoglow-load-error {
  box-sizing: border-box;
  width: min(380px, calc(100vw - 32px));
  max-height: min(240px, calc(100vh - 32px));
  padding: 10px 12px;
  overflow: auto;
  border: 1px solid #a35145;
  border-radius: 6px;
  background: #24191bef;
  color: #ffb2a8;
  font: 12px/1.6 sans-serif;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
</style>
