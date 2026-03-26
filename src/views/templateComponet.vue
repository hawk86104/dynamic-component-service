<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, reactive, ref } from 'vue'
import { type ConfigPaneActionContext, createConfigPane } from './createConfigPane'

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
const componentRef = ref<any>(null)
let pane: any
const defaultState = reactive({
  showGrid: true,
  showAxes: true,
})

function getComponentApi() {
  const instance = componentRef.value as any
  return instance?.$?.exposed ?? instance
}

function patchAttrsData(result: unknown) {
  if (!result || typeof result !== 'object') {
    return
  }

  Object.entries(result as Record<string, unknown>).forEach(([key, value]) => {
    if (Object.prototype.hasOwnProperty.call(attrsData, key)) {
      attrsData[key] = value
    }
  })

  pane.refresh()
}

async function handleConfigAction({ actionId }: ConfigPaneActionContext) {
  const action = getComponentApi()?.[actionId]

  if (typeof action !== 'function') {
    console.warn(`Action "${actionId}" is not exposed by the current component.`)
    return
  }

  patchAttrsData(await action())
}

pane = createConfigPane(
  props.componentConfig?.config || {},
  attrsData,
  undefined,
  {
    onAction: handleConfigAction,
  },
)

pane.addBinding(defaultState, 'showGrid', { label: '显示网格' })
pane.addBinding(defaultState, 'showAxes', { label: '显示轴' })

onBeforeUnmount(() => {
  pane.dispose()
})

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
      ref="componentRef"
      :position="position"
      :rotation="rotation"
      :scale="scale"
      v-bind="attrsData"
    />
  </Suspense>
  <TresGridHelper v-if="defaultState.showGrid" :position-y="0.1" />
  <TresAxesHelper v-if="defaultState.showAxes" />
</template>
