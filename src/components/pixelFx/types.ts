export type PixelFxRenderMode = 'billboard' | 'sprite' | 'vertical' | 'ground'
export type PixelFxResolutionScale = 1 | 2 | 4

export interface PixelFxProps {
  renderMode?: PixelFxRenderMode
  resolutionScale?: PixelFxResolutionScale
  width?: number
  opacity?: number
  playing?: boolean
  playbackRate?: number
  loop?: boolean
  palette?: string
  seed?: number
  mirror?: boolean
}

export interface PixelFxApi {
  restart: () => void
}
