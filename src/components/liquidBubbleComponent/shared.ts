import * as THREE from 'three'

export type LiquidBubbleShape = 'box' | 'cylinder'

export const isFiniteNumber = (value: number | undefined) => Number.isFinite(value)

export const clampNumber = (value: number | undefined, min: number, max: number, fallback: number) => {
  if (!isFiniteNumber(value)) {
    return fallback
  }

  return THREE.MathUtils.clamp(value as number, min, max)
}

export const clampInteger = (value: number | undefined, min: number, max: number, fallback: number) => {
  return Math.round(clampNumber(value, min, max, fallback))
}

export const normalizeShapeType = (value: string | undefined): LiquidBubbleShape => {
  return value === 'box' ? 'box' : 'cylinder'
}

export const setMaterialColor = (
  uniform: THREE.IUniform<THREE.Color>,
  value: string | undefined,
  fallback: string,
) => {
  try {
    uniform.value.set(value ?? fallback)
  }
  catch {
    uniform.value.set(fallback)
  }
}
