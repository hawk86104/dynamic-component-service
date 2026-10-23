import JSON5 from 'json5'

export interface DonutItem {
  id: string
  name: string
  value: number
  color?: string
  height?: number
}

export interface DonutData {
  title: string
  unit: string
  items: DonutItem[]
}

export interface AreaSeries {
  id: string
  name: string
  values: number[]
  colors?: [string, string, string]
}

export interface AreaData {
  title: string
  unit: string
  categories: string[]
  series: AreaSeries[]
}

export interface ChartPoint {
  x: number
  y: number
}

export function bounded(value: number, min: number, max: number, fallback: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : fallback))
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field} 必须为对象`)
  }
  return value as Record<string, unknown>
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, 80) : fallback
}

function number(value: unknown, field: string) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1e12) {
    throw new Error(`${field} 必须为 0 至 1e12 的有限数值`)
  }
  return value
}

function color(value: unknown, field: string) {
  if (value === undefined) {
    return undefined
  }
  if (typeof value !== 'string' || !/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value)) {
    throw new Error(`${field} 必须为 #RGB 或 #RRGGBB 颜色`)
  }
  return value
}

function uniqueIds(items: { id: string }[]) {
  if (new Set(items.map(item => item.id)).size !== items.length) {
    throw new Error('id 不得重复')
  }
}

export function parseDonutData(jsonText: string): DonutData {
  const input = record(JSON5.parse(jsonText), '根节点')
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 32) {
    throw new Error('items 必须包含 1 至 32 项')
  }
  const items = input.items.map((entry, index): DonutItem => {
    const item = record(entry, `items[${index}]`)
    const height = item.height === undefined ? undefined : number(item.height, 'height')
    if (height !== undefined && (height < 0.05 || height > 12)) {
      throw new Error('height 必须为 0.05 至 12 的世界单位高度')
    }
    return {
      id: text(item.id, `item-${index}`) || `item-${index}`,
      name: text(item.name, `分类 ${index + 1}`),
      value: number(item.value, `items[${index}].value`),
      color: color(item.color, `items[${index}].color`),
      height,
    }
  })
  uniqueIds(items)
  if (!items.some(item => item.value > 0)) {
    throw new Error('环图至少需要一个大于零的值')
  }
  return { title: text(input.title, '总量统计'), unit: text(input.unit), items }
}

export function parseAreaData(jsonText: string): AreaData {
  const input = record(JSON5.parse(jsonText), '根节点')
  if (!Array.isArray(input.categories) || !input.categories.length || input.categories.length > 128) {
    throw new Error('categories 必须包含 1 至 128 个分类')
  }
  const categories = input.categories.map((entry, index) => {
    if (typeof entry !== 'string' || !entry.trim()) {
      throw new Error(`categories[${index}] 必须为非空字符串`)
    }
    return entry.trim().slice(0, 80)
  })
  if (!Array.isArray(input.series) || !input.series.length || input.series.length > 8) {
    throw new Error('series 必须包含 1 至 8 条序列')
  }
  const series = input.series.map((entry, index): AreaSeries => {
    const item = record(entry, `series[${index}]`)
    if (!Array.isArray(item.values) || item.values.length !== categories.length) {
      throw new Error(`series[${index}].values 长度必须与 categories 一致`)
    }
    let colors: AreaSeries['colors']
    if (item.colors !== undefined) {
      if (!Array.isArray(item.colors) || item.colors.length !== 3) {
        throw new Error(`series[${index}].colors 必须为三种颜色`)
      }
      colors = item.colors.map((entry, stop) => {
        const result = color(entry, `series[${index}].colors[${stop}]`)
        if (!result) {
          throw new Error('渐变色不可为空')
        }
        return result
      }) as AreaSeries['colors']
    }
    return {
      id: text(item.id, `series-${index}`) || `series-${index}`,
      name: text(item.name, `序列 ${index + 1}`),
      values: item.values.map((entry, point) => number(entry, `series[${index}].values[${point}]`)),
      colors,
    }
  })
  uniqueIds(series)
  return { title: text(input.title, '增长趋势'), unit: text(input.unit), categories, series }
}

/** Equally spaced monotone cubic Hermite interpolation; never overshoots samples. */
export function sampleArea(values: number[], subdivisions = 12, smooth = true): ChartPoint[] {
  if (values.length === 1) {
    return [{ x: 0, y: values[0] }, { x: 1, y: values[0] }]
  }
  if (!values.length) {
    return []
  }
  const steps = Math.round(bounded(subdivisions, 1, 32, 12))
  const slopes = values.slice(1).map((value, index) => value - values[index])
  const tangents = values.map((_, index) => {
    if (index === 0) {
      return slopes[0]
    }
    if (index === values.length - 1) {
      return slopes[index - 1]
    }
    const left = slopes[index - 1]
    const right = slopes[index]
    return left * right <= 0 ? 0 : (2 * left * right) / (left + right)
  })
  const points: ChartPoint[] = []
  for (let index = 0; index < slopes.length; index++) {
    for (let step = 0; step < steps; step++) {
      const t = step / steps
      const t2 = t * t
      const t3 = t2 * t
      const y = smooth
        ? (2 * t3 - 3 * t2 + 1) * values[index]
        + (t3 - 2 * t2 + t) * tangents[index]
        + (-2 * t3 + 3 * t2) * values[index + 1]
        + (t3 - t2) * tangents[index + 1]
        : values[index] + slopes[index] * t
      // Guard against floating-point roundoff at plateaus and at zero.
      points.push({ x: index + t, y: Math.min(Math.max(values[index], values[index + 1]), Math.max(Math.min(values[index], values[index + 1]), y)) })
    }
  }
  points.push({ x: values.length - 1, y: values[values.length - 1] })
  return points
}
