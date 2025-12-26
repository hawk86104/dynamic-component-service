/*
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-26 08:14:02
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2025-12-26 17:38:47
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import glsl from 'vite-plugin-glsl'
import { templateCompilerOptions } from '@tresjs/core'
import federation from '@originjs/vite-plugin-federation'

// https://vitejs.dev/config/
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
        './TheExperience': './src/components/TheExperience.vue',
        // './tvt/te': './src/components/TheExperience.vue', ×××
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
