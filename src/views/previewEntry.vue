<!--
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-29 15:59:22
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2026-01-04 09:45:00
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import dcsConfig from '../dcsConfig'
import templateComponet from './templateComponet.vue'

const route = useRoute()
const componentConfig = computed(() => dcsConfig.components.find(
  (item: any) => item.type === route.params.type,
) as any)
const componentDescription = computed(() => componentConfig.value?.description?.trim?.() || '')
</script>

<template>
  <div class="preview-root">
    <TresCanvas clear-color="#333" window-size>
      <TresPerspectiveCamera :position="[5, 5, 5]" />
      <OrbitControls make-default />
      <TresAmbientLight :intensity="0.5" />
      <TresDirectionalLight :position="[10, 10, 10]" :intensity="1.5" />
      <templateComponet :componentConfig="componentConfig" />
    </TresCanvas>

    <aside
      v-if="componentDescription"
      class="preview-description"
    >
      <strong>{{ componentConfig?.name }}</strong>
      <div v-html="componentDescription" />
    </aside>
  </div>
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
  position: relative;
  width: 100%;
  height: 100%;
}

.preview-description {
  position: fixed;
  left: 14px;
  bottom: 14px;
  z-index: 20;
  width: min(280px, calc(100vw - 28px));
  max-height: 120px;
  overflow: auto;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(240, 248, 255, 0.9);
  background: rgba(7, 18, 33, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(12px);
}

.preview-description strong {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  line-height: 1.4;
  color: #fff;
}

.preview-description a {
  color: #89b8ff;
}
</style>
