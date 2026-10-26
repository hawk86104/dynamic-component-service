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
  bevel: number
  opacity: number
  glowIntensity: number
  reflectionStrength: number
  roughness: number
  sideColor: string
  sideGradient: number
  sideOpacity: number
  outlineWidth: number
  useDataColors: boolean
  colorStart: string
  colorMiddle: string
  colorEnd: string
  showLabels: boolean
  showAxes: boolean
  labelSize: number
  textColor: string
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
  ribbonWidth: 1.05,
  seriesGap: 0.4,
  yMax: 0,
  smooth: true,
  curveSegments: 24,
  bevel: 0.055,
  opacity: 0.88,
  glowIntensity: 0.55,
  reflectionStrength: 1.35,
  roughness: 0.24,
  sideColor: '#293c78',
  sideGradient: 0.9,
  sideOpacity: 0.64,
  outlineWidth: 0.012,
  useDataColors: true,
  colorStart: '#008cff',
  colorMiddle: '#36e5df',
  colorEnd: '#d2ee29',
  showLabels: true,
  showAxes: false,
  labelSize: 0.85,
  textColor: '#ecf7ff',
}

// Declare runtime props explicitly so imported-type HMR caches cannot drop controls.
export const RIBBON_AREA_PROPS = {
  jsonText: { type: String, default: RIBBON_AREA_DEFAULTS.jsonText },
  jsonTextChangeNumber: { type: Number, default: RIBBON_AREA_DEFAULTS.jsonTextChangeNumber },
  width: { type: Number, default: RIBBON_AREA_DEFAULTS.width },
  height: { type: Number, default: RIBBON_AREA_DEFAULTS.height },
  ribbonWidth: { type: Number, default: RIBBON_AREA_DEFAULTS.ribbonWidth },
  seriesGap: { type: Number, default: RIBBON_AREA_DEFAULTS.seriesGap },
  yMax: { type: Number, default: RIBBON_AREA_DEFAULTS.yMax },
  smooth: { type: Boolean, default: RIBBON_AREA_DEFAULTS.smooth },
  curveSegments: { type: Number, default: RIBBON_AREA_DEFAULTS.curveSegments },
  bevel: { type: Number, default: RIBBON_AREA_DEFAULTS.bevel },
  opacity: { type: Number, default: RIBBON_AREA_DEFAULTS.opacity },
  glowIntensity: { type: Number, default: RIBBON_AREA_DEFAULTS.glowIntensity },
  reflectionStrength: { type: Number, default: RIBBON_AREA_DEFAULTS.reflectionStrength },
  roughness: { type: Number, default: RIBBON_AREA_DEFAULTS.roughness },
  sideColor: { type: String, default: RIBBON_AREA_DEFAULTS.sideColor },
  sideGradient: { type: Number, default: RIBBON_AREA_DEFAULTS.sideGradient },
  sideOpacity: { type: Number, default: RIBBON_AREA_DEFAULTS.sideOpacity },
  outlineWidth: { type: Number, default: RIBBON_AREA_DEFAULTS.outlineWidth },
  useDataColors: { type: Boolean, default: RIBBON_AREA_DEFAULTS.useDataColors },
  colorStart: { type: String, default: RIBBON_AREA_DEFAULTS.colorStart },
  colorMiddle: { type: String, default: RIBBON_AREA_DEFAULTS.colorMiddle },
  colorEnd: { type: String, default: RIBBON_AREA_DEFAULTS.colorEnd },
  showLabels: { type: Boolean, default: RIBBON_AREA_DEFAULTS.showLabels },
  showAxes: { type: Boolean, default: RIBBON_AREA_DEFAULTS.showAxes },
  labelSize: { type: Number, default: RIBBON_AREA_DEFAULTS.labelSize },
  textColor: { type: String, default: RIBBON_AREA_DEFAULTS.textColor },
}
