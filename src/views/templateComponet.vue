<script setup lang="ts">
import { defineAsyncComponent, reactive } from 'vue'
import { createConfigPane } from './createConfigPane'

const props = defineProps<{
  componentConfig: any
}>()

const modules = import.meta.glob('/src/components/*.vue')
const foundKey = Object.keys(modules).find(
  (k: string) => `.${k}` === props.componentConfig?.comFile,
)
const loader = foundKey ? modules[foundKey] : null as any
const foundComponent = loader
  ? defineAsyncComponent({
      loader,
      suspensible: true,
    })
  : null
const attrsData = reactive(props.componentConfig?.default || {})
createConfigPane(document.getElementById('pane')!, props.componentConfig.config, attrsData)

let position = [0, 0, 0]
if (props.componentConfig?.defaultObject3D?.position) {
  position = [
    props.componentConfig.defaultObject3D.position.x,
    props.componentConfig.defaultObject3D.position.y,
    props.componentConfig.defaultObject3D.position.z,
  ]
}
let rotation = [0, 0, 0]
if (props.componentConfig?.defaultObject3D?.rotation) {
  rotation = [
    props.componentConfig.defaultObject3D.rotation.x,
    props.componentConfig.defaultObject3D.rotation.y,
    props.componentConfig.defaultObject3D.rotation.z,
  ]
}
let scale = [1, 1, 1]
if (props.componentConfig?.defaultObject3D?.scale) {
  scale = [
    props.componentConfig.defaultObject3D.scale.x,
    props.componentConfig.defaultObject3D.scale.y,
    props.componentConfig.defaultObject3D.scale.z,
  ]
}
</script>

<template>
  <Suspense>
    <component
      :is="foundComponent"
      v-if="foundComponent"
      :position="position"
      :rotation="rotation"
      :scale="scale"
      v-bind="attrsData"
    />
  </Suspense>
</template>
