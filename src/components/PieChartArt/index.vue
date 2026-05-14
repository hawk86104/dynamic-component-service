<script setup lang="ts">
import * as THREE from 'three'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from 'vue'
import {
  DEFAULT_CHART_DATA,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_JSON_TEXT,
} from './constants'
import {
  clampInteger,
  clampNumber,
  createSliceLayouts,
  parseChartData,
} from './data'
import { createPieSliceGeometry } from './geometry'
import {
  createLabelSprite,
  createLeaderLine,
  resolveLabelLayouts,
} from './labels'
import { createSliceMaterial } from './materials'
import { clearGroup } from './scene'
import type {
  ChartBuildOptions,
  GradientDirection,
  GradientOptions,
  MaterialOptions,
  PieChartData,
  PieColorScheme,
  SliceLayout,
} from './types'

const props = withDefaults(
  defineProps<{
    bevel?: number
    bevelSegments?: number
    colorScheme?: PieColorScheme
    creaseAngle?: number
    envMapIntensity?: number
    gap?: number
    gradientCurve?: number
    gradientDirection?: GradientDirection
    gradientFromY?: number
    gradientToY?: number
    height?: number
    innerRadius?: number
    jsonText?: string
    jsonTextChangeNumber?: number
    labelFontSize?: number
    metalness?: number
    radius?: number
    roughness?: number
    sideSegments?: number
    smoothShading?: boolean
  }>(),
  {
    bevel: 0.15,
    bevelSegments: 6,
    colorScheme: DEFAULT_COLOR_SCHEME,
    creaseAngle: 90,
    envMapIntensity: 1.2,
    gap: 0.06,
    gradientCurve: 0.8,
    gradientDirection: 'vertical',
    gradientFromY: 0,
    gradientToY: 1,
    height: 2.5,
    innerRadius: 0,
    jsonText: DEFAULT_JSON_TEXT,
    jsonTextChangeNumber: 0,
    labelFontSize: 2.05,
    metalness: 0.5,
    radius: 5.5,
    roughness: 0.5,
    sideSegments: 64,
    smoothShading: true,
  },
)

const rootGroup = shallowRef(new THREE.Group())
const chartGroup = new THREE.Group()
chartGroup.name = 'PieChartArtChart'
rootGroup.value.name = 'PieChartArtRoot'
rootGroup.value.add(chartGroup)

let mounted = false
let activeData = parseChartData(props.jsonText, DEFAULT_CHART_DATA)
let activeDataKey = createDataKey(activeData)
let activeLayouts: SliceLayout[] = []

const chartOptions = computed<ChartBuildOptions>(() => {
  const radius = clampNumber(props.radius, 0.8, 12, 5.5)
  const innerRadius = clampNumber(props.innerRadius, 0, radius * 0.86, 0)

  return {
    bevel: clampNumber(props.bevel, 0, 0.6, 0.15),
    bevelSegments: clampInteger(props.bevelSegments, 1, 8, 6),
    creaseAngle: clampNumber(props.creaseAngle, 0, 180, 90),
    gap: clampNumber(props.gap, 0, 0.22, 0.06),
    height: clampNumber(props.height, 0.25, 6, 2.5),
    innerRadius,
    radius,
    sideSegments: clampInteger(props.sideSegments, 8, 256, 64),
    smoothShading: props.smoothShading !== false,
  }
})

const gradientOptions = computed<GradientOptions>(() => {
  const directionList: GradientDirection[] = ['vertical', 'radial', 'angular']
  const direction = directionList.includes(props.gradientDirection)
    ? props.gradientDirection
    : 'vertical'

  return {
    colorScheme: (props.colorScheme || DEFAULT_COLOR_SCHEME) as PieColorScheme,
    curve: clampNumber(props.gradientCurve, 0.1, 3, 0.8),
    direction,
    fromY: clampNumber(props.gradientFromY, 0, 1, 0),
    toY: clampNumber(props.gradientToY, 0, 1, 1),
  }
})

const materialOptions = computed<MaterialOptions>(() => {
  return {
    envMapIntensity: clampNumber(props.envMapIntensity, 0, 3, 1.2),
    metalness: clampNumber(props.metalness, 0, 1, 0.5),
    roughness: clampNumber(props.roughness, 0, 1, 0.5),
  }
})

const safeLabelFontSize = computed(() => clampNumber(props.labelFontSize, 0.8, 4, 2.05))

function createDataKey(data: PieChartData) {
  return JSON.stringify({
    slices: data.slices.map(slice => [slice.label, slice.value]),
    title: data.title,
    unit: data.unit,
  })
}

function renderChart(layouts: SliceLayout[], chartData: PieChartData, labelOpacity = 1) {
  clearGroup(chartGroup)

  const chart = chartOptions.value
  const labelLayouts = resolveLabelLayouts(layouts, chart)
  const labelData: PieChartData = {
    title: chartData.title,
    unit: chartData.unit,
    slices: layouts.map(layout => ({
      label: layout.datum.label,
      value: Math.max(layout.value, 0),
    })),
  }

  layouts.forEach((layout, index) => {
    const sliceAngle = layout.endAngle - layout.startAngle

    if (sliceAngle < 0.002 || layout.value <= 0.001) {
      return
    }

    const sliceOptions: ChartBuildOptions = {
      ...chart,
      height: layout.height,
    }
    const geometry = createPieSliceGeometry(layout.startAngle, layout.endAngle, sliceOptions)
    const material = createSliceMaterial(
      geometry,
      layout.startAngle,
      layout.endAngle,
      layout.palette,
      gradientOptions.value,
      materialOptions.value,
      chart.radius,
      chart.innerRadius,
    )
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = `PieChartArt_slice_${index}_${layout.datum.label}`
    mesh.castShadow = true
    mesh.receiveShadow = true
    chartGroup.add(mesh)

    const labelLayout = labelLayouts[index]
    const labelX = Math.cos(labelLayout.labelAngle) * labelLayout.labelRadius
    const labelZ = -Math.sin(labelLayout.labelAngle) * labelLayout.labelRadius
    const labelSprite = createLabelSprite(layout, labelData, labelOpacity, safeLabelFontSize.value)
    labelSprite.name = `PieChartArt_label_${index}_${layout.datum.label}`
    labelSprite.position.set(labelX, labelLayout.labelY, labelZ)
    chartGroup.add(labelSprite)

    if (labelLayout.pushed) {
      const anchor = new THREE.Vector3(
        Math.cos(layout.midAngle) * Math.max(chart.radius - 0.08, 0.1),
        layout.height + chart.bevel + 0.08,
        -Math.sin(layout.midAngle) * Math.max(chart.radius - 0.08, 0.1),
      )
      const target = new THREE.Vector3(labelX, labelLayout.labelY - 0.25, labelZ)
      const leader = createLeaderLine(anchor, target, 0.68 * labelOpacity)
      leader.name = `PieChartArt_leader_${index}_${layout.datum.label}`
      chartGroup.add(leader)
    }
  })
}

function renderStaticChart() {
  activeLayouts = createSliceLayouts(
    activeData,
    chartOptions.value,
    gradientOptions.value.colorScheme,
  )
  renderChart(activeLayouts, activeData)
}

function applyDataUpdate() {
  if (!mounted) {
    return
  }

  const nextData = parseChartData(props.jsonText, activeData)
  const nextKey = createDataKey(nextData)

  if (nextKey !== activeDataKey) {
    activeData = nextData
    activeDataKey = nextKey
  }

  renderStaticChart()
}

watch(
  () => props.jsonTextChangeNumber,
  () => applyDataUpdate(),
)

watch(
  [
    chartOptions,
    gradientOptions,
    materialOptions,
    safeLabelFontSize,
  ],
  () => {
    if (!mounted) {
      return
    }

    renderStaticChart()
  },
  { deep: true },
)

onMounted(() => {
  mounted = true
  renderStaticChart()
})

onBeforeUnmount(() => {
  clearGroup(chartGroup)
  rootGroup.value.remove(chartGroup)
})
</script>

<template>
  <TresGroup>
    <primitive :object="rootGroup" />
  </TresGroup>
</template>
