export interface FloorOptions {
  repeatWidth: number
  repeatLength: number
  color: string
  reflectivity: number
  roughness: number
  metalness: number
  ior: number
  envMapIntensity: number
}

export const MECHANICAL_FLOOR_DEFAULTS: FloorOptions = {
  repeatWidth: 4,
  repeatLength: 4,
  color: '#ffffff',
  reflectivity: 1,
  roughness: 0.88,
  metalness: 0.9,
  ior: 1.5,
  envMapIntensity: 1,
}

export function bounded(value: number, min: number, max: number, fallback: number) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
}
