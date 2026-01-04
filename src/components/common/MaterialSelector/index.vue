<!--
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-10-23 16:22:11
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2026-01-04 16:11:48
-->
<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useMaterial, useProps } from './useMaterial'
import type { MaterialType } from './materials'

/**
 * 接收父组件传入的材质类型和属性对象
 */
const props = defineProps<{
  type: MaterialType
  materialProps?: Record<string, any>
}>()

// 使用 useMaterial 根据类型与属性生成对应 Tres 组件与 props
const component = ref<any>(null)
const matProps = ref<Record<string, any>>({})
const materialRef = ref<any>(null) // ✅ 用于获取组件实例（即 material）
let changedMaterial = false
watch(
  () => props.type,
  async (type: any) => {
    // 🔹切换前释放旧的材质组件
    if (materialRef.value) {
      try {
        materialRef.value.dispose?.()
        // console.log('已释放旧材质组件')
      }
      catch (e) {
        console.warn('释放材质组件失败:', e)
      }
    }
    changedMaterial = false
    component.value = await useMaterial(type)
    changedMaterial = true
    matProps.value = {
      ...useProps(type),
      // ...props.materialProps,
    }
    Object.keys(props.materialProps as any).forEach((key) => {
      if (key in matProps.value && props.materialProps) {
        matProps.value[key] = props.materialProps[key]
      }
    })
  },
  { immediate: true },
)
watch(
  () => [props.type, props.materialProps],
  ([newtype, mp]: any, [oldtype]) => {
    if (newtype === oldtype && changedMaterial) {
      Object.keys(mp).forEach((key) => {
        if (key in matProps.value) {
          matProps.value[key] = mp[key]
        }
      })
    }
  },
  { deep: true },
)
</script>

<template>
  <component :is="component" v-bind="matProps" ref="materialRef" transparent />
</template>
