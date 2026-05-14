export type GradientDirection = 'vertical' | 'radial' | 'angular'

export type PieColorScheme =
  | 'marketNeon'
  | 'aurora'
  | 'sunset'
  | 'jewel'
  | 'candy'

export interface PieSliceDatum {
  label: string
  value: number
}

export interface PieChartData {
  title: string
  unit: string
  slices: PieSliceDatum[]
}

export interface SlicePalette {
  top: string
  bottom: string
  accent: string
  solid: string
}

export interface SliceLayout {
  datum: PieSliceDatum
  index: number
  startAngle: number
  endAngle: number
  midAngle: number
  height: number
  palette: SlicePalette
  value: number
}

export interface ChartBuildOptions {
  bevel: number
  bevelSegments: number
  creaseAngle: number
  gap: number
  height: number
  innerRadius: number
  radius: number
  sideSegments: number
  smoothShading: boolean
}

export interface GradientOptions {
  colorScheme: PieColorScheme
  direction: GradientDirection
  fromY: number
  toY: number
  curve: number
}

export interface MaterialOptions {
  envMapIntensity: number
  metalness: number
  roughness: number
}
