<!--
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-26 08:14:02
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2026-01-22 09:27:27
-->
<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { Tree } from '@dgreenheck/ez-tree'
import { watch } from 'vue'

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

tree.options.seed = 12345
tree.options.branch.levels = 3

tree.generate()

onBeforeRender(({ elapsed }) => {
  if (tree) {
    if (props.isUpdate) { tree.update(elapsed) }
  }
})

watch(
  () => [props.jsonTextChangeNumber],
  () => {
    if (props.jsonText) {
      try {
        const json = JSON.parse(props.jsonText)
        tree.options = json
        tree.generate()
      }
      catch (e) {
        console.error('Failed to parse jsonText:', e)
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <TresGroup>
    <primitive :object="tree" :scale="0.1" />
  </TresGroup>
</template>
