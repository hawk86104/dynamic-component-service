<script setup lang="ts">
import type { AreaData } from '../chart3d/data'
import type { RibbonAreaOptions } from './defaults'
import * as THREE from 'three'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import fragmentShader from '../../shader/ribbonAreaChartComponent/chart.frag?raw'
import vertexShader from '../../shader/ribbonAreaChartComponent/chart.vert?raw'
import { bounded, parseAreaData, sampleArea } from '../chart3d/data'
import { addLine, addStage, addTube, clearChart, createLabel, roundedRectangle } from '../chart3d/scene'
import { RIBBON_AREA_DEFAULTS } from './defaults'
import { createRibbonGeometry } from './geometry'

const props = withDefaults(defineProps<Partial<RibbonAreaOptions>>(), RIBBON_AREA_DEFAULTS)
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
  const ribbonWidth = bounded(props.ribbonWidth, 0.1, 3, 0.85)
  const gap = bounded(props.seriesGap, 0.05, 3, 0.55)
  const depth = chart.series.length * ribbonWidth + (chart.series.length - 1) * gap
  const maxValue = Math.max(0, ...chart.series.flatMap(series => series.values))
  const scaleMax = Math.max(maxValue, bounded(props.yMax, 0, 1e12, 0)) || 1
  const opacity = bounded(props.opacity, 0.1, 1, 0.78)
  const glow = bounded(props.glowIntensity, 0, 3, 0.7)
  const outlineWidth = bounded(props.outlineWidth, 0.002, 0.08, 0.016)
  const labelSize = bounded(props.labelSize, 0.25, 2, 0.85)
  const sampleCount = Math.round(bounded(props.curveSegments, 1, 32, 16))
  const categoryDomain = Math.max(1, chart.categories.length - 1)
  const backZ = -depth / 2 - 0.4
  addStage(group, {
    width: width + 0.6,
    depth: depth + 1,
    baseColor: props.baseColor,
    gridColor: props.gridColor,
    showBase: props.showBase,
    showGrid: props.showGrid,
  })
  if (props.showBackPanel) {
    const panel = new THREE.Mesh(
      new THREE.ShapeGeometry(roundedRectangle(width + 0.6, height + 0.6, 0.2), 12),
      new THREE.MeshBasicMaterial({ color: props.gridColor, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }),
    )
    panel.position.set(0, (height + 0.6) / 2 + 0.2, backZ)
    panel.name = 'ChartGlassBackPanel'
    group.add(panel)
    for (let tick = 0; tick <= 4; tick++) {
      const y = 0.24 + height * tick / 4
      addLine(group, [new THREE.Vector3(-width / 2, y, backZ + 0.005), new THREE.Vector3(width / 2, y, backZ + 0.005)], props.gridColor, 0.32)
    }
  }
  chart.series.forEach((series, index) => {
    const colors = props.useDataColors && series.colors ? series.colors : [props.colorStart, props.colorMiddle, props.colorEnd]
    const z = (index - (chart.series.length - 1) / 2) * (ribbonWidth + gap)
    const points = sampleArea(series.values, sampleCount, props.smooth).map(point => ({
      x: (point.x / categoryDomain - 0.5) * width,
      y: point.y / scaleMax * height,
    }))
    const mesh = new THREE.Mesh(createRibbonGeometry(points, ribbonWidth), new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uWidth: { value: width },
        uHeight: { value: height },
        uStart: { value: new THREE.Color(colors[0]) },
        uMiddle: { value: new THREE.Color(colors[1]) },
        uEnd: { value: new THREE.Color(colors[2]) },
        uOpacity: { value: opacity },
        uGlow: { value: glow },
      },
      transparent: opacity < 1,
      depthWrite: opacity >= 1,
      toneMapped: false,
    }))
    mesh.position.set(0, 0.24, z)
    mesh.name = `AreaRibbon_${series.id}`
    mesh.userData.chartSeries = series
    group.add(mesh)
    for (const sign of [-1, 1]) {
      const edge = points.map(point => new THREE.Vector3(point.x, Math.max(0.012, point.y) + 0.245, z + sign * ribbonWidth / 2))
      addTube(group, edge, sign === 1 ? '#d7fbff' : colors[1], outlineWidth, glow)
    }
    if (props.showLabels) {
      const peak = Math.max(...series.values)
      const peakIndex = series.values.indexOf(peak)
      const x = chart.categories.length === 1 ? 0 : (peakIndex / categoryDomain - 0.5) * width
      const label = createLabel(series.name, `${peak.toFixed(2)} ${chart.unit}`, props.textColor, labelSize)
      label.position.set(x, peak / scaleMax * height + 0.72, z)
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
      label.position.set(chart.categories.length === 1 ? 0 : (index / categoryDomain - 0.5) * width, 0.23, depth / 2 + 0.52)
      group.add(label)
    })
    for (let tick = 0; tick <= 4; tick++) {
      const label = createLabel((scaleMax * tick / 4).toLocaleString('en-US', { maximumFractionDigits: 1 }), '', props.textColor, labelSize * 0.5)
      label.position.set(-width / 2 - 0.35, 0.24 + height * tick / 4, backZ + 0.02)
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
