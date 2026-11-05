export interface DivineFireProps {
  modelUrl?: string
  modelSize?: number
  showSource?: boolean
  burning?: boolean
  leadIn?: number
  leadOut?: number
  autoPlay?: boolean
  animationSpeed?: number
  height?: number
  inflate?: number
  tongueScale?: number
  tongueSpeed?: number
  tongueVariation?: number
  erosion?: number
  softness?: number
  fresnelPower?: number
  textureScale?: number
  scrollSpeed?: number
  distortion?: number
  distortionSpeed?: number
  brightness?: number
  colorCore?: string
  colorMid?: string
  colorDeep?: string
}

export const DIVINE_FIRE_DEFAULTS: Required<DivineFireProps> = {
  modelUrl: '',
  modelSize: 1.6,
  showSource: true,
  burning: true,
  leadIn: 1.2,
  leadOut: 1.5,
  autoPlay: true,
  animationSpeed: 1,
  height: 0.55,
  inflate: 0.012,
  tongueScale: 3,
  tongueSpeed: 0.9,
  tongueVariation: 0.65,
  erosion: 0.95,
  softness: 0.3,
  fresnelPower: 1.2,
  textureScale: 3,
  scrollSpeed: 0.9,
  distortion: 0.35,
  distortionSpeed: 0.4,
  brightness: 1.8,
  colorCore: '#fff1b8',
  colorMid: '#ff7a1a',
  colorDeep: '#8a1400',
}

export const DIVINE_FIRE_LIMITS = {
  modelSize: [0.1, 20],
  leadIn: [0, 5],
  leadOut: [0, 5],
  animationSpeed: [0, 4],
  height: [0, 2],
  inflate: [0, 0.1],
  tongueScale: [0, 10],
  tongueSpeed: [0, 4],
  tongueVariation: [0, 1],
  erosion: [0, 2],
  softness: [0.01, 1],
  fresnelPower: [0, 5],
  textureScale: [0.2, 10],
  scrollSpeed: [0, 4],
  distortion: [0, 1.5],
  distortionSpeed: [0, 2],
  brightness: [0, 6],
} as const

export type DivineFireSettings = typeof DIVINE_FIRE_DEFAULTS

export function resolveDivineFireSettings(props: DivineFireProps): DivineFireSettings {
  const settings = { ...DIVINE_FIRE_DEFAULTS }
  for (const key of Object.keys(DIVINE_FIRE_LIMITS) as Array<keyof typeof DIVINE_FIRE_LIMITS>) {
    const [min, max] = DIVINE_FIRE_LIMITS[key]
    const value = props[key]
    settings[key] = typeof value === 'number' && Number.isFinite(value)
      ? Math.min(max, Math.max(min, value))
      : DIVINE_FIRE_DEFAULTS[key]
  }
  for (const key of ['showSource', 'burning', 'autoPlay'] as const) {
    settings[key] = props[key] ?? DIVINE_FIRE_DEFAULTS[key]
  }
  for (const key of ['colorCore', 'colorMid', 'colorDeep'] as const) {
    settings[key] = props[key]?.trim() || DIVINE_FIRE_DEFAULTS[key]
  }
  settings.modelUrl = props.modelUrl?.trim() || ''
  return settings
}
