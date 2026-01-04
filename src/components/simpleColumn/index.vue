<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import bannerLabel from '../common/bannerLabel.vue'
import underLine from './underLine.vue'
import MaterialSelector from '../common/MaterialSelector/index.vue'

const props = withDefaults(
  defineProps<{
    data?: Array<{ value: number, title: string, color: string }>
    spacing?: number
    distribution?: 'uniform' | 'proportional'
    width?: number
    titleSize?: number
    fontColor?: string
    materialType?: any
    metalness?: number
    roughness?: number
    clearcoat?: number
    clearcoatRoughness?: number
    reflectivity?: number
    opacity?: number
  }>(),
  {
    data: () => [
      { value: 43, title: '%', color: '#5072c4' },
      { value: 24, title: '%', color: '#92cb79' },
      { value: 12, title: '%', color: '#fcc660' },
      { value: 39, title: '%', color: '#f8285b' },
      { value: 14, title: '%', color: '#70c1dd' },
    ], // 数据
    spacing: 0, // 间距
    distribution: 'proportional', // 布局方式
    width: 4 / 3, // 宽度
    titleSize: 0.8, // 标题大小
    fontColor: '#ffffff',
    materialType: 'MeshPhysicalMaterial',
    metalness: 0.5,
    roughness: 0.5,
    clearcoat: 0.2,
    clearcoatRoughness: 0.1,
    reflectivity: 0.5,
    opacity: 1,
  },
)

const geometryLabelList = [] as any
const calcGeometry = () => {
  geometryLabelList.splice(0, geometryLabelList.length)
  const boxtotal = props.data.map(x => x.value).reduce((accum, value) => accum + value)
  props.data.forEach((item) => {
    const width = ((item.value / boxtotal) * 4) / 3

    const geometry = new THREE.BoxGeometry(width, 0.2, 0.4)
    geometry.translate(0, 0.1, 0)
    geometryLabelList.push(geometry)
  })
}
calcGeometry()

const calcDistribution = () => {
  let result: Array<any> = []
  if (props.distribution === 'uniform') {
    const columnwidth = (props.width - props.spacing * (props.data.length + 1)) / props.data.length
    result = Array.from({ length: props.data.length }).fill(columnwidth)
  }
  else {
    const total = props.data.map(x => x.value).reduce((a, v) => a + v)
    props.data.forEach((item) => {
      result.push((item.value / total) * props.width)
    })
  }
  return result
}

const meshList: Array<any> = []
const reCalcMeshList = () => {
  meshList.splice(0, meshList.length)
  const columnwidths = calcDistribution()
  let x = 0

  props.data.forEach((data, index) => {
    const halfwidth = (props.spacing + columnwidths[index]) / 2
    x += halfwidth

    let y = 0
    if (geometryLabelList[index]) {
      geometryLabelList[index].computeBoundingBox()
      const box = geometryLabelList[index].boundingBox
      if (box) {
        const size = new THREE.Vector3()
        box.getSize(size)
        y = size.y
      }
    }

    meshList.push({ x, y, data, geometry: geometryLabelList[index] })
    x += halfwidth
  })
}
reCalcMeshList()

const tgroup = ref(null) as any
const centerX = ref(0)
const updateCenterX = () => {
  const box = new THREE.Box3().setFromObject(tgroup.value)
  centerX.value = -(box.max.x + box.min.x) / 2
}

onMounted(() => {
  updateCenterX()
})

watch(
  () => [props.titleSize, props.width, props.spacing, props.distribution],
  () => {
    calcGeometry()
    reCalcMeshList()
    updateCenterX()
  },
)
</script>

<template>
  <TresGroup>
    <TresGroup ref="tgroup" :position-x="centerX">
      <TresGroup v-for="(mesh, index) in meshList" :key="index" :position="[mesh.x, 0.001, 0]">
        <TresMesh :geometry="mesh.geometry" castShadow>
          <MaterialSelector
            :type="materialType"
            :material-props="{ color: mesh.data.color,
                               metalness,
                               roughness,
                               clearcoat,
                               clearcoatRoughness,
                               reflectivity,
                               opacity }"
          />
        </TresMesh>
        <bannerLabel
          :rotation="[-Math.PI / 2, -Math.PI / 2, -Math.PI / 2]"
          :text="`${mesh.data.value}${mesh.data.title}`"
          :fontSize="titleSize"
          :position="[0.05, 0.01, 0.4]"
          :isSprite="false"
          backgroundColor="rgba(255, 255, 255, 0.0)"
          :fontColor="fontColor"
          :dpi="10"
        />
        <underLine :color="fontColor" :length="0.3" :position="[0, 0.011, 0.24]" :rotation="[-Math.PI / 2, 0, -Math.PI / 2]" />
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>
