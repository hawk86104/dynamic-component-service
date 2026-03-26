<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { Tree, TreePreset } from '@dgreenheck/ez-tree'
import JSON5 from 'json5'
import { watch } from 'vue'

type TreeConfigObject = Record<string, unknown>
type TreeConfigInput
  = | string
    | TreeConfigObject
    | {
      jsonText?: string
      options?: TreeConfigObject
    }

const props = withDefaults(
  defineProps<{
    isUpdate?: boolean
    jsonText?: string
    jsonTextChangeNumber?: number
  }>(),
  {
    isUpdate: true,
    jsonText: ``,
    jsonTextChangeNumber: 0,
  },
)

const { onBeforeRender } = useLoop()

const tree = new Tree() as any
const presetNames = Object.keys(TreePreset)

tree.options.seed = 12345
tree.options.branch.levels = 3
tree.generate()

function getConfigSnapshot() {
  return {
    jsonText: JSON.stringify(tree.options, null, 2),
  }
}

function parseConfig(input: TreeConfigInput): TreeConfigObject {
  if (typeof input === 'string') {
    const rawValue = input.trim()
    if (!rawValue) {
      throw new Error('Tree config text is empty.')
    }
    return JSON5.parse(rawValue) as TreeConfigObject
  }

  if (!input || typeof input !== 'object') {
    throw new Error('Tree config payload must be a JSON string or plain object.')
  }

  if ('options' in input && input.options && typeof input.options === 'object') {
    return input.options as TreeConfigObject
  }

  if ('jsonText' in input && typeof input.jsonText === 'string') {
    return JSON5.parse(input.jsonText) as TreeConfigObject
  }

  return input as TreeConfigObject
}

function applyConfig(input: TreeConfigInput) {
  tree.loadFromJson(parseConfig(input))
  return getConfigSnapshot()
}

function randomizeTreeConfig() {
  if (presetNames.length) {
    const presetName = presetNames[Math.floor(Math.random() * presetNames.length)]
    tree.loadPreset(presetName)
  }

  tree.options.seed = Math.floor(Math.random() * 65536)
  tree.generate()

  return getConfigSnapshot()
}

onBeforeRender(({ elapsed }) => {
  if (tree && props.isUpdate) {
    tree.update(elapsed)
  }
})

watch(
  () => props.jsonTextChangeNumber,
  () => {
    if (!props.jsonText) {
      return
    }

    try {
      applyConfig(props.jsonText)
    }
    catch (error) {
      console.error('Failed to parse jsonText:', error)
    }
  },
  { immediate: true },
)

defineExpose({
  getConfig: getConfigSnapshot,
  applyConfig,
  randomizeTreeConfig,
})
</script>

<template>
  <TresGroup>
    <primitive :object="tree" :scale="0.1" />
  </TresGroup>
</template>
