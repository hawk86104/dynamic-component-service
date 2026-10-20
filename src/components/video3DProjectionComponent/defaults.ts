// Keep a concrete interface: Vue's runtime prop compiler cannot resolve typeof defaults.
export interface Video3DProjectionOptions {
  enabled: boolean
  videoUrl: string
  autoplay: boolean
  loop: boolean
  angle: number
  angle2: number
  distance: number
  near: number
  heading: number
  pitch: number
  roll: number
  flipX: boolean
  stRotationDegree: number
  opacity: number
  intensity: number
  videoTint: string
  edgeFeather: number
  enableOcclusion: boolean
  depthBias: number
  depthResolution: number
  showFrustum: boolean
  frustumColor: string
  targetNames: string
  showDemoReceivers: boolean
}

export const VIDEO_3D_DEFAULTS: Video3DProjectionOptions = {
  enabled: true,
  videoUrl: 'https://dcser.icegl.cn/video/vlg.mp4',
  autoplay: true,
  loop: true,
  angle: 64,
  angle2: 40,
  distance: 10,
  near: 1,
  heading: 0,
  pitch: -20,
  roll: 0,
  flipX: false,
  stRotationDegree: 0,
  opacity: 0.95,
  intensity: 1,
  videoTint: '#ffffff',
  edgeFeather: 0.035,
  enableOcclusion: true,
  depthBias: 0.001,
  depthResolution: 1024,
  showFrustum: true,
  frustumColor: '#00e5ff',
  targetNames: '',
  showDemoReceivers: true,
}

export function bounded(value: number, min: number, max: number, fallback: number) {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback
}
