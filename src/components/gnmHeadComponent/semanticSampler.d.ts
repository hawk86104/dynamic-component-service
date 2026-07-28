import type {
  GNMProgressCallback,
  GNMSections,
} from './gnmModel.js'

export type GNMClassWeights = number | Record<number, number>

export interface GNMLayerMeta {
  weights: string
  bias: string
  activation: 'relu' | 'linear'
  inputDim: number
  outputDim: number
}

export interface GNMSamplerDecoderMeta {
  latentDim: number
  conditionDim: number
  labels: string[]
  layers: GNMLayerMeta[]
}

export interface GNMSamplerMeta {
  identity: GNMSamplerDecoderMeta & {
    genders: string[]
    ethnicities: string[]
  }
  expression: GNMSamplerDecoderMeta
}

export function createRng(seed: number): () => number

export class GNMSamplers {
  constructor(meta: GNMSamplerMeta, sections: GNMSections)

  static load(
    url: string,
    onProgress?: GNMProgressCallback,
    signal?: AbortSignal,
  ): Promise<GNMSamplers>

  readonly genders: string[]
  readonly ethnicities: string[]
  readonly expressionClasses: string[]

  seed(value: number): void
  sampleIdentity(
    genderWeights: number[],
    ethnicityWeights: number[],
    sigma?: number,
  ): Float32Array
  sampleExpression(
    classWeights: GNMClassWeights,
    sigma?: number,
  ): Float32Array
  randomIdentity(sigma?: number): Float32Array
  randomExpression(sigma?: number, maxClasses?: number): Float32Array
}
