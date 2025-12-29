<!--
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-26 08:14:02
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2025-12-29 11:07:14
-->
<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'

import testBase from './components/testBase.vue'
import dynamicRotatingBase from './components/dynamicRotatingBase.vue'
</script>

<template>
  <TresCanvas clear-color="#82DBC5" window-size>
    <testBase />
    <TresPerspectiveCamera :position="[5, 5, 5]" />
    <OrbitControls />
    <dynamicRotatingBase />
  </TresCanvas>
</template>
