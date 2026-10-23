export interface NeonDonutOptions {
  jsonText: string
  jsonTextChangeNumber: number
  radius: number
  innerRatio: number
  height: number
  minHeight: number
  heightByValue: boolean
  gapAngle: number
  startAngle: number
  bevel: number
  opacity: number
  glowIntensity: number
  reflectionStrength: number
  roughness: number
  useDataColors: boolean
  palette: string
  showLabels: boolean
  showSummary: boolean
  labelSize: number
  textColor: string
}

export const NEON_DONUT_DEFAULTS: NeonDonutOptions = {
  jsonText: JSON.stringify({
    title: '总量统计',
    unit: '万',
    items: [
      { id: 'a', name: '综合业务', value: 2350, color: '#f2ee00' },
      { id: 'b', name: '其他业务', value: 1500, color: '#d6e0ed' },
      { id: 'c', name: '线上渠道', value: 950, color: '#b800ff' },
      { id: 'd', name: '线下渠道', value: 700, color: '#00baff' },
      { id: 'e', name: '新兴业务', value: 550, color: '#20ff55' },
    ],
  }, null, 2),
  jsonTextChangeNumber: 0,
  radius: 2.25,
  innerRatio: 0.56,
  height: 1.75,
  minHeight: 0.45,
  heightByValue: true,
  gapAngle: 3,
  startAngle: 155,
  bevel: 0.045,
  opacity: 0.64,
  glowIntensity: 0.5,
  reflectionStrength: 1.2,
  roughness: 0.18,
  useDataColors: true,
  palette: 'neon',
  showLabels: false,
  showSummary: true,
  labelSize: 0.8,
  textColor: '#f0f8ff',
}
