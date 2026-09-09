import { reactive, shallowRef } from 'vue'
import type { TransformControls } from '@tresjs/cientos'

type TransformTarget = InstanceType<typeof TransformControls>['$props']['object']

interface VectorConfig { x: number, y: number, z: number }
interface ObjectConfig {
  position?: VectorConfig
  rotation?: VectorConfig
  scale?: VectorConfig
}

/** Gizmo and transform state belong exclusively to the preview instance. */
export function createPreviewTransform(pane: any, defaults: ObjectConfig = {}, enabled = false) {
  const target = shallowRef<TransformTarget | null>(null)
  const tuple = (value: VectorConfig | undefined, fallback: number): [number, number, number] =>
    [value?.x ?? fallback, value?.y ?? fallback, value?.z ?? fallback]
  const position = tuple(defaults.position, 0)
  const rotation = tuple(defaults.rotation, 0)
  const scale = tuple(defaults.scale, 1)
  const state = reactive({ mode: 'translate', space: 'world' as 'world' | 'local' })
  if (enabled) {
    const folder = pane.addFolder({ title: '当前预览调试（不导出）', expanded: true })
    folder.addBinding(state, 'mode', {
      label: '拖拽工具',
      options: { 移动: 'translate', 旋转: 'rotate', 缩放: 'scale' },
    })
    folder.addBinding(state, 'space', {
      label: '坐标空间',
      options: { 世界: 'world', 局部: 'local' },
    })
    folder.addButton({ title: '重置位置、旋转和大小' }).on('click', () => {
      target.value?.position.set(...position)
      target.value?.rotation.set(...rotation)
      target.value?.scale.set(...scale)
    })
  }
  return { target, state, position, rotation, scale }
}
