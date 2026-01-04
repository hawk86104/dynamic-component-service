<!--
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-29 16:50:24
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2026-01-04 09:58:08
-->
<script setup lang="ts">
import { defineAsyncComponent, reactive } from 'vue'
import { createConfigPane } from './createConfigPane'

const props = defineProps<{
  componentConfig: any
}>()

const modules = import.meta.glob('/src/components/**/*.vue')
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
const pane = createConfigPane(document.getElementById('pane')!, props.componentConfig.config, attrsData)

const defaultState = reactive({
  showGrid: true,
  showAxes: true,
})
pane.addBinding(defaultState, 'showGrid', { label: '显示网格' })
pane.addBinding(defaultState, 'showAxes', { label: '显示轴' })
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
  <TresGridHelper v-if="defaultState.showGrid" :position-y="0.1" />
  <TresAxesHelper v-if="defaultState.showAxes" />
</template>
