import type * as THREE from 'three'

export type ElementKind = 'ember' | 'solar' | 'breeze' | 'bloom'

export interface CardOptions {
  enabled: boolean
  playing: boolean
  width: number
  height: number
  thickness: number
  title: string
  subtitle: string
  showLabel: boolean
  textColor: string
  cardColor: string
  secondaryColor: string
  highlightColor: string
  effectColor: string
  surfaceShine: number
  effectIntensity: number
  animationSpeed: number
  floatAmplitude: number
  particleCount: number
  particleSize: number
  showGroundGlow: boolean
  groundGlowIntensity: number
  opacity: number
  seed: number
}

export interface EmberCardOptions extends CardOptions {
  flameHeight: number
  flameWidth: number
  flameDepth: number
  flameSpeed: number
  tongueCount: number
  coreBrightness: number
  triangleRatio: number
  turbulence: number
  rayMarchSteps: number
  coreColor: string
}

export interface SolarCardOptions extends CardOptions {
  rayCount: number
  rayLength: number
  rayWidth: number
  pulseAmount: number
  coronaColor: string
  coronaWidth: number
  coronaIntensity: number
  shaftOpacity: number
  rayDepth: number
  solarSpeed: number
  ringRatio: number
  particleSpread: number
}

export interface BreezeCardOptions extends CardOptions {
  streamCount: number
  streamWidth: number
  orbitSpread: number
  flowTurbulence: number
  depthSpread: number
}

export interface BloomCardOptions extends CardOptions {
  petalCount: number
  petalSpread: number
  petalHeight: number
  bloomAmount: number
  petalOpacity: number
  petalColor: string
  tipColor: string
  swayStrength: number
}

export type NumericRanges = Record<string, readonly [number, number, number]>
export type Uniforms = Record<string, THREE.IUniform>

export interface ElementEffect<T extends CardOptions> {
  group: THREE.Group
  configure: (options: T) => void
  update: (time: number, camera: THREE.Camera) => void
  dispose: () => void
}

export interface EffectFactory<T extends CardOptions> {
  ownsRim?: boolean
  timeScale?: (options: T) => number
  createParticles?: (options: T) => {
    group: THREE.Group
    configure: (options: T) => void
    update: (time: number, camera: THREE.Camera, renderer: Pick<THREE.WebGLRenderer, 'getDrawingBufferSize'>) => void
    dispose: () => void
  }
  geometryKeys: readonly (keyof T)[]
  create: (options: T) => ElementEffect<T>
}

export interface CardControlEvents {
  (event: 'update:enabled', value: boolean): void
  (event: 'update:playing', value: boolean): void
}
