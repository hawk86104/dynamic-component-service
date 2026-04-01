import type { SanitizedWaterDropGlassConfig, WaterDropGlassMaterialProps } from './types'

const clampNumber = (value: number | undefined, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.min(max, Math.max(min, value as number))
}

export const DEFAULT_WATER_DROP_GLASS_PROPS: Required<WaterDropGlassMaterialProps> = {
  attenuationDistance: 0.85,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  collisionRadius: 0.45,
  collisionRadiusIncrease: 0.0002,
  dropletGlow: 0.12,
  dropletRoughness: 0.02,
  dropletSizeMax: 5,
  dropletSizeMin: 2,
  dropletsRate: 120,
  glassColor: '#dfefff',
  globalTimeScale: 1,
  ior: 1.12,
  length: 2.6,
  maxDropRadius: 50,
  metalness: 0,
  minDropRadius: 20,
  normalStrength: 0.65,
  opacity: 1,
  rainAmount: 1,
  rainChance: 0.35,
  rainLimit: 6,
  roughness: 0.04,
  thickness: 0.12,
  trailRate: 1,
  transmission: 1,
  width: 3.2,
}

export const sanitizeWaterDropGlassProps = (
  props: WaterDropGlassMaterialProps,
): SanitizedWaterDropGlassConfig => {
  const minDropRadius = clampNumber(props.minDropRadius, 6, 60, DEFAULT_WATER_DROP_GLASS_PROPS.minDropRadius)
  const maxDropRadius = clampNumber(props.maxDropRadius, minDropRadius + 1, 100, DEFAULT_WATER_DROP_GLASS_PROPS.maxDropRadius)
  const dropletSizeMin = clampNumber(props.dropletSizeMin, 0.5, 12, DEFAULT_WATER_DROP_GLASS_PROPS.dropletSizeMin)
  const dropletSizeMax = clampNumber(props.dropletSizeMax, dropletSizeMin + 0.2, 18, DEFAULT_WATER_DROP_GLASS_PROPS.dropletSizeMax)

  return {
    attenuationDistance: clampNumber(
      props.attenuationDistance,
      0,
      12,
      DEFAULT_WATER_DROP_GLASS_PROPS.attenuationDistance,
    ),
    clearcoat: clampNumber(props.clearcoat, 0, 1, DEFAULT_WATER_DROP_GLASS_PROPS.clearcoat),
    clearcoatRoughness: clampNumber(
      props.clearcoatRoughness,
      0,
      1,
      DEFAULT_WATER_DROP_GLASS_PROPS.clearcoatRoughness,
    ),
    collisionRadius: clampNumber(props.collisionRadius, 0.1, 1.2, DEFAULT_WATER_DROP_GLASS_PROPS.collisionRadius),
    collisionRadiusIncrease: clampNumber(
      props.collisionRadiusIncrease,
      0,
      0.01,
      DEFAULT_WATER_DROP_GLASS_PROPS.collisionRadiusIncrease,
    ),
    dropletGlow: clampNumber(props.dropletGlow, 0, 1, DEFAULT_WATER_DROP_GLASS_PROPS.dropletGlow),
    dropletRoughness: clampNumber(
      props.dropletRoughness,
      0,
      1,
      DEFAULT_WATER_DROP_GLASS_PROPS.dropletRoughness,
    ),
    dropletSizeMax,
    dropletSizeMin,
    dropletsRate: clampNumber(props.dropletsRate, 0, 400, DEFAULT_WATER_DROP_GLASS_PROPS.dropletsRate),
    glassColor: props.glassColor || DEFAULT_WATER_DROP_GLASS_PROPS.glassColor,
    globalTimeScale: clampNumber(props.globalTimeScale, 0, 3, DEFAULT_WATER_DROP_GLASS_PROPS.globalTimeScale),
    ior: clampNumber(props.ior, 1, 2.333, DEFAULT_WATER_DROP_GLASS_PROPS.ior),
    length: clampNumber(props.length, 0.5, 12, DEFAULT_WATER_DROP_GLASS_PROPS.length),
    maxDropRadius,
    metalness: clampNumber(props.metalness, 0, 1, DEFAULT_WATER_DROP_GLASS_PROPS.metalness),
    minDropRadius,
    normalStrength: clampNumber(
      props.normalStrength,
      0,
      2,
      DEFAULT_WATER_DROP_GLASS_PROPS.normalStrength,
    ),
    opacity: clampNumber(props.opacity, 0.05, 1, DEFAULT_WATER_DROP_GLASS_PROPS.opacity),
    rainAmount: clampNumber(props.rainAmount, 0, 3, DEFAULT_WATER_DROP_GLASS_PROPS.rainAmount),
    rainChance: clampNumber(props.rainChance, 0, 1, DEFAULT_WATER_DROP_GLASS_PROPS.rainChance),
    rainLimit: clampNumber(props.rainLimit, 0, 20, DEFAULT_WATER_DROP_GLASS_PROPS.rainLimit),
    roughness: clampNumber(props.roughness, 0, 1, DEFAULT_WATER_DROP_GLASS_PROPS.roughness),
    thickness: clampNumber(props.thickness, 0.02, 1, DEFAULT_WATER_DROP_GLASS_PROPS.thickness),
    trailRate: clampNumber(props.trailRate, 0, 3, DEFAULT_WATER_DROP_GLASS_PROPS.trailRate),
    transmission: clampNumber(props.transmission, 0, 1, DEFAULT_WATER_DROP_GLASS_PROPS.transmission),
    width: clampNumber(props.width, 0.5, 12, DEFAULT_WATER_DROP_GLASS_PROPS.width),
  }
}
