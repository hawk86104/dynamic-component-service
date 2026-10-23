export interface RibbonAreaOptions {
  jsonText: string
  jsonTextChangeNumber: number
  width: number
  height: number
  ribbonWidth: number
  seriesGap: number
  yMax: number
  smooth: boolean
  curveSegments: number
  opacity: number
  glowIntensity: number
  outlineWidth: number
  useDataColors: boolean
  colorStart: string
  colorMiddle: string
  colorEnd: string
  showLabels: boolean
  showAxes: boolean
  labelSize: number
  textColor: string
  showBase: boolean
  showGrid: boolean
  showBackPanel: boolean
  baseColor: string
  gridColor: string
}

export const RIBBON_AREA_DEFAULTS: RibbonAreaOptions = {
  jsonText: JSON.stringify({
    title: '业务增长趋势',
    unit: '万元',
    categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
    series: [
      { id: 'online', name: '线上业务', values: [45, 105, 90, 220, 205, 350], colors: ['#008cff', '#32e9dc', '#d2ee29'] },
      { id: 'offline', name: '线下业务', values: [28, 85, 165, 145, 322, 280], colors: ['#098aff', '#bb9efc', '#ff826f'] },
    ],
  }, null, 2),
  jsonTextChangeNumber: 0,
  width: 5,
  height: 2.8,
  ribbonWidth: 0.85,
  seriesGap: 0.55,
  yMax: 0,
  smooth: true,
  curveSegments: 16,
  opacity: 0.78,
  glowIntensity: 0.7,
  outlineWidth: 0.016,
  useDataColors: true,
  colorStart: '#008cff',
  colorMiddle: '#36e5df',
  colorEnd: '#d2ee29',
  showLabels: true,
  showAxes: true,
  labelSize: 0.85,
  textColor: '#ecf7ff',
  showBase: true,
  showGrid: true,
  showBackPanel: true,
  baseColor: '#101d2e',
  gridColor: '#35576a',
}
