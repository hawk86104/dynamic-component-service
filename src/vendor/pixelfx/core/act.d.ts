// Local declarations for the unchanged upstream action runtime.
import type { PixelFxFrame, PixelFxModule } from './fx.js'

export interface PixelFxAct {
  readonly t: number
  readonly shake: [number, number]
  update: (dt: number) => void
  draw: (frame: PixelFxFrame, options?: { body?: boolean, target?: boolean }) => void
  done: () => boolean
}

export function createAct(module: PixelFxModule, options?: Record<string, unknown>): PixelFxAct
export function actBounds(module: PixelFxModule): { x0: number, y0: number, x1: number, y1: number }
export function actSpan(module: PixelFxModule): { from: number, to: number }
