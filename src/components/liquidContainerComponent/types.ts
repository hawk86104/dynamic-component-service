import type * as THREE from 'three'

export type ShapeType = 'rectTank' | 'cylinderTank' | 'vaseTank'
export type VasePreset = 'roundPot' | 'slenderBottle' | 'bulbFlask'
export type SurfaceShape = 'rect' | 'circle'

export interface LiquidContainerProps {
  shapeType?: ShapeType
  vasePreset?: VasePreset
  length?: number
  width?: number
  height?: number
  radius?: number
  fillLevel?: number
  waveSpeed?: number
  waveAmplitude?: number
  waveFrequency?: number
  waveRandomness?: number
  baseColor?: string
  topColor?: string
  edgeColor?: string
  shellColor?: string
  shellOpacity?: number
  density?: number
  opacity?: number
  bubbleEnabled?: boolean
  bubbleCount?: number
  bubbleSizeMin?: number
  bubbleSizeMax?: number
  bubbleRandomness?: number
  bubbleRiseSpeed?: number
  bubbleColor?: string
  clipX?: number
  clipZ?: number
}

export interface SafeLiquidContainerProps {
  shapeType: ShapeType
  vasePreset: VasePreset
  length: number
  width: number
  height: number
  radius: number
  fillLevel: number
  waveSpeed: number
  waveAmplitude: number
  waveFrequency: number
  waveRandomness: number
  baseColor: string
  topColor: string
  edgeColor: string
  shellColor: string
  shellOpacity: number
  density: number
  opacity: number
  bubbleEnabled: boolean
  bubbleCount: number
  bubbleSizeMin: number
  bubbleSizeMax: number
  bubbleRandomness: number
  bubbleRiseSpeed: number
  bubbleColor: string
  clipX: number
  clipZ: number
  shellThickness: number
}

export interface ProfilePoint {
  h: number
  r: number
}

export interface ContainerGeometryBundle {
  shellGeometry: THREE.BufferGeometry
  liquidGeometry: THREE.BufferGeometry
  surfaceGeometry: THREE.BufferGeometry
  shellPositionY: number
  liquidPositionY: number
  surfacePositionY: number
  shellHalfExtents: THREE.Vector3
  liquidHalfExtents: THREE.Vector3
  surfaceRadius: number
  surfaceShape: SurfaceShape
  liquidHeight: number
  sampleInnerRadius: (normalizedHeight: number) => number
  sampleBubblePosition: (seedA: number, seedB: number, normalizedHeight: number) => THREE.Vector3
  dispose: () => void
}
