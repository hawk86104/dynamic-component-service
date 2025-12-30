/*
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-26 08:14:02
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2025-12-30 21:46:05
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import glsl from 'vite-plugin-glsl'
import { templateCompilerOptions } from '@tresjs/core'
import federation from '@originjs/vite-plugin-federation'
import dcsConfig from './src/dcsConfig'

// https://vitejs.dev/config/
const exposeMap = {}
dcsConfig.components.forEach((item) => {
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
        three: { requiredVersion: "0.180.0" }
        // three: { version: '0.180.0',shareScope: 'three-default' },
      },
    }),
  ],
  build: {
    // assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['vue', 'three'],
  },
})
