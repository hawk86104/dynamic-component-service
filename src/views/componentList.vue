<!--
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-26 08:14:02
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2025-12-30 08:13:22
-->
<script setup lang="ts">
import { computed } from 'vue'
import {
  NCard,
  NDivider,
  NEllipsis,
  NGrid,
  NGridItem,
  NSpace,
  NTag,
  NText,
} from 'naive-ui'
import dcsConfig from '../dcsConfig'

const isDev = import.meta.env.DEV

const currentBaseUrl = computed(() => {
  const { protocol, hostname, port } = window.location
  return `${protocol}//${hostname}${port ? `:${port}` : ''}/`
})

function goPreview(item: any) {
  const url = `${currentBaseUrl.value}preview/${item.type}`
  window.open(url, '_blank')
}
</script>

<template>
  <NSpace vertical size="large" style="padding: 8px;">
    <!-- 顶部信息 -->
    <NCard>
      <NSpace vertical size="small">
        <NSpace align="center">
          <NText strong style="font-size: 20px">
            {{ dcsConfig.name }}
          </NText>
          <NTag type="info" size="small">
            v{{ dcsConfig.version }}
          </NTag>
        </NSpace>

        <NText depth="3">
          tvt.js - {{ dcsConfig.description }}
        </NText>

        <NDivider />

        <NSpace align="center">
          <NTag :type="isDev ? 'warning' : 'success'">
            {{ isDev ? '调试模式' : '编译发布' }}
          </NTag>
          <NText>
            远程地址：
            <NText code>{{ currentBaseUrl }}</NText>
          </NText>
        </NSpace>
      </NSpace>
    </NCard>

    <!-- 组件列表 -->
    <NGrid
      cols="2 s:3 m:4 l:5 xl:6 2xl:7"
      x-gap="16"
      y-gap="16"
      responsive="screen"
    >
      <NGridItem
        v-for="item in dcsConfig.components"
        :key="item.type"
      >
        <NCard
          hoverable
          class="component-card"
          @click="goPreview(item)"
        >
          <template #cover>
            <div class="preview-wrapper">
              <img
                :src="item.previewPath"
                alt="preview"
              />
            </div>
          </template>

          <NSpace vertical size="small" style="padding-top: 16px;">
            <NEllipsis strong>
              名称：{{ item.name }}
            </NEllipsis>

            <NEllipsis depth="3">
              类型名：{{ item.type }}
            </NEllipsis>

            <NEllipsis depth="3">
              文件路径：
            </NEllipsis>
            <NEllipsis depth="3">
              {{ item.comFile }}
            </NEllipsis>
          </NSpace>
        </NCard>
      </NGridItem>
    </NGrid>
  </NSpace>
</template>

<style scoped>
.component-card {
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.component-card:hover {
  transform: translateY(-4px);
}

.preview-wrapper {
  height: 160px;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-wrapper img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}
</style>
