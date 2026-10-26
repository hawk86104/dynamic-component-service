<script setup lang="ts">
import type { AreaData } from '../chart3d/data'
import type { RibbonAppearance } from './appearance'
import * as THREE from 'three'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { bounded, parseAreaData, sampleArea } from '../chart3d/data'
import { clearChart, createLabel } from '../chart3d/scene'
import { addRibbonHighlights, createRibbonMaterial } from './appearance'
import { RIBBON_AREA_DEFAULTS, RIBBON_AREA_PROPS } from './defaults'
import { createRibbonGeometry } from './geometry'

const props = defineProps(RIBBON_AREA_PROPS)
const emit = defineEmits<{ dataError: [message: string] }>()
const root = shallowRef(new THREE.Group())
root.value.name = 'RibbonAreaChart'
const data = shallowRef<AreaData>(parseAreaData(RIBBON_AREA_DEFAULTS.jsonText))
const dataError = ref('')
let mounted = false

watch([() => props.jsonText, () => props.jsonTextChangeNumber], () => {
  try {
    data.value = parseAreaData(props.jsonText)
    if (dataError.value) {
      dataError.value = ''
      emit('dataError', '')
    }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : '面积图数据无效'
    if (message !== dataError.value) {
      dataError.value = message
      emit('dataError', message)
    }
  }
}, { immediate: true })

function rebuild() {
  if (!mounted) {
    return
  }
  const group = root.value
  clearChart(group)
  const chart = data.value
  const width = bounded(props.width, 1, 16, 5)
  const height = bounded(props.height, 0.3, 10, 2.8)
  const ribbonWidth = bounded(props.ribbonWidth, 0.1, 3, RIBBON_AREA_DEFAULTS.ribbonWidth)
  const gap = bounded(props.seriesGap, 0.05, 3, RIBBON_AREA_DEFAULTS.seriesGap)
  const depth = chart.series.length * ribbonWidth + (chart.series.length - 1) * gap
  const maxValue = Math.max(0, ...chart.series.flatMap(series => series.values))
  const scaleMax = Math.max(maxValue, bounded(props.yMax, 0, 1e12, 0)) || 1
  const appearance: RibbonAppearance = {
    width,
    height,
    ribbonWidth,
    bevel: bounded(props.bevel, 0, 0.15, RIBBON_AREA_DEFAULTS.bevel),
    opacity: bounded(props.opacity, 0.1, 1, RIBBON_AREA_DEFAULTS.opacity),
    glowIntensity: bounded(props.glowIntensity, 0, 3, RIBBON_AREA_DEFAULTS.glowIntensity),
    reflectionStrength: bounded(props.reflectionStrength, 0, 3, RIBBON_AREA_DEFAULTS.reflectionStrength),
    roughness: bounded(props.roughness, 0, 1, RIBBON_AREA_DEFAULTS.roughness),
    sideColor: props.sideColor,
    sideGradient: bounded(props.sideGradient, 0, 1, RIBBON_AREA_DEFAULTS.sideGradient),
    sideOpacity: bounded(props.sideOpacity, 0, 1, RIBBON_AREA_DEFAULTS.sideOpacity),
    outlineWidth: bounded(props.outlineWidth, 0.002, 0.08, RIBBON_AREA_DEFAULTS.outlineWidth),
  }
  const labelSize = bounded(props.labelSize, 0.25, 2, 0.85)
  const sampleCount = Math.round(bounded(props.curveSegments, 1, 32, RIBBON_AREA_DEFAULTS.curveSegments))
  const categoryDomain = Math.max(1, chart.categories.length - 1)
  const backZ = -depth / 2 - 0.4
  chart.series.forEach((series, index) => {
    const colors = props.useDataColors && series.colors ? series.colors : [props.colorStart, props.colorMiddle, props.colorEnd]
    const z = (index - (chart.series.length - 1) / 2) * (ribbonWidth + gap)
    const points = sampleArea(series.values, sampleCount, props.smooth).map(point => ({
      x: (point.x / categoryDomain - 0.5) * width,
      y: point.y / scaleMax * height,
    }))
    const geometry = createRibbonGeometry(points, ribbonWidth, appearance.bevel, props.smooth, {
      gradient: appearance.sideGradient,
      opaque: appearance.opacity >= 1 && appearance.sideOpacity >= 1,
    })
    const mesh = new THREE.Mesh(geometry, createRibbonMaterial(appearance, colors))
    mesh.name = `AreaRibbon_${series.id}`
    mesh.userData.chartSeries = series
    const ribbon = new THREE.Group()
    ribbon.position.z = z
    ribbon.add(mesh)
    addRibbonHighlights(ribbon, points, appearance, colors)
    group.add(ribbon)
    if (props.showLabels) {
      const peak = Math.max(...series.values)
      const peakIndex = series.values.indexOf(peak)
      const x = chart.categories.length === 1 ? 0 : (peakIndex / categoryDomain - 0.5) * width
      const label = createLabel(series.name, `${peak.toFixed(2)} ${chart.unit}`, props.textColor, labelSize)
      label.position.set(x, peak / scaleMax * height + 0.48, z)
      group.add(label)
    }
  })
  if (props.showAxes) {
    const step = Math.max(1, Math.ceil(chart.categories.length / 7))
    chart.categories.forEach((category, index) => {
      if (index % step && index !== chart.categories.length - 1) {
        return
      }
      const label = createLabel(category, '', props.textColor, labelSize * 0.62)
      label.position.set(chart.categories.length === 1 ? 0 : (index / categoryDomain - 0.5) * width, 0.03, depth / 2 + 0.52)
      group.add(label)
    })
    for (let tick = 0; tick <= 4; tick++) {
      const label = createLabel((scaleMax * tick / 4).toLocaleString('en-US', { maximumFractionDigits: 1 }), '', props.textColor, labelSize * 0.5)
      label.position.set(-width / 2 - 0.35, height * tick / 4, backZ + 0.02)
      group.add(label)
    }
    const title = createLabel(`${chart.title}${chart.unit ? ` / ${chart.unit}` : ''}`, '', props.textColor, labelSize * 1.8)
    title.position.set(0, height + 1, backZ)
    group.add(title)
  }
}

watch([data, () => ({ ...props })], rebuild)
onMounted(() => {
  mounted = true
  rebuild()
})
onBeforeUnmount(() => {
  mounted = false
  clearChart(root.value)
})
defineExpose({ dataError })
</script>

<template>
  <TresGroup>
    <primitive :object="root" />
  </TresGroup>
</template>
