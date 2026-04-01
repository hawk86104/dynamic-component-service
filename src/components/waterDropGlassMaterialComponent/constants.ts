import type { SanitizedWaterDropGlassConfig, WaterDropGlassMaterialProps } from './types'

const clampNumber = (value: number | undefined, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.min(max, Math.max(min, value as number))
}

const clampBoolean = (value: boolean | undefined, fallback: boolean) => {
  return typeof value === 'boolean' ? value : fallback
}

export const DEFAULT_WATER_DROP_GLASS_PROPS: Required<WaterDropGlassMaterialProps> = {
  alphaMultiply: 6,
  alphaSubtract: 3,
  brightness: 1.04,
  collisionRadius: 0.45,
  collisionRadiusIncrease: 0.0002,
  dropletSizeMax: 5,
  dropletSizeMin: 2,
  dropletsRate: 120,
  globalTimeScale: 1,
  maxDropRadius: 50,
  minDropRadius: 20,
  opacity: 1,
  rainAmount: 1,
  rainChance: 0.35,
  rainLimit: 6,
  refraction: 1,
  showShadow: true,
  showShine: false,
  size: 4,
  trailRate: 1,
}

export const sanitizeWaterDropGlassProps = (
  props: WaterDropGlassMaterialProps,
): SanitizedWaterDropGlassConfig => {
  const minDropRadius = clampNumber(props.minDropRadius, 6, 60, DEFAULT_WATER_DROP_GLASS_PROPS.minDropRadius)
  const maxDropRadius = clampNumber(props.maxDropRadius, minDropRadius + 1, 100, DEFAULT_WATER_DROP_GLASS_PROPS.maxDropRadius)
  const dropletSizeMin = clampNumber(props.dropletSizeMin, 0.5, 12, DEFAULT_WATER_DROP_GLASS_PROPS.dropletSizeMin)
  const dropletSizeMax = clampNumber(props.dropletSizeMax, dropletSizeMin + 0.2, 18, DEFAULT_WATER_DROP_GLASS_PROPS.dropletSizeMax)

  return {
    alphaMultiply: clampNumber(props.alphaMultiply, 0, 10, DEFAULT_WATER_DROP_GLASS_PROPS.alphaMultiply),
    alphaSubtract: clampNumber(props.alphaSubtract, 0, 6, DEFAULT_WATER_DROP_GLASS_PROPS.alphaSubtract),
    brightness: clampNumber(props.brightness, 0.25, 2.5, DEFAULT_WATER_DROP_GLASS_PROPS.brightness),
    collisionRadius: clampNumber(props.collisionRadius, 0.1, 1.2, DEFAULT_WATER_DROP_GLASS_PROPS.collisionRadius),
    collisionRadiusIncrease: clampNumber(
      props.collisionRadiusIncrease,
      0,
      0.01,
      DEFAULT_WATER_DROP_GLASS_PROPS.collisionRadiusIncrease,
    ),
    dropletSizeMax,
    dropletSizeMin,
    dropletsRate: clampNumber(props.dropletsRate, 0, 400, DEFAULT_WATER_DROP_GLASS_PROPS.dropletsRate),
    globalTimeScale: clampNumber(props.globalTimeScale, 0, 3, DEFAULT_WATER_DROP_GLASS_PROPS.globalTimeScale),
    maxDropRadius,
    minDropRadius,
    opacity: clampNumber(props.opacity, 0.05, 1, DEFAULT_WATER_DROP_GLASS_PROPS.opacity),
    rainAmount: clampNumber(props.rainAmount, 0, 3, DEFAULT_WATER_DROP_GLASS_PROPS.rainAmount),
    rainChance: clampNumber(props.rainChance, 0, 1, DEFAULT_WATER_DROP_GLASS_PROPS.rainChance),
    rainLimit: clampNumber(props.rainLimit, 0, 20, DEFAULT_WATER_DROP_GLASS_PROPS.rainLimit),
    refraction: clampNumber(props.refraction, 0, 2.5, DEFAULT_WATER_DROP_GLASS_PROPS.refraction),
    showShadow: clampBoolean(props.showShadow, DEFAULT_WATER_DROP_GLASS_PROPS.showShadow),
    showShine: clampBoolean(props.showShine, DEFAULT_WATER_DROP_GLASS_PROPS.showShine),
    size: clampNumber(props.size, 0.5, 12, DEFAULT_WATER_DROP_GLASS_PROPS.size),
    trailRate: clampNumber(props.trailRate, 0, 3, DEFAULT_WATER_DROP_GLASS_PROPS.trailRate),
  }
}
