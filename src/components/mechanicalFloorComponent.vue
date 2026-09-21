<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { getResUrl } from '../common/utils'
import { MECHANICAL_FLOOR_DEFAULTS } from './mechanicalFloorComponent/defaults'
import type { FloorOptions } from './mechanicalFloorComponent/defaults'
import { createFloorRuntime, disposeSource } from './mechanicalFloorComponent/runtime'

const props = withDefaults(defineProps<Partial<FloorOptions>>(), MECHANICAL_FLOOR_DEFAULTS)
const emit = defineEmits<{ loadError: [error: unknown] }>()
const runtime = shallowRef<ReturnType<typeof createFloorRuntime> | null>(null)
let disposed = false

onMounted(async () => {
  try {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const gltf = await loader.loadAsync(getResUrl('model/floor.glb'))
    if (disposed) {
      disposeSource(gltf.scene)
      return
    }
    try {
      runtime.value = createFloorRuntime(gltf.scene)
    }
    catch (error) {
      disposeSource(gltf.scene)
      throw error
    }
    runtime.value.setLayout(props.repeatWidth, props.repeatLength)
    runtime.value.setMaterial(props)
  }
  catch (error) {
    if (!disposed) {
      console.error('[mechanicalFloorComponent] Failed to load floor.glb', error)
      emit('loadError', error)
    }
  }
})

watch(() => [props.repeatWidth, props.repeatLength], () => {
  runtime.value?.setLayout(props.repeatWidth, props.repeatLength)
})
watch(() => [props.color, props.reflectivity, props.roughness, props.metalness, props.ior, props.envMapIntensity], () => {
  runtime.value?.setMaterial(props)
})
onBeforeUnmount(() => {
  disposed = true
  runtime.value?.dispose()
  runtime.value = null
})
</script>

<template>
  <TresGroup>
    <primitive v-if="runtime" :object="runtime.group" :dispose="null" />
  </TresGroup>
</template>
