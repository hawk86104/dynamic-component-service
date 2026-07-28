/**
 * JavaScript port of google/xrblocks demos/gnm/GNMModel.js.
 *
 * The forward pass mirrors gnm/shape/gnm_common.py:
 *   bind = template + identity_basis^T id + expression_basis^T expression
 *   joints = template_joints + joint_identity_basis^T id
 *   world = LinearBlendSkinning(bind, FK(joints, rotations))
 *
 * Local changes are limited to container validation and AbortSignal-aware,
 * indeterminate-capable progress loading.
 */
const MAGIC = 0x474E4D57 // GNMW
const EPSILON = 1e-8
const MAX_INCREMENTAL_UPDATES = 2000

const DTYPE_CTORS = {
  float32: Float32Array,
  int8: Int8Array,
  uint8: Uint8Array,
  uint16: Uint16Array,
  int32: Int32Array,
}

export function parseContainer(buffer) {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 12) {
    throw new Error('Invalid GNMW container buffer.')
  }

  const view = new DataView(buffer)
  const magic = (view.getUint8(0) << 24)
    | (view.getUint8(1) << 16)
    | (view.getUint8(2) << 8)
    | view.getUint8(3)
  if (magic !== MAGIC) {
    throw new Error('Not a GNMW container.')
  }

  const version = view.getUint32(4, true)
  if (version !== 1) {
    throw new Error(`Unsupported GNMW version ${version}.`)
  }

  const headerLength = view.getUint32(8, true)
  if (12 + headerLength > buffer.byteLength) {
    throw new Error('Truncated GNMW header.')
  }

  const headerText = new TextDecoder().decode(
    new Uint8Array(buffer, 12, headerLength),
  )
  const header = JSON.parse(headerText)
  const base = 12 + headerLength
  const sections = {}

  for (const section of header.sections) {
    const Ctor = DTYPE_CTORS[section.dtype]
    if (!Ctor) {
      throw new Error(`Unsupported GNMW dtype ${section.dtype}.`)
    }
    const byteOffset = base + section.offset
    const byteEnd = byteOffset + section.byteLength
    if (byteOffset < base || byteEnd > buffer.byteLength) {
      throw new Error(`Truncated GNMW section ${section.name}.`)
    }
    sections[section.name] = new Ctor(
      buffer,
      byteOffset,
      section.byteLength / Ctor.BYTES_PER_ELEMENT,
    )
  }

  return { meta: header.meta, sections }
}

async function readIndeterminateBody(reader, onProgress) {
  const chunks = []
  let received = 0
  onProgress?.(0)

  for (;;) {
    const { done, value } = await reader.read()
    if (done) { break }
    chunks.push(value)
    received += value.length
  }

  const data = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    data.set(chunk, offset)
    offset += chunk.length
  }
  onProgress?.(1)
  return data.buffer
}

export async function fetchWithProgress(url, onProgress, signal) {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  const total = Number(response.headers.get('Content-Length')) || 0
  if (!response.body) {
    const buffer = await response.arrayBuffer()
    onProgress?.(1)
    return buffer
  }

  const reader = response.body.getReader()
  if (!total) {
    return readIndeterminateBody(reader, onProgress)
  }

  const data = new Uint8Array(total)
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) { break }

    if (received + value.length > total) {
      const chunks = [data.subarray(0, received), value]
      for (;;) {
        const next = await reader.read()
        if (next.done) { break }
        chunks.push(next.value)
      }

      const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
      const output = new Uint8Array(length)
      let offset = 0
      for (const chunk of chunks) {
        output.set(chunk, offset)
        offset += chunk.length
      }
      onProgress?.(1)
      return output.buffer
    }

    data.set(value, received)
    received += value.length
    onProgress?.(received / total)
  }

  onProgress?.(1)
  return data.buffer.byteLength === received
    ? data.buffer
    : data.slice(0, received).buffer
}

export function axisAngleToMatrix(x, y, z, out, offset = 0) {
  const normSquared = x * x + y * y + z * z
  const angle = Math.sqrt(Math.max(normSquared, EPSILON))
  const ax = x / angle
  const ay = y / angle
  const az = z / angle
  const sin = Math.sin(angle)
  const cos = Math.cos(angle)
  const oneMinusCos = 1 - cos

  out[offset] = cos + oneMinusCos * ax * ax
  out[offset + 1] = oneMinusCos * ax * ay - sin * az
  out[offset + 2] = oneMinusCos * ax * az + sin * ay
  out[offset + 3] = oneMinusCos * ax * ay + sin * az
  out[offset + 4] = cos + oneMinusCos * ay * ay
  out[offset + 5] = oneMinusCos * ay * az - sin * ax
  out[offset + 6] = oneMinusCos * ax * az - sin * ay
  out[offset + 7] = oneMinusCos * ay * az + sin * ax
  out[offset + 8] = cos + oneMinusCos * az * az
}

export class GNMHeadModel {
  constructor(meta, sections) {
    this.meta = meta
    this.numVertices = meta.numVertices
    this.numJoints = meta.numJoints
    this.identityDim = meta.identityDim
    this.expressionDim = meta.expressionDim

    this.template = sections.template
    this.triangles = sections.triangles
    this.quads = sections.quads
    this.templateJoints = sections.template_joints
    this.jointParents = sections.joint_parents
    this.skinningWeights = sections.skinning_weights
    this.jointIdentityBasis = sections.joint_identity_basis
    this.identityBasis = sections.identity_basis
    this.identityScales = sections.identity_scales
    this.expressionBasis = sections.expression_basis
    this.expressionScales = sections.expression_scales
    this.componentId = sections.component_id
    this.materialId = sections.material_id
    this.regionId = sections.region_id
    this.landmarkIndices = sections.landmark_indices
    this.landmarkWeights = sections.landmark_weights

    const vertexValues = this.numVertices * 3
    this.identity = new Float32Array(this.identityDim)
    this.expression = new Float32Array(this.expressionDim)
    this.rotations = new Float32Array(this.numJoints * 3)
    this.translation = new Float32Array(3)

    this._idSum = new Float32Array(vertexValues)
    this._exprSum = new Float32Array(vertexValues)
    this._incrementalUpdates = 0
    this._bind = new Float32Array(vertexValues)
    this._jointsBind = new Float32Array(this.numJoints * 3)
    this._rotWorld = new Float32Array(this.numJoints * 9)
    this._skinTrans = new Float32Array(this.numJoints * 3)
    this._localRotation = new Float32Array(9)
    this.jointsWorld = new Float32Array(this.numJoints * 3)
    this.dirty = true
  }

  static async load(url, onProgress, signal) {
    const buffer = await fetchWithProgress(url, onProgress, signal)
    const { meta, sections } = parseContainer(buffer)
    return new GNMHeadModel(meta, sections)
  }

  _addComponent(sum, basis, index, factor) {
    if (factor === 0) { return }
    const offset = index * sum.length
    for (let valueIndex = 0; valueIndex < sum.length; ++valueIndex) {
      sum[valueIndex] += basis[offset + valueIndex] * factor
    }
  }

  _accumulate(sum, basis, scales, coefficients) {
    sum.fill(0)
    for (let index = 0; index < coefficients.length; ++index) {
      const coefficient = coefficients[index]
      if (coefficient !== 0) {
        this._addComponent(
          sum,
          basis,
          index,
          coefficient * scales[index],
        )
      }
    }
  }

  _maybeReaccumulate() {
    if (++this._incrementalUpdates < MAX_INCREMENTAL_UPDATES) { return }
    this._incrementalUpdates = 0
    this._accumulate(
      this._idSum,
      this.identityBasis,
      this.identityScales,
      this.identity,
    )
    this._accumulate(
      this._exprSum,
      this.expressionBasis,
      this.expressionScales,
      this.expression,
    )
  }

  setIdentityParam(index, value) {
    const delta = value - this.identity[index]
    if (delta === 0) { return }
    this.identity[index] = value
    this._addComponent(
      this._idSum,
      this.identityBasis,
      index,
      delta * this.identityScales[index],
    )
    this._maybeReaccumulate()
    this.dirty = true
  }

  setExpressionParam(index, value) {
    const delta = value - this.expression[index]
    if (delta === 0) { return }
    this.expression[index] = value
    this._addComponent(
      this._exprSum,
      this.expressionBasis,
      index,
      delta * this.expressionScales[index],
    )
    this._maybeReaccumulate()
    this.dirty = true
  }

  setIdentityVector(values) {
    this.identity.set(
      values.subarray ? values : Float32Array.from(values),
    )
    this._accumulate(
      this._idSum,
      this.identityBasis,
      this.identityScales,
      this.identity,
    )
    this.dirty = true
  }

  setExpressionVector(values) {
    this.expression.set(
      values.subarray ? values : Float32Array.from(values),
    )
    this._accumulate(
      this._exprSum,
      this.expressionBasis,
      this.expressionScales,
      this.expression,
    )
    this.dirty = true
  }

  resetIdentity() {
    this.setIdentityVector(new Float32Array(this.identityDim))
  }

  resetExpression() {
    this.setExpressionVector(new Float32Array(this.expressionDim))
  }

  setJointRotation(jointIndex, x, y, z) {
    const offset = jointIndex * 3
    this.rotations[offset] = x
    this.rotations[offset + 1] = y
    this.rotations[offset + 2] = z
    this.dirty = true
  }

  setTranslation(x, y, z) {
    this.translation[0] = x
    this.translation[1] = y
    this.translation[2] = z
    this.dirty = true
  }

  resetPose() {
    this.rotations.fill(0)
    this.translation.fill(0)
    this.dirty = true
  }

  _computeJointsBind() {
    const output = this._jointsBind
    output.set(this.templateJoints)
    const stride = this.numJoints * 3

    for (let index = 0; index < this.identityDim; ++index) {
      const coefficient = this.identity[index]
      if (coefficient === 0) { continue }
      const offset = index * stride
      for (let valueIndex = 0; valueIndex < stride; ++valueIndex) {
        output[valueIndex]
          += this.jointIdentityBasis[offset + valueIndex] * coefficient
      }
    }
  }

  _computeJointTransforms() {
    const joints = this._jointsBind
    const rotWorld = this._rotWorld
    const worldTranslation = this.jointsWorld
    const localRotation = this._localRotation

    for (let joint = 0; joint < this.numJoints; ++joint) {
      axisAngleToMatrix(
        this.rotations[joint * 3],
        this.rotations[joint * 3 + 1],
        this.rotations[joint * 3 + 2],
        localRotation,
      )

      if (joint === 0) {
        rotWorld.set(localRotation, 0)
        worldTranslation[0] = joints[0] + this.translation[0]
        worldTranslation[1] = joints[1] + this.translation[1]
        worldTranslation[2] = joints[2] + this.translation[2]
        continue
      }

      const parent = this.jointParents[joint]
      const localX = joints[joint * 3] - joints[parent * 3]
      const localY = joints[joint * 3 + 1] - joints[parent * 3 + 1]
      const localZ = joints[joint * 3 + 2] - joints[parent * 3 + 2]
      const parentOffset = parent * 9
      const jointOffset = joint * 9

      for (let row = 0; row < 3; ++row) {
        for (let column = 0; column < 3; ++column) {
          rotWorld[jointOffset + row * 3 + column]
            = rotWorld[parentOffset + row * 3] * localRotation[column]
              + rotWorld[parentOffset + row * 3 + 1]
              * localRotation[3 + column]
              + rotWorld[parentOffset + row * 3 + 2]
              * localRotation[6 + column]
        }
      }

      worldTranslation[joint * 3]
        = rotWorld[parentOffset] * localX
          + rotWorld[parentOffset + 1] * localY
          + rotWorld[parentOffset + 2] * localZ
          + worldTranslation[parent * 3]
      worldTranslation[joint * 3 + 1]
        = rotWorld[parentOffset + 3] * localX
          + rotWorld[parentOffset + 4] * localY
          + rotWorld[parentOffset + 5] * localZ
          + worldTranslation[parent * 3 + 1]
      worldTranslation[joint * 3 + 2]
        = rotWorld[parentOffset + 6] * localX
          + rotWorld[parentOffset + 7] * localY
          + rotWorld[parentOffset + 8] * localZ
          + worldTranslation[parent * 3 + 2]
    }

    for (let joint = 0; joint < this.numJoints; ++joint) {
      const rotationOffset = joint * 9
      const jointX = joints[joint * 3]
      const jointY = joints[joint * 3 + 1]
      const jointZ = joints[joint * 3 + 2]
      this._skinTrans[joint * 3]
        = worldTranslation[joint * 3]
          - (
            rotWorld[rotationOffset] * jointX
            + rotWorld[rotationOffset + 1] * jointY
            + rotWorld[rotationOffset + 2] * jointZ
          )
      this._skinTrans[joint * 3 + 1]
        = worldTranslation[joint * 3 + 1]
          - (
            rotWorld[rotationOffset + 3] * jointX
            + rotWorld[rotationOffset + 4] * jointY
            + rotWorld[rotationOffset + 5] * jointZ
          )
      this._skinTrans[joint * 3 + 2]
        = worldTranslation[joint * 3 + 2]
          - (
            rotWorld[rotationOffset + 6] * jointX
            + rotWorld[rotationOffset + 7] * jointY
            + rotWorld[rotationOffset + 8] * jointZ
          )
    }
  }

  computeVertices(output) {
    const valueCount = this.numVertices * 3
    for (let valueIndex = 0; valueIndex < valueCount; ++valueIndex) {
      this._bind[valueIndex]
        = this.template[valueIndex]
          + this._idSum[valueIndex]
          + this._exprSum[valueIndex]
    }

    this._computeJointsBind()
    this._computeJointTransforms()

    for (let vertex = 0; vertex < this.numVertices; ++vertex) {
      const x = this._bind[vertex * 3]
      const y = this._bind[vertex * 3 + 1]
      const z = this._bind[vertex * 3 + 2]
      let outputX = 0
      let outputY = 0
      let outputZ = 0

      for (let joint = 0; joint < this.numJoints; ++joint) {
        const weight = this.skinningWeights[
          joint * this.numVertices + vertex
        ]
        if (weight === 0) { continue }
        const rotationOffset = joint * 9
        outputX += weight * (
          this._rotWorld[rotationOffset] * x
          + this._rotWorld[rotationOffset + 1] * y
          + this._rotWorld[rotationOffset + 2] * z
          + this._skinTrans[joint * 3]
        )
        outputY += weight * (
          this._rotWorld[rotationOffset + 3] * x
          + this._rotWorld[rotationOffset + 4] * y
          + this._rotWorld[rotationOffset + 5] * z
          + this._skinTrans[joint * 3 + 1]
        )
        outputZ += weight * (
          this._rotWorld[rotationOffset + 6] * x
          + this._rotWorld[rotationOffset + 7] * y
          + this._rotWorld[rotationOffset + 8] * z
          + this._skinTrans[joint * 3 + 2]
        )
      }

      output[vertex * 3] = outputX
      output[vertex * 3 + 1] = outputY
      output[vertex * 3 + 2] = outputZ
    }
    this.dirty = false
  }
}
