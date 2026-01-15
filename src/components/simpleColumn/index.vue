<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import bannerLabel from '../common/bannerLabel.vue'
import underLine from './underLine.vue'
import MaterialSelector from '../common/MaterialSelector/index.vue'
import JSON5 from 'json5'

const props = withDefaults(
  defineProps<{
    jsonText?: string
    jsonTextChangeNumber?: number
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
    jsonText: `[
{ value: 43, title: '%',color:'#5072c4' },
{ value: 24, title: '%', color:'#92cb79' },
{ value: 12, title: '%', color:'#fcc660' },
{ value: 39, title: '%', color:'#f8285b' },
{ value: 14, title: '%', color:'#ff0ecb' },
]`,
    jsonTextChangeNumber: 0,
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
const dataParsed = ref<Array<{ value: number, title: string, color: string }>>([])
const calcGeometry = () => {
  geometryLabelList.splice(0, geometryLabelList.length)
  const rawValue = props.jsonText?.trim()
  dataParsed.value = rawValue ? JSON5.parse(rawValue) : []
  const boxtotal = dataParsed.value.map(x => x.value).reduce((accum, value) => accum + value)
  dataParsed.value.forEach((item) => {
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
    const columnwidth = (props.width - props.spacing * (dataParsed.value.length + 1)) / dataParsed.value.length
    result = Array.from({ length: dataParsed.value.length }).fill(columnwidth)
  }
  else {
    const total = dataParsed.value.map(x => x.value).reduce((a, v) => a + v)
    dataParsed.value.forEach((item) => {
      result.push((item.value / total) * props.width)
    })
  }
  return result
}

const meshList = ref([]) as any
const reCalcMeshList = () => {
  meshList.value.splice(0, meshList.value.length)
  const columnwidths = calcDistribution()
  let x = 0

  dataParsed.value.forEach((data, index) => {
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

    meshList.value.push({ x, y, data, geometry: geometryLabelList[index] })
    x += halfwidth
  })
}
reCalcMeshList()

const centerX = ref(0)
onMounted(() => {
})

watch(
  () => [props.titleSize, props.width, props.spacing, props.distribution, props.jsonTextChangeNumber],
  () => {
    calcGeometry()
    reCalcMeshList()
  },
)
</script>

<template>
  <TresGroup>
    <TresGroup :position-x="centerX">
      <TresGroup v-for="(mesh, index) in meshList" :key="index" :position="[mesh.x, 0.001, 0]">
        <TresMesh :geometry="mesh.geometry" castShadow>
          <MaterialSelector
            :type="materialType"
            :material-props="{
              color: mesh.data.color,
              metalness,
              roughness,
              clearcoat,
              clearcoatRoughness,
              reflectivity,
              opacity,
            }"
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
        <underLine
          :color="fontColor"
          :length="0.3"
          :position="[0, 0.011, 0.24]"
          :rotation="[-Math.PI / 2, 0, -Math.PI / 2]"
        />
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>
