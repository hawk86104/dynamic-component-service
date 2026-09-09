<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, reactive, ref } from 'vue'
import { TransformControls } from '@tresjs/cientos'
import { type ConfigPaneActionContext, createConfigPane } from './createConfigPane'
import { createPreviewTransform } from './createPreviewTransform'

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
const stats = ref({
  fps: 0,
})
const copyHelperKeys = new Set(['jsonError', 'jsonTextChangeNumber'])
let fpsRafId: number | null = null
let fpsLastTime = 0
let fpsFrameCount = 0

function getComponentApi() {
  const instance = componentRef.value as any
  return instance?.$?.exposed ?? instance
}

function updateFps(now: number) {
  if (!fpsLastTime) {
    fpsLastTime = now
  }

  fpsFrameCount += 1
  const elapsed = now - fpsLastTime

  if (elapsed >= 500) {
    stats.value.fps = Number(((fpsFrameCount * 1000) / elapsed).toFixed(1))
    fpsFrameCount = 0
    fpsLastTime = now
  }

  fpsRafId = requestAnimationFrame(updateFps)
}

function startFpsMonitor() {
  if (typeof window === 'undefined' || fpsRafId !== null) {
    return
  }

  fpsLastTime = 0
  fpsFrameCount = 0
  fpsRafId = requestAnimationFrame(updateFps)
}

function stopFpsMonitor() {
  if (fpsRafId === null || typeof window === 'undefined') {
    return
  }

  cancelAnimationFrame(fpsRafId)
  fpsRafId = null
}

function getCopyPayload() {
  const defaultKeys = Object.keys(props.componentConfig?.default || {})
  const keysToCopy = defaultKeys.length > 0
    ? defaultKeys
    : Object.keys(attrsData).filter(key => !copyHelperKeys.has(key))

  return keysToCopy.reduce((result, key) => {
    result[key] = attrsData[key]
    return result
  }, {} as Record<string, any>)
}

function createCopyText() {
  return JSON.stringify(getCopyPayload(), null, 2)
}

async function writeTextToClipboard(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  if (typeof document === 'undefined') {
    throw new Error('Clipboard API is unavailable.')
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  document.body.appendChild(textarea)
  textarea.select()

  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)

  if (!copied) {
    throw new Error('Fallback copy command failed.')
  }
}

async function copyCurrentConfig() {
  try {
    await writeTextToClipboard(createCopyText())
    console.info('Current component config copied to clipboard.')
  }
  catch (error) {
    console.warn('Failed to copy current component config.', error)
    window.alert('复制失败，请检查当前页面的剪贴板权限后重试。')
  }
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

pane.addButton({ title: '复制当前带参数' }).on('click', () => {
  void copyCurrentConfig()
})
pane.addBinding(defaultState, 'showGrid', { label: '显示网格' })
pane.addBinding(defaultState, 'showAxes', { label: '显示轴' })

const statsFolder = pane.addFolder({
  title: '性能',
  expanded: true,
})

statsFolder.addBinding(stats.value, 'fps', {
  label: 'fps',
  readonly: true,
  view: 'graph',
  min: 0,
  max: 120,
  interval: 100,
})

startFpsMonitor()

onBeforeUnmount(() => {
  stopFpsMonitor()
  pane.dispose()
})

const { target, state: transformState, position, rotation, scale } = createPreviewTransform(
  pane,
  props.componentConfig?.defaultObject3D,
  props.componentConfig?.previewTransform === true,
)
</script>

<template>
  <TresGroup ref="target" :position="position" :rotation="rotation" :scale="scale">
    <Suspense>
      <component
        :is="foundComponent"
        v-if="foundComponent"
        ref="componentRef"
        v-bind="attrsData"
      />
    </Suspense>
  </TresGroup>
  <TransformControls
    v-if="componentConfig?.previewTransform && target"
    :object="target"
    :mode="transformState.mode"
    :space="transformState.space"
  />
  <TresGridHelper v-if="defaultState.showGrid" :position-y="0.1" />
  <TresAxesHelper v-if="defaultState.showAxes" />
</template>
