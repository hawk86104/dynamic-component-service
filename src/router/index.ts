/*
 * @Description: 
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-29 16:00:08
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2025-12-29 17:01:14
 */
import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../views/componentList.vue'),
    },
    {
      path: '/preview/:type',
      component: () => import('../views/previewEntry.vue'),
    },
  ],
})

export default router