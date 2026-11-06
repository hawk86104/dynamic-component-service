import { getPixelFxEffect } from './effects'
import type { PixelFxEffectId } from './effects'
import type { PixelFxProps } from './types'

export const PIXEL_FX_MAX_SEED = 9999

export const PIXEL_FX_DEFAULTS: Required<PixelFxProps> = {
  renderMode: 'billboard',
  resolutionScale: 1,
  width: 4,
  opacity: 1,
  playing: true,
  playbackRate: 1,
  loop: true,
  palette: '',
  seed: 1,
  mirror: false,
}

export function getPixelFxDefaults(effectId: PixelFxEffectId): Required<PixelFxProps> {
  return { ...PIXEL_FX_DEFAULTS, seed: getPixelFxEffect(effectId).seed }
}
