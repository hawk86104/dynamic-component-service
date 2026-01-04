/*
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-26 08:14:02
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2026-01-04 17:36:35
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import glsl from 'vite-plugin-glsl'
import { templateCompilerOptions } from '@tresjs/core'
import federation from '@originjs/vite-plugin-federation'
import dcsConfig from './src/dcsConfig'

// https://vitejs.dev/config/
const exposeMap = {} as any
dcsConfig.components.forEach((item: any) => {
  exposeMap[`./${item.type}`] = item.comFile
})
export default defineConfig({
  // base: './',
  plugins: [
    vue({
      ...templateCompilerOptions,
    }),
    glsl(),
    federation({
      name: 'remote-tvt-components',
      filename: 'remoteEntry.js',
      exposes: {
        // 不可以使用多层目录
        './config': './src/dcsConfig.js',
        ...exposeMap,
      },
      shared: {
        vue: {},
        three: { requiredVersion: '0.180.0' },
        // "@tresjs/cientos": { requiredVersion: '5.2.1' },
        // "@tresjs/core": { requiredVersion: '5.2.1' },
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          '@tresjs/cientos':['@tresjs/cientos']
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['vue', 'three','@tresjs/cientos'],
  },
})
