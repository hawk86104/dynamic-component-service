<!--
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-26 08:14:02
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2026-01-22 09:56:06
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dcsConfig from '../dcsConfig'

const isDev = import.meta.env.DEV
const keyword = ref('')
const theme = ref<'light' | 'dark'>('dark')

try {
  const savedTheme = localStorage.getItem('tvt-catalog-theme')
  if (savedTheme === 'light' || savedTheme === 'dark') { theme.value = savedTheme }
}
catch { /* 存储不可用时使用默认主题 */ }

watch(theme, (value) => {
  try {
    localStorage.setItem('tvt-catalog-theme', value)
  }
  catch { /* 存储不可用时，本次选择仍然生效 */ }
})

const currentBaseUrl = computed(() => window.location.origin + window.location.pathname)
const filteredComponents = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return dcsConfig.components.filter(item =>
    [item.name, item.type, item.comFile].some(value => value.toLowerCase().includes(query)),
  )
})

function previewHref(type: string) {
  return `${currentBaseUrl.value}#/preview/${encodeURIComponent(type)}`
}
</script>

<template>
  <div class="component-catalog" :data-theme="theme">
    <div class="catalog-container">
      <header class="catalog-header">
        <div class="catalog-brand">
          <img src="/logo.png" alt="" width="40" height="40" />
          <div>
            <strong>tvt.js <span>动态组件</span></strong>
            <span class="brand-caption">DYNAMIC COMPONENT SERVICE</span>
          </div>
        </div>
        <nav class="header-links" aria-label="相关资源">
          <a href="https://gitee.com/ice-gl/dynamic-component-service" target="_blank" rel="noopener noreferrer">开源仓库 <span aria-hidden="true">↗</span></a>
          <a href="https://docs.icegl.cn/docs/three-vue-tres/dynamic-component-service/introduction.html" target="_blank" rel="noopener noreferrer">使用文档 <span aria-hidden="true">↗</span></a>
        </nav>
        <div class="theme-switch" role="group" aria-label="页面主题">
          <button type="button" :aria-pressed="theme === 'light'" @click="theme = 'light'">浅色</button>
          <button type="button" :aria-pressed="theme === 'dark'" @click="theme = 'dark'">深色</button>
        </div>
      </header>

      <main>
        <section class="catalog-heading" aria-labelledby="catalog-title">
          <div>
            <span class="catalog-eyebrow">EXPLORE / TVT.JS</span>
            <h1 id="catalog-title">动态组件库</h1>
            <p>探索可复用的三维组件，打开演示，体验实时效果。</p>
          </div>
          <span class="catalog-count">{{ dcsConfig.components.length }} 个组件</span>
        </section>

        <details class="service-info">
          <summary>服务信息 <span>{{ dcsConfig.name }} · v{{ dcsConfig.version }}</span></summary>
          <div class="service-info-body">
            <div class="service-meta">
              <span class="mode-tag">{{ isDev ? '调试模式' : '编译发布' }}</span>
              <span>远程地址：<code>{{ currentBaseUrl }}</code></span>
            </div>
            <div class="service-description" v-html="dcsConfig.description"></div>
          </div>
        </details>

        <form class="catalog-toolbar" role="search" @submit.prevent>
          <div class="catalog-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 4.5 4.5" />
            </svg>
            <label class="sr-only" for="component-search">搜索组件名称、类型或文件路径</label>
            <input
              id="component-search"
              v-model="keyword"
              type="search"
              placeholder="搜索组件名称、类型…"
              autocomplete="off"
              @keydown.esc="keyword = ''"
            />
          </div>
          <span class="search-count" role="status" aria-live="polite" aria-atomic="true">{{ filteredComponents.length }} / {{ dcsConfig.components.length }} 个组件</span>
        </form>

        <section v-if="filteredComponents.length" class="component-grid" aria-label="组件列表">
          <article v-for="item in filteredComponents" :key="item.type" class="component-card">
            <a
              class="component-preview"
              :href="previewHref(item.type)"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`查看${item.name}演示（新窗口）`"
            >
              <div class="preview-wrapper">
                <img :src="item.previewPath" :alt="`${item.name}效果预览`" loading="lazy" decoding="async" width="300" height="186" />
              </div>
              <h2 :title="item.name">{{ item.name }}</h2>
              <p class="component-type" :title="item.type">{{ item.type }}</p>
              <span class="preview-action">查看演示 <span aria-hidden="true">↗</span></span>
            </a>
            <details class="component-info">
              <summary>更多信息</summary>
              <div class="component-info-body">
                <dl>
                  <dt>类型名</dt>
                  <dd>{{ item.type }}</dd>
                  <dt>文件路径</dt>
                  <dd>{{ item.comFile }}</dd>
                </dl>
                <div v-if="item.description" class="component-description" v-html="item.description"></div>
              </div>
            </details>
          </article>
        </section>
        <div v-else class="catalog-empty">
          <h2>没有找到匹配组件</h2>
          <p>试试其他名称、类型名或文件路径。</p>
          <button type="button" @click="keyword = ''">查看全部组件</button>
        </div>
      </main>
      <footer class="catalog-footer">tvt.js · 动态组件服务</footer>
    </div>
  </div>
</template>

<style scoped>
.component-catalog {
  --catalog-bg: #09090b;
  --catalog-surface: #111113;
  --catalog-raised: #19191d;
  --catalog-border: #2a2a30;
  --catalog-text: #f4f4f5;
  --catalog-muted: #a1a1aa;
  --catalog-accent: #5384ff;
  --catalog-button: #334e90;
  --catalog-shadow: 0 12px 32px #0003;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--catalog-bg);
  color: var(--catalog-text);
  color-scheme: dark;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    'PingFang SC',
    'Microsoft YaHei',
    sans-serif;
  font-size: 14px;
  line-height: 1.6;
}

.component-catalog[data-theme='light'] {
  --catalog-bg: #fafafa;
  --catalog-surface: #fff;
  --catalog-raised: #f4f4f5;
  --catalog-border: #e4e4e7;
  --catalog-text: #18181b;
  --catalog-muted: #62626e;
  --catalog-accent: #2563eb;
  --catalog-shadow: 0 12px 32px #1825420d;
  color-scheme: light;
}

.component-catalog *,
.component-catalog *::before,
.component-catalog *::after {
  box-sizing: border-box;
}
.component-catalog :is(a, button, input, summary):focus-visible {
  outline: 2px solid var(--catalog-accent);
  outline-offset: 3px;
}
.component-catalog button,
.component-catalog input {
  font: inherit;
}
.component-catalog button,
.component-catalog summary {
  cursor: pointer;
}
.component-catalog a {
  text-decoration: none;
}
.catalog-container {
  max-width: 1680px;
  margin: 0 auto;
  padding: 0 32px;
}
.catalog-header {
  display: flex;
  align-items: center;
  gap: 24px;
  min-height: 84px;
  border-bottom: 1px solid var(--catalog-border);
}
.catalog-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  margin-right: auto;
}
.catalog-brand img {
  flex-shrink: 0;
  object-fit: contain;
}
.catalog-brand strong {
  display: block;
  font-size: 22px;
  letter-spacing: -0.5px;
}
.catalog-brand strong span {
  margin-left: 6px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0;
}
.brand-caption {
  display: block;
  color: var(--catalog-muted);
  font-size: 9px;
  letter-spacing: 1px;
}
.header-links {
  display: flex;
  align-items: center;
  gap: 20px;
}
.header-links a {
  color: var(--catalog-muted);
  font-size: 13px;
  white-space: nowrap;
  padding: 8px 0;
}
.header-links a:hover {
  color: var(--catalog-accent);
}
.theme-switch {
  display: flex;
  flex-shrink: 0;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--catalog-border);
  border-radius: 9px;
  background: var(--catalog-raised);
}
.theme-switch button {
  min-height: 32px;
  border: 0;
  border-radius: 6px;
  padding: 4px 10px;
  color: var(--catalog-muted);
  background: transparent;
  font-size: 12px;
}
.theme-switch button[aria-pressed='true'] {
  background: var(--catalog-surface);
  color: var(--catalog-text);
  box-shadow: 0 1px 3px #0002;
}
.catalog-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 32px 0 22px;
}
.catalog-eyebrow {
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--catalog-muted);
}
.catalog-heading h1 {
  margin: 6px 0 8px;
  font-size: 32px;
  font-weight: 650;
  letter-spacing: -1px;
  line-height: 1.25;
}
.catalog-heading p {
  margin: 0;
  color: var(--catalog-muted);
  font-size: 13px;
}
.catalog-count {
  flex-shrink: 0;
  padding: 5px 10px;
  border: 1px solid var(--catalog-border);
  border-radius: 20px;
  color: var(--catalog-muted);
  font-size: 12px;
}
.service-info {
  border: 1px solid var(--catalog-border);
  border-radius: 10px;
  background: var(--catalog-surface);
  color: var(--catalog-muted);
  font-size: 12px;
}
.service-info > summary {
  padding: 9px 12px;
}
.service-info > summary span {
  margin-left: 10px;
  color: var(--catalog-muted);
  font-size: 11px;
}
.service-info[open] > summary {
  border-bottom: 1px solid var(--catalog-border);
  color: var(--catalog-text);
}
.service-info-body {
  padding: 14px;
}
.service-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  margin-bottom: 16px;
  overflow-wrap: anywhere;
}
.service-meta > span {
  min-width: 0;
}
.service-meta code {
  color: var(--catalog-text);
  font-size: 12px;
}
.mode-tag {
  border-radius: 5px;
  padding: 2px 7px;
  background: var(--catalog-raised);
  color: var(--catalog-accent);
}
.service-description :deep(.eco-grid) {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
}
.service-description :deep(.eco-title) {
  color: var(--catalog-text);
}
.service-description :deep(.eco-item) {
  background: var(--catalog-raised);
  border-color: var(--catalog-border);
  color: var(--catalog-text);
}
.service-description :deep(.eco-item:hover) {
  border-color: var(--catalog-accent);
  background: var(--catalog-raised);
}
.service-description :deep(.eco-link) {
  color: var(--catalog-muted);
}
.catalog-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 20px 0;
}
.catalog-search {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  max-width: 520px;
  padding: 0 12px;
  border: 1px solid var(--catalog-border);
  border-radius: 9px;
  background: var(--catalog-surface);
}
.catalog-search:focus-within {
  border-color: var(--catalog-accent);
}
.catalog-search svg {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: var(--catalog-muted);
}
.catalog-search input {
  width: 100%;
  min-width: 0;
  min-height: 42px;
  border: 0;
  border-radius: 5px;
  padding: 8px 0;
  background: transparent;
  color: var(--catalog-text);
}
.catalog-search input::placeholder {
  color: var(--catalog-muted);
}
.search-count {
  margin-left: auto;
  color: var(--catalog-muted);
  font-size: 12px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.component-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  align-items: start;
  gap: 20px;
}
.component-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--catalog-border);
  border-radius: 14px;
  background: var(--catalog-surface);
  transition:
    transform 0.2s,
    border-color 0.2s,
    box-shadow 0.2s;
}
.component-card:focus-within {
  border-color: var(--catalog-accent);
  box-shadow: var(--catalog-shadow);
}
.component-preview {
  display: block;
  padding: 10px;
  color: var(--catalog-text);
}
.component-preview:focus-visible {
  outline-offset: -3px !important;
  border-radius: 12px;
}
.preview-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  aspect-ratio: 16 / 10;
  border-radius: 8px;
  background: #0f172a;
}
.preview-wrapper img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.35s;
}
.component-preview h2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.8em;
  margin: 12px 2px 4px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.component-type {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 2px 12px;
  color: var(--catalog-muted);
  font-size: 11px;
}
.preview-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  border-radius: 7px;
  background: var(--catalog-button);
  color: #fff;
  font-size: 12px;
}
.component-preview:hover .preview-action {
  filter: brightness(1.12);
}
.component-info {
  padding: 0 12px 10px;
  color: var(--catalog-muted);
  font-size: 12px;
}
.component-info summary {
  width: fit-content;
  padding: 3px 0;
}
.component-info-body {
  max-height: 240px;
  overflow: auto;
  overflow-wrap: anywhere;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--catalog-border);
  scrollbar-width: thin;
  scrollbar-color: var(--catalog-border) transparent;
}
.component-info dl {
  margin: 0;
}
.component-info dt {
  font-size: 10px;
}
.component-info dd {
  margin: 2px 0 10px;
  color: var(--catalog-text);
  font-size: 11px;
}
.component-description {
  padding-top: 8px;
  border-top: 1px solid var(--catalog-border);
}
.component-description :deep(a) {
  color: var(--catalog-accent) !important;
}
.component-description :deep(img) {
  max-width: 100%;
  height: auto;
}
.catalog-empty {
  padding: 64px 12px;
  text-align: center;
  color: var(--catalog-muted);
}
.catalog-empty h2 {
  margin: 0;
  color: var(--catalog-text);
  font-size: 20px;
}
.catalog-empty button {
  border: 1px solid var(--catalog-border);
  border-radius: 8px;
  padding: 8px 14px;
  background: var(--catalog-surface);
  color: var(--catalog-accent);
}
.catalog-footer {
  padding: 32px 0 max(24px, env(safe-area-inset-bottom));
  color: var(--catalog-muted);
  font-size: 11px;
  text-align: center;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (max-width: 900px) {
  .catalog-container {
    padding: 0 20px;
  }
  .catalog-header {
    gap: 16px;
  }
  .brand-caption {
    display: none;
  }
  .component-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }
}

@media (max-width: 599px) {
  .catalog-container {
    padding: 0 12px;
  }
  .catalog-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2px 8px;
    min-height: 0;
    padding: 10px 0 4px;
  }
  .catalog-brand {
    gap: 7px;
  }
  .catalog-brand img {
    width: 30px;
    height: 30px;
  }
  .catalog-brand strong {
    font-size: 18px;
  }
  .catalog-brand strong span {
    font-size: 12px;
    margin-left: 3px;
  }
  .theme-switch {
    grid-column: 2;
    grid-row: 1;
    padding: 2px;
  }
  .theme-switch button {
    padding: 4px 8px;
  }
  .header-links {
    grid-column: 1 / -1;
    grid-row: 2;
    gap: 16px;
  }
  .header-links a {
    padding: 5px 0;
    font-size: 11px;
  }
  .catalog-heading {
    gap: 8px;
    padding: 14px 0 10px;
  }
  .catalog-heading h1 {
    margin: 0;
    font-size: 22px;
    letter-spacing: -0.5px;
  }
  .catalog-eyebrow,
  .catalog-heading p {
    display: none;
  }
  .catalog-count {
    padding: 3px 8px;
    font-size: 11px;
  }
  .service-info > summary {
    padding: 7px 10px;
  }
  .service-info > summary span {
    margin-left: 5px;
    font-size: 10px;
  }
  .service-info-body {
    padding: 10px;
  }
  .catalog-toolbar {
    gap: 8px;
    margin: 12px 0;
  }
  .catalog-search {
    gap: 6px;
    padding: 0 8px;
  }
  .catalog-search input {
    min-height: 40px;
    font-size: 16px;
  }
  .search-count {
    font-size: 10px;
  }
  .component-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .component-card {
    border-radius: 10px;
  }
  .component-preview {
    padding: 7px;
  }
  .preview-wrapper {
    border-radius: 6px;
  }
  .component-preview h2 {
    margin: 8px 1px;
    font-size: 13px;
  }
  .component-type {
    display: none;
  }
  .preview-action {
    min-height: 34px;
    border-radius: 6px;
    font-size: 11px;
  }
  .component-info {
    padding: 0 8px 6px;
    font-size: 11px;
  }
  .component-info summary {
    padding: 5px 0;
  }
  .catalog-footer {
    padding-top: 24px;
  }
}

@media (hover: hover) and (pointer: fine) {
  .component-card:hover {
    transform: translateY(-3px);
    border-color: var(--catalog-accent);
    box-shadow: var(--catalog-shadow);
  }
  .component-card:hover .preview-wrapper img {
    transform: scale(1.04);
  }
  .component-card:hover h2 {
    color: var(--catalog-accent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .component-card,
  .preview-wrapper img {
    transition: none;
  }
  .component-card:hover,
  .component-card:hover .preview-wrapper img {
    transform: none;
  }
  .service-description :deep(.eco-item) {
    transition: none;
    transform: none;
  }
}
</style>
