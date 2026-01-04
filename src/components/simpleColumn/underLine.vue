<!--
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2026-01-04 08:33:53
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2026-01-04 10:19:03
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    length?: number
    color?: string
  }>(),
  {
    length: 1,
    color: '#ffffff',
  },
)
</script>

<template>
  <TresGroup>
    <TresMesh castShadow>
      <TresCircleGeometry :args="[0.02, 20]" />
      <TresMeshBasicMaterial :color="color" />
    </TresMesh>
    <TresMesh :position="[length / 2, 0, 0]" castShadow>
      <TresPlaneGeometry :args="[length, 0.01]" />
      <TresMeshBasicMaterial :color="color" />
    </TresMesh>
  </TresGroup>
</template>
