export type GNMTypedArray =
  | Float32Array
  | Int8Array
  | Uint8Array
  | Uint16Array
  | Int32Array

export interface GNMMeta {
  model: string
  gnmVersion: string
  variant: string
  numVertices: number
  numJoints: number
  identityDim: number
  expressionDim: number
  jointNames: string[]
  componentNames: string[]
  materialNames: string[]
  regionNames: string[]
}

export type GNMSections = Record<string, GNMTypedArray>
export type GNMProgressCallback = (fraction: number) => void

export interface GNMContainer {
  meta: GNMMeta
  sections: GNMSections
}

export function parseContainer(buffer: ArrayBuffer): GNMContainer

export function fetchWithProgress(
  url: string,
  onProgress?: GNMProgressCallback,
  signal?: AbortSignal,
): Promise<ArrayBuffer>

export function axisAngleToMatrix(
  x: number,
  y: number,
  z: number,
  out: Float32Array,
  offset?: number,
): void

export class GNMHeadModel {
  constructor(meta: GNMMeta, sections: GNMSections)

  static load(
    url: string,
    onProgress?: GNMProgressCallback,
    signal?: AbortSignal,
  ): Promise<GNMHeadModel>

  readonly meta: GNMMeta
  readonly numVertices: number
  readonly numJoints: number
  readonly identityDim: number
  readonly expressionDim: number
  readonly template: Float32Array
  readonly triangles: Uint16Array
  readonly quads: Uint16Array
  readonly templateJoints: Float32Array
  readonly jointParents: Int32Array
  readonly skinningWeights: Float32Array
  readonly jointIdentityBasis: Float32Array
  readonly identityBasis: Int8Array
  readonly identityScales: Float32Array
  readonly expressionBasis: Int8Array
  readonly expressionScales: Float32Array
  readonly componentId: Uint8Array
  readonly materialId: Uint8Array
  readonly regionId: Uint8Array
  readonly landmarkIndices: Uint16Array
  readonly landmarkWeights: Float32Array
  readonly identity: Float32Array
  readonly expression: Float32Array
  readonly rotations: Float32Array
  readonly translation: Float32Array
  readonly jointsWorld: Float32Array
  dirty: boolean

  setIdentityParam(index: number, value: number): void
  setExpressionParam(index: number, value: number): void
  setIdentityVector(values: ArrayLike<number>): void
  setExpressionVector(values: ArrayLike<number>): void
  resetIdentity(): void
  resetExpression(): void
  setJointRotation(
    jointIndex: number,
    x: number,
    y: number,
    z: number,
  ): void
  setTranslation(x: number, y: number, z: number): void
  resetPose(): void
  computeVertices(out: Float32Array): void
}
