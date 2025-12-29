/*
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-26 08:14:02
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2025-12-29 10:02:52
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import glsl from 'vite-plugin-glsl'
import { templateCompilerOptions } from '@tresjs/core'
import federation from '@originjs/vite-plugin-federation'
import dcsConfig from './src/dcsConfig.js'

// https://vitejs.dev/config/

const exposeMap = {};
dcsConfig.components.forEach(item => {
  exposeMap[`./${item.type}`] = item.comFile;
});
export default defineConfig({
  plugins: [
    vue({
      ...templateCompilerOptions,
    }),
    glsl(),
    federation({
      name: 'remote-tvt-components',
      filename: 'remoteEntry.js',
      exposes: {
        // './tvt/te': './src/components/TheExperience.vue', ×××
        './config': './src/dcsConfig.js',
        ...exposeMap
      },
      shared: ['vue', 'three'],
      // shared: ['vue','@tresjs/core'],
    }),
  ],
  build: {
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
