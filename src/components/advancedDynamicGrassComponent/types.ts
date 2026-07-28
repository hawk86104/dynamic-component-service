import type * as THREE from 'three'

export interface GrassWindOptions {
  strength: number
  speed: number
  frequency: number
  turbulence: number
  lean: number
  direction: number
}

export interface TerrainOptions {
  width: number
  depth: number
  segments: number
  seed: number
  terrainDegree: number
  groundColor: THREE.ColorRepresentation
}

export interface GrassLayerOptions {
  surface: THREE.Mesh
  density: number
  seed: number
  blade: {
    minWidth: number
    maxWidth: number
    minHeight: number
    maxHeight: number
    segments: number
    lean: number
  }
  wind: GrassWindOptions
  colors: {
    bottom: THREE.ColorRepresentation
    top: THREE.ColorRepresentation
    backlight: THREE.ColorRepresentation
  }
  brightness: number
}

export interface GrassAppearanceOptions {
  wind: GrassWindOptions
  colors: GrassLayerOptions['colors']
  brightness: number
}

export interface WildflowerOptions {
  surface: THREE.Mesh
  density: number
  maxCount: number
  seed: number
  wind: GrassWindOptions
}

export interface MeadowOptions {
  terrain: TerrainOptions
  grass: Omit<GrassLayerOptions, 'surface'>
  wildflowers: Omit<WildflowerOptions, 'surface'> & {
    enabled: boolean
  }
}
