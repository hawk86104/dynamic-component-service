<!--
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-26 08:14:02
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2026-01-04 16:08:48
-->
<script setup lang="ts">
import type { TresObject } from '@tresjs/core'
import { useLoop } from '@tresjs/core'
import { shallowRef } from 'vue'

const { onBeforeRender } = useLoop()

const boxRef = shallowRef<TresObject | null>(null)

onBeforeRender(({ elapsed }) => {
  if (boxRef.value) {
    boxRef.value.rotation.y = elapsed
    boxRef.value.rotation.z = elapsed
  }
})
</script>

<template>
  <TresGroup>
    <TresMesh
      ref="boxRef"
      :position="[0, 2, 0]"
    >
      <TresBoxGeometry :args="[1, 1, 1]" />
      <TresMeshNormalMaterial />
    </TresMesh>
  </TresGroup>
</template>
