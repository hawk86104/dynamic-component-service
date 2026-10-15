export type IsoGlowPreset = 'iso-glow' | 'blueprint' | 'x-ray'

export interface IsoGlowStyle {
  enabled: boolean
  stylePreset: IsoGlowPreset
  surfaceColor: string
  surfaceOpacity: number
  showEdges: boolean
  edgeColor: string
  edgeOpacity: number
  edgeThreshold: number
  emissiveColor: string
  emissiveIntensity: number
}

export interface IsoGlowOptions extends IsoGlowStyle {
  modelUrl: string
}

export const ISO_GLOW_DEFAULTS: IsoGlowOptions = {
  modelUrl: 'https://opensource.cdn.icegl.cn/model/industry4/MRBike.glb',
  enabled: true,
  stylePreset: 'iso-glow',
  showEdges: true,
  edgeThreshold: 35,
  surfaceColor: '#1b1d20',
  surfaceOpacity: 1,
  edgeColor: '#6e7681',
  edgeOpacity: 0.85,
  emissiveColor: '#ff9d3c',
  emissiveIntensity: 1.25,
}

function bounded(value: number | undefined, min: number, max: number, fallback: number) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value as number)) : fallback
}

/** Presets select rendering behavior; all editable values share one default set. */
export function resolveIsoGlowStyle(options: Partial<IsoGlowStyle>): IsoGlowStyle {
  const stylePreset = options.stylePreset === 'blueprint' || options.stylePreset === 'x-ray'
    ? options.stylePreset
    : ISO_GLOW_DEFAULTS.stylePreset
  return {
    enabled: options.enabled ?? ISO_GLOW_DEFAULTS.enabled,
    stylePreset,
    showEdges: options.showEdges ?? ISO_GLOW_DEFAULTS.showEdges,
    edgeThreshold: bounded(options.edgeThreshold, 0, 180, ISO_GLOW_DEFAULTS.edgeThreshold),
    surfaceColor: options.surfaceColor?.trim() || ISO_GLOW_DEFAULTS.surfaceColor,
    surfaceOpacity: bounded(options.surfaceOpacity, 0, 1, ISO_GLOW_DEFAULTS.surfaceOpacity),
    edgeColor: options.edgeColor?.trim() || ISO_GLOW_DEFAULTS.edgeColor,
    edgeOpacity: bounded(options.edgeOpacity, 0, 1, ISO_GLOW_DEFAULTS.edgeOpacity),
    emissiveColor: options.emissiveColor?.trim() || ISO_GLOW_DEFAULTS.emissiveColor,
    emissiveIntensity: bounded(options.emissiveIntensity, 0, 10, ISO_GLOW_DEFAULTS.emissiveIntensity),
  }
}
