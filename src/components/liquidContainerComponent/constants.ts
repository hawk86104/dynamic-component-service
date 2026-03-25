import type { LiquidContainerProps, ProfilePoint } from './types'

export const DEFAULT_LIQUID_CONTAINER_PROPS: Required<LiquidContainerProps> = {
  shapeType: 'cylinderTank',
  vasePreset: 'roundPot',
  length: 2.4,
  width: 1.6,
  height: 2.8,
  radius: 1,
  fillLevel: 0.64,
  waveSpeed: 1.15,
  waveAmplitude: 0.08,
  waveFrequency: 3.4,
  waveRandomness: 0.46,
  baseColor: '#1f7ae0',
  topColor: '#6fe7ff',
  edgeColor: '#d7fbff',
  shellColor: '#d7f5ff',
  shellOpacity: 0.24,
  density: 0.72,
  opacity: 0.78,
  bubbleEnabled: true,
  bubbleCount: 56,
  bubbleSizeMin: 0.005,
  bubbleSizeMax: 0.016,
  bubbleRandomness: 0.72,
  bubbleRiseSpeed: 0.72,
  bubbleColor: '#f5feff',
  clipX: 1,
  clipZ: 1,
}

export const MAX_BUBBLES = 160
export const RADIAL_SEGMENTS = 72
export const SURFACE_SEGMENTS = 40

export const VASE_PROFILE_PRESETS: Record<string, ProfilePoint[]> = {
  roundPot: [
    { h: 0, r: 0.42 },
    { h: 0.08, r: 0.44 },
    { h: 0.2, r: 0.54 },
    { h: 0.38, r: 0.62 },
    { h: 0.6, r: 0.58 },
    { h: 0.82, r: 0.34 },
    { h: 0.94, r: 0.25 },
    { h: 1, r: 0.24 },
  ],
  slenderBottle: [
    { h: 0, r: 0.34 },
    { h: 0.12, r: 0.36 },
    { h: 0.28, r: 0.42 },
    { h: 0.52, r: 0.38 },
    { h: 0.72, r: 0.28 },
    { h: 0.88, r: 0.17 },
    { h: 1, r: 0.15 },
  ],
  bulbFlask: [
    { h: 0, r: 0.24 },
    { h: 0.12, r: 0.42 },
    { h: 0.26, r: 0.58 },
    { h: 0.46, r: 0.66 },
    { h: 0.66, r: 0.46 },
    { h: 0.84, r: 0.18 },
    { h: 1, r: 0.14 },
  ],
}
