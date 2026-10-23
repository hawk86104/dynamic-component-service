<script setup lang="ts">
import type { DonutData } from '../chart3d/data'
import type { NeonDonutOptions } from './defaults'
import * as THREE from 'three'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import fragmentShader from '../../shader/neonDonutChartComponent/chart.frag?raw'
import vertexShader from '../../shader/neonDonutChartComponent/chart.vert?raw'
import { bounded, parseDonutData } from '../chart3d/data'
import { addLine, addStage, clearChart, createLabel } from '../chart3d/scene'
import { NEON_DONUT_DEFAULTS } from './defaults'
import { createDonutSector, sectorOutline } from './geometry'

const props = withDefaults(defineProps<Partial<NeonDonutOptions>>(), NEON_DONUT_DEFAULTS)
const emit = defineEmits<{ dataError: [message: string] }>()
const root = shallowRef(new THREE.Group())
root.value.name = 'NeonDonutChart'
const data = shallowRef<DonutData>(parseDonutData(NEON_DONUT_DEFAULTS.jsonText))
const dataError = ref('')
let mounted = false

const palettes: Record<string, string[]> = {
  neon: ['#f2ee00', '#d6e0ed', '#b800ff', '#00baff', '#20ff55'],
  ocean: ['#18e5df', '#2ca8ff', '#5d68ff', '#a3dfff', '#36f5a7'],
  sunset: ['#ffcb3d', '#ff825d', '#f34a93', '#ab67ff', '#ffe5b4'],
}

watch([() => props.jsonText, () => props.jsonTextChangeNumber], () => {
  try {
    data.value = parseDonutData(props.jsonText)
    if (dataError.value) {
      dataError.value = ''
      emit('dataError', '')
    }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : '环图数据无效'
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
  const radius = bounded(props.radius, 0.5, 8, 2.25)
  const inner = radius * bounded(props.innerRatio, 0.15, 0.85, 0.56)
  const height = bounded(props.height, 0.1, 8, 1.75)
  const minHeight = bounded(props.minHeight, 0.05, height, 0.45)
  const opacity = bounded(props.opacity, 0.1, 1, 0.82)
  const glow = bounded(props.glowIntensity, 0, 3, 0.65)
  const labelSize = bounded(props.labelSize, 0.3, 2, 0.8)
  const palette = palettes[props.palette] || palettes.neon
  const items = data.value.items.filter(item => item.value > 0)
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const maximum = Math.max(...items.map(item => item.value))
  const rows = items.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: props.useDataColors && item.color ? item.color : palette[index % palette.length],
  }))
  addStage(group, {
    width: (radius + 0.3) * 2,
    depth: (radius + 0.3) * 2,
    baseColor: props.baseColor,
    gridColor: props.gridColor,
    showBase: props.showBase,
    showGrid: props.showGrid,
    round: true,
  })
  let cursor = THREE.MathUtils.degToRad(bounded(props.startAngle, -360, 360, 155))
  items.forEach((item, index) => {
    const span = item.value / total * Math.PI * 2
    const gap = Math.min(THREE.MathUtils.degToRad(bounded(props.gapAngle, 0, 15, 3)), span * 0.35)
    const start = cursor + gap / 2
    const end = cursor + span - gap / 2
    const middle = cursor + span / 2
    cursor += span
    if (span < 0.00001) {
      return
    }
    const sectorHeight = item.height ?? (props.heightByValue ? minHeight + (height - minHeight) * item.value / maximum : height)
    const bevel = Math.min(bounded(props.bevel, 0, 0.2, 0.045), gap * inner * 0.25)
    const { geometry, top } = createDonutSector(inner, radius, sectorHeight, start, end, bevel)
    const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(rows[index].color) },
        uHeight: { value: top },
        uOpacity: { value: opacity },
        uGlow: { value: glow },
      },
      transparent: opacity < 1,
      depthWrite: opacity >= 1,
      toneMapped: false,
    }))
    mesh.position.y = 0.24
    mesh.name = `DonutSector_${item.id}`
    mesh.userData.chartItem = { ...item, percentage: item.value / total * 100 }
    group.add(mesh)
    const highlight = `#${new THREE.Color(rows[index].color).lerp(new THREE.Color('#ffffff'), 0.36).getHexString()}`
    addLine(group, sectorOutline(inner, radius, top + 0.245, start, end), highlight, Math.min(1, 0.3 + glow), true)
    const anchor = new THREE.Vector3(Math.cos(middle) * (inner + radius) / 2, top + 0.3, -Math.sin(middle) * (inner + radius) / 2)
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, toneMapped: false }))
    marker.position.copy(anchor)
    group.add(marker)
    if (props.showLabels) {
      const label = createLabel(item.name, `${(item.value / total * 100).toFixed(1)}%`, props.textColor, labelSize)
      label.position.set(Math.cos(middle) * (radius + 0.6), top + 0.65, -Math.sin(middle) * (radius + 0.6))
      addLine(group, [anchor, label.position.clone().add(new THREE.Vector3(0, -0.15, 0))], highlight, 0.5)
      group.add(label)
    }
  })
  if (props.showSummary) {
    const summaryRows = rows.slice(0, 5)
    if (rows.length > 5) {
      summaryRows.push({ name: '其余分类', value: rows.slice(5).reduce((sum, row) => sum + row.value, 0), color: '#9caec0' })
    }
    const summary = createLabel(data.value.title, `${total.toLocaleString('en-US')} ${data.value.unit}`, props.textColor, labelSize * 1.65, summaryRows)
    summary.position.set(radius + 0.65, height * 0.75 + 0.45, -radius * 0.35)
    group.add(summary)
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
