export interface GNMHeadMaterialOptions {
  skinColor: string
  irisColor: string
  roughness: number
  metalness: number
  skinOpacity: number
}

export interface GNMHeadPose {
  headPitch: number
  headYaw: number
  headRoll: number
  eyePitch: number
  eyeYaw: number
}

export interface GNMHeadVisibility {
  eyes: boolean
  teethGums: boolean
  tongue: boolean
}

export interface GNMHeadComponentProps {
  headUrl?: string
  samplerUrl?: string
  identitySeed?: number
  identityStrength?: number
  expressionSeed?: number
  expressionClass?: string
  expressionStrength?: number
  headPitch?: number
  headYaw?: number
  headRoll?: number
  eyePitch?: number
  eyeYaw?: number
  skinColor?: string
  irisColor?: string
  roughness?: number
  metalness?: number
  skinOpacity?: number
  showEyes?: boolean
  showTeethGums?: boolean
  showTongue?: boolean
}

export type GNMLoadStage = 'head' | 'sampler'

export interface GNMLoadProgress {
  stage: GNMLoadStage
  progress: number
}
