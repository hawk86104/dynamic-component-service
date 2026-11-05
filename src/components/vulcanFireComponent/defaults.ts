import { MathUtils } from 'three'

export const MAX_VULCAN_PARTICLES = 64

export interface VulcanFireProps {
  autoPlay?: boolean
  animationSpeed?: number
  fireCount?: number
  playbackSpeed?: number
  sizeMin?: number
  sizeMax?: number
  riseSpeed?: number
  emitterRadius?: number
  bindStrength?: number
  decaySpeed?: number
  intensity?: number
  colorLow?: string
  colorMid?: string
  colorHigh?: string
  additiveBlending?: boolean
  smokeEnabled?: boolean
  smokeCount?: number
  smokeOpacity?: number
  smokeRiseSpeed?: number
  smokeGrowth?: number
  smokeColor?: string
  volumeSize?: number
  volumeFrames?: number
  volumeOctaves?: number
  volumeFrequency?: number
  turbulence?: number
  flameWidth?: number
  seed?: number
  glowEnabled?: boolean
  glowIntensity?: number
  groundVisible?: boolean
  groundRadius?: number
  lightEnabled?: boolean
  lightIntensity?: number
}

export type VulcanFireSettings = Required<VulcanFireProps>

export const VULCAN_FIRE_DEFAULTS: VulcanFireSettings = {
  autoPlay: true,
  animationSpeed: 1,
  fireCount: 24,
  playbackSpeed: 0.6,
  sizeMin: 0.8,
  sizeMax: 1.6,
  riseSpeed: 0.8,
  emitterRadius: 0.35,
  bindStrength: 2,
  decaySpeed: 0.9,
  intensity: 1.6,
  colorLow: '#7a1a05',
  colorMid: '#ff6a00',
  colorHigh: '#ffe8a3',
  additiveBlending: false,
  smokeEnabled: true,
  smokeCount: 40,
  smokeOpacity: 0.55,
  smokeRiseSpeed: 0.9,
  smokeGrowth: 1.8,
  smokeColor: '#3a3a3a',
  volumeSize: 64,
  volumeFrames: 64,
  volumeOctaves: 4,
  volumeFrequency: 2.5,
  turbulence: 0.6,
  flameWidth: 0.3,
  seed: 1,
  glowEnabled: true,
  glowIntensity: 0.45,
  groundVisible: true,
  groundRadius: 1.4,
  lightEnabled: true,
  lightIntensity: 8,
}

type NumericSetting = {
  [Key in keyof VulcanFireSettings]: VulcanFireSettings[Key] extends number ? Key : never
}[keyof VulcanFireSettings]

const numericRanges: Record<NumericSetting, [number, number]> = {
  animationSpeed: [0, 3],
  fireCount: [0, MAX_VULCAN_PARTICLES],
  playbackSpeed: [0, 3],
  sizeMin: [0.1, 4],
  sizeMax: [0.1, 4],
  riseSpeed: [0, 3],
  emitterRadius: [0, 2],
  bindStrength: [0, 6],
  decaySpeed: [0.2, 3],
  intensity: [0, 4],
  smokeCount: [0, MAX_VULCAN_PARTICLES],
  smokeOpacity: [0, 1],
  smokeRiseSpeed: [0, 3],
  smokeGrowth: [0, 4],
  volumeSize: [32, 128],
  volumeFrames: [16, 64],
  volumeOctaves: [1, 6],
  volumeFrequency: [1, 6],
  turbulence: [0, 1.5],
  flameWidth: [0.1, 0.6],
  seed: [1, 10000],
  glowIntensity: [0, 2],
  groundRadius: [0.1, 8],
  lightIntensity: [0, 30],
}

const numericKeys = Object.keys(numericRanges) as NumericSetting[]
const integerKeys: NumericSetting[] = ['fireCount', 'smokeCount', 'volumeSize', 'volumeFrames', 'volumeOctaves', 'seed']

export function resolveVulcanFireSettings(props: VulcanFireProps): VulcanFireSettings {
  const settings = { ...VULCAN_FIRE_DEFAULTS, ...props }
  for (const key of numericKeys) {
    const value = props[key]
    const [min, max] = numericRanges[key]
    settings[key] = typeof value === 'number' && Number.isFinite(value)
      ? MathUtils.clamp(value, min, max)
      : VULCAN_FIRE_DEFAULTS[key]
  }
  for (const key of integerKeys) {
    settings[key] = Math.round(settings[key])
  }
  // Either size control can be dragged past the other without invalid interpolation.
  const lowerSize = Math.min(settings.sizeMin, settings.sizeMax)
  settings.sizeMax = Math.max(settings.sizeMin, settings.sizeMax)
  settings.sizeMin = lowerSize
  return settings
}
