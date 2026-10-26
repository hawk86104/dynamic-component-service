import type {
  BloomCardOptions,
  BreezeCardOptions,
  CardOptions,
  EmberCardOptions,
  NumericRanges,
  SolarCardOptions,
} from './types'

export const COMMON_CARD_DEFAULTS: CardOptions = {
  enabled: true,
  playing: true,
  width: 1.45,
  height: 2.45,
  thickness: 0.14,
  title: '',
  subtitle: '',
  showLabel: true,
  textColor: '#fff9f2',
  cardColor: '#ed619c',
  secondaryColor: '#a1f1c4',
  highlightColor: '#fff0b3',
  effectColor: '#ff662b',
  surfaceShine: 0.85,
  effectIntensity: 1.2,
  animationSpeed: 1,
  floatAmplitude: 0.035,
  particleCount: 80,
  particleSize: 0.025,
  showGroundGlow: true,
  groundGlowIntensity: 0.65,
  opacity: 1,
  seed: 17,
}

export const COMMON_CARD_RANGES: NumericRanges = {
  width: [0.3, 8, 0.05],
  height: [0.6, 12, 0.05],
  thickness: [0.04, 0.8, 0.01],
  surfaceShine: [0, 2, 0.01],
  effectIntensity: [0, 3, 0.05],
  animationSpeed: [0, 4, 0.05],
  floatAmplitude: [0, 0.3, 0.005],
  particleCount: [0, 400, 1],
  particleSize: [0.005, 0.12, 0.005],
  groundGlowIntensity: [0, 2, 0.05],
  opacity: [0, 1, 0.01],
  seed: [0, 65535, 1],
}

export const EMBER_CARD_DEFAULTS: EmberCardOptions = {
  ...COMMON_CARD_DEFAULTS,
  title: 'Ember',
  subtitle: 'FIRE · COURAGE',
  effectColor: '#ff351c',
  particleCount: 190,
  particleSize: 0.018,
  flameHeight: 1,
  flameWidth: 1,
  flameDepth: 0.42,
  flameSpeed: 1,
  tongueCount: 11,
  coreBrightness: 1.25,
  triangleRatio: 0.1,
  turbulence: 0.8,
  rayMarchSteps: 48,
  coreColor: '#fff1df',
}

export const SOLAR_CARD_DEFAULTS: SolarCardOptions = {
  ...COMMON_CARD_DEFAULTS,
  title: 'Solar',
  subtitle: 'SUN · VITALITY',
  cardColor: '#df987c',
  secondaryColor: '#ddc28c',
  highlightColor: '#d8efbc',
  effectColor: '#ffc33d',
  particleCount: 128,
  particleSize: 0.016,
  rayCount: 128,
  rayLength: 1.25,
  rayWidth: 0.012,
  pulseAmount: 0.18,
  coronaColor: '#fff8df',
  coronaWidth: 0.014,
  coronaIntensity: 1.35,
  shaftOpacity: 0.18,
  rayDepth: 0.22,
  solarSpeed: 1,
  ringRatio: 0.12,
  particleSpread: 0.55,
}

export const BREEZE_CARD_DEFAULTS: BreezeCardOptions = {
  ...COMMON_CARD_DEFAULTS,
  title: 'Breeze',
  subtitle: 'AIR · CLARITY',
  cardColor: '#5ce1b3',
  secondaryColor: '#b5ebbc',
  highlightColor: '#e2f5b7',
  effectColor: '#5dffd1',
  particleCount: 60,
  streamCount: 24,
  streamWidth: 0.012,
  orbitSpread: 0.36,
  flowTurbulence: 0.28,
  depthSpread: 0.65,
}

export const BLOOM_CARD_DEFAULTS: BloomCardOptions = {
  ...COMMON_CARD_DEFAULTS,
  title: 'Bloom',
  subtitle: 'HEART · GROWTH',
  cardColor: '#cf4eae',
  secondaryColor: '#ffbcce',
  highlightColor: '#ffd99b',
  effectColor: '#ff72c8',
  particleCount: 55,
  petalCount: 12,
  petalSpread: 1.05,
  petalHeight: 1,
  bloomAmount: 1,
  petalOpacity: 0.68,
  petalColor: '#f54da9',
  tipColor: '#ffe3f1',
  swayStrength: 0.14,
}

export const EMBER_CARD_RANGES: NumericRanges = {
  ...COMMON_CARD_RANGES,
  flameHeight: [0.2, 2, 0.05],
  flameWidth: [0.5, 1.8, 0.05],
  flameDepth: [0.15, 0.9, 0.01],
  flameSpeed: [0, 3, 0.05],
  tongueCount: [5, 18, 1],
  coreBrightness: [0, 2.5, 0.05],
  triangleRatio: [0, 0.35, 0.01],
  turbulence: [0, 2, 0.05],
  rayMarchSteps: [16, 72, 1],
}
export const SOLAR_CARD_RANGES: NumericRanges = {
  ...COMMON_CARD_RANGES,
  rayCount: [16, 160, 1],
  rayLength: [0.2, 2.5, 0.05],
  rayWidth: [0.004, 0.08, 0.002],
  pulseAmount: [0, 0.8, 0.01],
  coronaWidth: [0.004, 0.05, 0.001],
  coronaIntensity: [0, 3, 0.05],
  shaftOpacity: [0, 0.5, 0.01],
  rayDepth: [0.03, 0.8, 0.01],
  solarSpeed: [0, 3, 0.05],
  ringRatio: [0, 0.5, 0.01],
  particleSpread: [0.1, 1.2, 0.01],
}
export const BREEZE_CARD_RANGES: NumericRanges = {
  ...COMMON_CARD_RANGES,
  streamCount: [4, 64, 1],
  streamWidth: [0.003, 0.05, 0.001],
  orbitSpread: [0.05, 0.9, 0.01],
  flowTurbulence: [0, 1, 0.01],
  depthSpread: [0.1, 1.5, 0.05],
}
export const BLOOM_CARD_RANGES: NumericRanges = {
  ...COMMON_CARD_RANGES,
  petalCount: [6, 24, 1],
  petalSpread: [0.4, 1.8, 0.05],
  petalHeight: [0.4, 1.6, 0.05],
  bloomAmount: [0, 1, 0.01],
  petalOpacity: [0.1, 1, 0.01],
  swayStrength: [0, 0.7, 0.01],
}

type RuntimeProps<T> = {
  [K in keyof T]: {
    type: T[K] extends boolean ? BooleanConstructor : T[K] extends number ? NumberConstructor : StringConstructor
    default: T[K]
  }
}

// Explicit runtime declarations also keep all controls available after imported-type HMR.
function makeProps<T extends CardOptions>(defaults: T): RuntimeProps<T> {
  const result = {} as RuntimeProps<T>
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const value = defaults[key]
    const type = typeof value === 'boolean' ? Boolean : typeof value === 'number' ? Number : String
    result[key] = { type, default: value } as RuntimeProps<T>[typeof key]
  }
  return result
}

export const EMBER_CARD_PROPS = makeProps(EMBER_CARD_DEFAULTS)
export const SOLAR_CARD_PROPS = makeProps(SOLAR_CARD_DEFAULTS)
export const BREEZE_CARD_PROPS = makeProps(BREEZE_CARD_DEFAULTS)
export const BLOOM_CARD_PROPS = makeProps(BLOOM_CARD_DEFAULTS)

export function sanitizeCardOptions<T extends CardOptions>(input: Readonly<T>, defaults: T, ranges: NumericRanges): T {
  const result = { ...defaults } as T
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const fallback = defaults[key]
    const value = input[key]
    let safe: unknown = fallback
    if (typeof fallback === 'number') {
      const [min, max, step] = ranges[String(key)]
      const number = typeof value === 'number' && Number.isFinite(value) ? value : fallback
      safe = Math.min(max, Math.max(min, step === 1 ? Math.round(number) : number))
    }
    else if (typeof fallback === 'boolean') {
      safe = typeof value === 'boolean' ? value : fallback
    }
    else if (typeof value === 'string') {
      const text = value.replace(/[\r\n\t]/g, ' ').slice(0, 160)
      safe = String(key).toLowerCase().endsWith('color')
        ? /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(text.trim()) ? text.trim() : fallback
        : text
    }
    result[key] = safe as T[typeof key]
  }
  result.width = Math.min(result.width, result.height * 0.9)
  result.thickness = Math.min(result.thickness, result.width * 0.45)
  return result
}
