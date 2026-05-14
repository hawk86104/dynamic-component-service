import JSON5 from 'json5'
import {
  COLOR_SCHEMES,
  DEFAULT_CHART_DATA,
  DEFAULT_COLOR_SCHEME,
} from './constants'
import type {
  ChartBuildOptions,
  PieChartData,
  PieColorScheme,
  PieSliceDatum,
  SliceLayout,
} from './types'

const FULL_CIRCLE = Math.PI * 2
const START_ANGLE = -Math.PI / 2

export function clampNumber(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
) {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.min(Math.max(value as number, min), max)
}

export function clampInteger(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
) {
  return Math.round(clampNumber(value, min, max, fallback))
}

function normalizeSlice(item: any, index: number): PieSliceDatum | null {
  const value = Number(item?.value)

  if (!Number.isFinite(value) || value <= 0) {
    return null
  }

  const rawLabel = item?.label ?? item?.name ?? item?.title
  const label = String(rawLabel || `Slice ${index + 1}`).trim()

  return {
    label,
    value,
  }
}

function normalizeChartData(input: any): PieChartData | null {
  const rawSlices = Array.isArray(input)
    ? input
    : Array.isArray(input?.slices)
      ? input.slices
      : Array.isArray(input?.data)
        ? input.data
        : []

  const slices = rawSlices
    .map((item: any, index: number) => normalizeSlice(item, index))
    .filter(Boolean) as PieSliceDatum[]

  if (!slices.length) {
    return null
  }

  return {
    title: String(input?.title || DEFAULT_CHART_DATA.title),
    unit: String(input?.unit ?? DEFAULT_CHART_DATA.unit),
    slices,
  }
}

export function parseChartData(jsonText: string | undefined, fallback = DEFAULT_CHART_DATA) {
  const source = (jsonText ?? '').trim()

  if (!source) {
    return fallback
  }

  try {
    return normalizeChartData(JSON5.parse(source)) ?? fallback
  }
  catch (error) {
    console.warn('[PieChartArt] Invalid chart JSON:', error)
    return fallback
  }
}

export function resolvePalette(colorScheme: string | undefined, count: number) {
  const scheme = (colorScheme || DEFAULT_COLOR_SCHEME) as PieColorScheme
  const colors = COLOR_SCHEMES[scheme] || COLOR_SCHEMES[DEFAULT_COLOR_SCHEME]

  return Array.from({ length: Math.max(count, 1) }, (_, index) => {
    const base = colors[index % colors.length]
    const cycle = Math.floor(index / colors.length)

    if (cycle === 0) {
      return base
    }

    const target = ['#ffffff', '#111827', '#64748b'][cycle % 3]
    const amount = 0.1 + ((cycle * 0.137) % 0.32)

    return {
      accent: lerpHex(base.accent, target, amount * 0.6),
      bottom: lerpHex(base.bottom, target, amount * 0.55),
      solid: lerpHex(base.solid, target, amount),
      top: lerpHex(base.top, target, amount * 0.75),
    }
  })
}

export function createSliceLayouts(
  chartData: PieChartData,
  chart: ChartBuildOptions,
  colorScheme: string | undefined,
) {
  const total = chartData.slices.reduce((sum, datum) => sum + datum.value, 0)
  const maxValue = Math.max(...chartData.slices.map(datum => datum.value), 0.0001)
  const palettes = resolvePalette(colorScheme, chartData.slices.length)
  const layouts: SliceLayout[] = []
  let angle = START_ANGLE

  chartData.slices.forEach((datum, index) => {
    // Values are weights, not required percentages. The full pie is always
    // normalized by the current total, so totals below or above 100 still fill 360 degrees.
    const sliceAngle = (datum.value / total) * FULL_CIRCLE
    const startAngle = angle
    const endAngle = angle + sliceAngle
    const heightRatio = datum.value / maxValue
    const height = chart.height * (0.3 + heightRatio * 0.7)

    layouts.push({
      datum,
      endAngle,
      height,
      index,
      midAngle: (startAngle + endAngle) / 2,
      palette: palettes[index],
      startAngle,
      value: datum.value,
    })

    angle = endAngle
  })

  return layouts
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function hexToRgb(color: string) {
  const hex = color.replace('#', '')
  const normalized = hex.length === 3
    ? hex.split('').map(char => char + char).join('')
    : hex.padEnd(6, '0').slice(0, 6)

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ]
}

function rgbToHex(rgb: number[]) {
  return `#${rgb
    .map(value => Math.round(Math.min(Math.max(value, 0), 255)).toString(16).padStart(2, '0'))
    .join('')}`
}

function lerpHex(from: string, to: string, t: number) {
  const a = hexToRgb(from)
  const b = hexToRgb(to)

  return rgbToHex([
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
  ])
}
