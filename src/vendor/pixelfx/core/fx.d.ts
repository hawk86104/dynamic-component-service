// Local TypeScript declarations; upstream JavaScript is preserved verbatim.
export interface PixelFxMeta {
  name: string
  desc: string
  size: [number, number]
  origin: [number, number]
  duration: number
  loop: boolean
  fps: number
  bg?: string
  actor?: boolean | number
  options?: Record<string, unknown>
}

export interface PixelFxModule {
  meta: PixelFxMeta
  act?: {
    poses?: Array<[number, Record<string, unknown>, string?]>
    hits?: Array<{ t: number, stop?: number }>
  }
}

export interface PixelFxFrame {
  w: number
  h: number
  ox: number
  oy: number
  color: Uint32Array
  light: Uint32Array
}

export interface PixelFxInstance {
  readonly t: number
  update: (dt: number) => void
  draw: (frame: PixelFxFrame, layer?: 'back' | 'front') => void
  done: () => boolean
}

export function createFrame(w: number, h: number): PixelFxFrame
export function clearFrame(frame: PixelFxFrame): PixelFxFrame
export function createFx(module: PixelFxModule, options?: Record<string, unknown>): PixelFxInstance
export function composite(frame: PixelFxFrame, out: Uint8ClampedArray): Uint8ClampedArray
