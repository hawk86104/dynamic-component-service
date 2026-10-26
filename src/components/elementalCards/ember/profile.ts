import type { EmberCardOptions } from '../types'

/** Ratios refer to card width; the emitter follows the actual upper semicircle. */
export function getEmberProfile(options: EmberCardOptions) {
  const shoulder = (options.height - options.width) * 0.5
  const bottom = shoulder - options.width * 0.16
  const top = options.height * 0.5 + options.width * (options.flameHeight * 0.98 + 0.14)
  return {
    shoulder,
    size: [options.width * (options.flameWidth * 1.55 + 0.25), top - bottom, options.width * options.flameDepth] as const,
    center: [0, (bottom + top) * 0.5, -options.thickness * 0.5 - options.width * 0.07] as const,
  }
}

export function upperArcRoot(x: number) {
  return Math.sqrt(Math.max(0, 0.25 - x * x))
}
