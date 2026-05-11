import * as THREE from 'three'

export type ColorSchemeKey = 'fire' | 'ice' | 'nebula' | 'toxic' | 'gold' | 'rainbow'

// 每个色系三色：深部 -> 中段 -> 高光
export const COLOR_SCHEMES: Record<ColorSchemeKey, [string, string, string]> = {
  fire: ['#4a0d00', '#ff4d10', '#ffe08a'],
  ice: ['#021e4d', '#2fb5ff', '#f1fbff'],
  nebula: ['#320560', '#d634b1', '#6dc9ff'],
  toxic: ['#0a3d10', '#49e05a', '#e6ff7a'],
  gold: ['#2b1402', '#e6a23a', '#fff5c8'],
  rainbow: ['#ff3355', '#ffd24d', '#30d4ff'],
}

export function resolveColorScheme(key: string | undefined) {
  const picked = key && (key in COLOR_SCHEMES)
    ? COLOR_SCHEMES[key as ColorSchemeKey]
    : COLOR_SCHEMES.fire
  return {
    colorA: new THREE.Color(picked[0]),
    colorB: new THREE.Color(picked[1]),
    colorC: new THREE.Color(picked[2]),
  }
}

export function clampNumber(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
) {
  if (!Number.isFinite(value)) {
    return fallback
  }
  return THREE.MathUtils.clamp(value as number, min, max)
}

// 方位角 + 仰角 -> 单位方向向量
export function computeWindDirection(azimuthDeg: number, elevationDeg: number) {
  const az = THREE.MathUtils.degToRad(azimuthDeg)
  const el = THREE.MathUtils.degToRad(elevationDeg)
  const cosEl = Math.cos(el)
  return new THREE.Vector3(
    Math.sin(az) * cosEl,
    Math.sin(el),
    Math.cos(az) * cosEl,
  ).normalize()
}
