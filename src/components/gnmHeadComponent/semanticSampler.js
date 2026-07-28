/**
 * JavaScript port of google/xrblocks demos/gnm/SemanticSampler.js.
 * Modified locally to thread AbortSignal through the staged loader.
 */
import { fetchWithProgress, parseContainer } from './gnmModel.js'

/** Deterministic 32-bit PRNG (mulberry32). */
export function createRng(seed) {
  let state = seed >>> 0
  return function () {
    state = (state + 0x6D2B79F5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gaussian(rng) {
  let u = 0
  while (u === 0) { u = rng() }
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

class MLPDecoder {
  constructor(layers) {
    this.layers = layers
    this.inputDim = layers[0].inputDim
    this.outputDim = layers[layers.length - 1].outputDim
    let maxDim = this.inputDim
    for (const layer of layers) { maxDim = Math.max(maxDim, layer.outputDim) }
    this._bufferA = new Float32Array(maxDim)
    this._bufferB = new Float32Array(maxDim)
  }

  forward(input) {
    let x = this._bufferA
    let y = this._bufferB
    x.set(input)
    let currentDim = this.inputDim

    for (const layer of this.layers) {
      const { weights, bias, activation, outputDim } = layer
      for (let o = 0; o < outputDim; ++o) {
        let acc = bias[o]
        for (let i = 0; i < currentDim; ++i) {
          acc += x[i] * weights[i * outputDim + o]
        }
        y[o] = activation === 'relu' && acc < 0 ? 0 : acc
      }
      ;[x, y] = [y, x]
      currentDim = outputDim
    }

    return x.slice(0, currentDim)
  }
}

export class GNMSamplers {
  constructor(meta, sections) {
    this.identityMeta = meta.identity
    this.expressionMeta = meta.expression
    this.identityDecoder = new MLPDecoder(
      meta.identity.layers.map(layer => ({
        ...layer,
        weights: sections[layer.weights],
        bias: sections[layer.bias],
      })),
    )
    this.expressionDecoder = new MLPDecoder(
      meta.expression.layers.map(layer => ({
        ...layer,
        weights: sections[layer.weights],
        bias: sections[layer.bias],
      })),
    )
    this.genders = meta.identity.genders
    this.ethnicities = meta.identity.ethnicities
    this.expressionClasses = meta.expression.labels
    this._rng = createRng(20260717)
  }

  static async load(url, onProgress, signal) {
    const buffer = await fetchWithProgress(url, onProgress, signal)
    const { meta, sections } = parseContainer(buffer)
    return new GNMSamplers(meta, sections)
  }

  seed(value) {
    this._rng = createRng(value)
  }

  _sampleLatent(dim, sigma) {
    const z = new Float32Array(dim)
    for (let i = 0; i < dim; ++i) { z[i] = gaussian(this._rng) * sigma }
    return z
  }

  sampleIdentity(genderWeights, ethnicityWeights, sigma = 1) {
    const { latentDim } = this.identityMeta
    const input = new Float32Array(this.identityDecoder.inputDim)
    input.set(this._sampleLatent(latentDim, sigma), 0)
    normalizeInto(input, latentDim, genderWeights)
    normalizeInto(input, latentDim + genderWeights.length, ethnicityWeights)
    return this.identityDecoder.forward(input)
  }

  sampleExpression(classWeights, sigma = 1) {
    const { latentDim } = this.expressionMeta
    const entries = typeof classWeights === 'number'
      ? [[classWeights, 1]]
      : Object.entries(classWeights).map(([key, weight]) => [
          Number(key),
          weight,
        ])
    let total = 0
    for (const [, weight] of entries) { total += weight }
    if (!(total > 0)) { total = 1 }

    const input = new Float32Array(this.expressionDecoder.inputDim)
    for (const [classIndex, weight] of entries) {
      const normalizedWeight = weight / total
      if (normalizedWeight === 0) { continue }
      const z = this._sampleLatent(latentDim, sigma)
      for (let i = 0; i < latentDim; ++i) {
        input[i] += z[i] * normalizedWeight
      }
      input[latentDim + classIndex] += normalizedWeight
    }
    return this.expressionDecoder.forward(input)
  }

  randomIdentity(sigma = 1) {
    const genderWeights = this.genders.map(() => this._rng())
    const ethnicityWeights = this.ethnicities.map(() => this._rng())
    return this.sampleIdentity(genderWeights, ethnicityWeights, sigma)
  }

  randomExpression(sigma = 1, maxClasses = 3) {
    const count = 2 + Math.floor(this._rng() * (maxClasses - 1))
    const chosen = new Set()
    while (chosen.size < count) {
      chosen.add(Math.floor(this._rng() * this.expressionClasses.length))
    }
    const weights = {}
    for (const classIndex of chosen) { weights[classIndex] = this._rng() }
    return this.sampleExpression(weights, sigma)
  }
}

function normalizeInto(target, offset, weights) {
  let total = 0
  for (const weight of weights) { total += weight }
  if (!(total > 0)) { total = 1 }
  for (let i = 0; i < weights.length; ++i) {
    target[offset + i] = weights[i] / total
  }
}
