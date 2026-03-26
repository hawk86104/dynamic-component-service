<!--
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-26 08:14:02
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2026-01-22 09:56:06
-->
<script setup lang="ts">
import { computed } from 'vue'
import {
  NButton,
  NCard,
  NDivider,
  NEllipsis,
  NElement,
  NGrid,
  NGridItem,
  NIcon,
  NSpace,
  NTag,
  NText,
} from 'naive-ui'
import dcsConfig from '../dcsConfig'

const isDev = import.meta.env.DEV

const currentBaseUrl = computed(() => {
  return window.location.origin + window.location.pathname
})

function goPreview(item: any) {
  window.open(`${currentBaseUrl.value}#/preview/${item.type}`, '_blank')
}
</script>

<template>
  <NCard
    size="small"
    :bordered="false"
    style="background: rgba(255, 255, 255, 1); padding: 18px;"
  >
    <div style="display: flex; align-items: center; gap: 14px;">
      <NIcon :size="58">
        <img style="width: 100%;" src="/logo.png" />
      </NIcon>

      <div style="flex: 1;">
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">
          Dynamic Component Service for tvt.js
        </div>
        <div style="font-size: 14px; opacity: 0.82;">
          基于 tvt.js 生态的动态组件发布与加载服务，用于构建更灵活的模块化应用体系。
        </div>
      </div>

      <div style="display: flex; gap: 10px;">
        <NButton
          type="primary"
          tag="a"
          href="https://gitee.com/ice-gl/dynamic-component-service"
          target="_blank"
        >
          开源仓库
        </NButton>

        <NButton
          type="info"
          tag="a"
          href="https://docs.icegl.cn/docs/three-vue-tres/dynamic-component-service/introduction.html"
          target="_blank"
        >
          文档
        </NButton>
      </div>
    </div>
  </NCard>
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

        <NElement tag="div" v-html="dcsConfig.description" />

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
