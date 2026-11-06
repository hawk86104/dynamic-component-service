export type PixelFxRenderMode = 'billboard' | 'sprite' | 'vertical' | 'ground'

export interface PixelFxProps {
  renderMode?: PixelFxRenderMode
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
