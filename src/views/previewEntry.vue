<!--
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-29 15:59:22
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2026-01-04 09:45:00
-->
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import dcsConfig from '../dcsConfig'
import templateComponet from './templateComponet.vue'

const route = useRoute()
const type = route.params.type as string

const componentConfig = dcsConfig.components.find(
  (item: any) => item.type === type,
) as any
console.log('componentConfig:', componentConfig)
</script>

<template>
  <TresCanvas clear-color="#333" window-size>
    <TresPerspectiveCamera :position="[5, 5, 5]" />
    <OrbitControls />
    <TresAmbientLight :intensity="0.5" />
    <TresDirectionalLight :position="[10, 10, 10]" :intensity="1.5" />
    <templateComponet :componentConfig="componentConfig" />
  </TresCanvas>
</template>

<style>
html,
body,
#app {
  margin: 0;
  width: 100%;
  height: 100%;
}

.preview-root {
  width: 100%;
  height: 100%;
}
</style>
