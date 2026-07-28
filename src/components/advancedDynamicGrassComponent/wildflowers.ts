import * as THREE from 'three'
import flowerFragmentShader from '../../shader/advancedDynamicGrassComponent/wildflower.frag?raw'
import flowerVertexShader from '../../shader/advancedDynamicGrassComponent/wildflower.vert?raw'
import { sampleSurfaceData, surfaceArea } from './surfaceSampler'
import type { GrassWindOptions, WildflowerOptions } from './types'

interface FlowerPalette {
  petal: THREE.Color
  foliage: THREE.Color
  centre: THREE.Color
}

interface FlowerUniforms extends Record<string, THREE.IUniform> {
  uMask: THREE.IUniform<THREE.Texture>
  uTime: THREE.IUniform<number>
  uWindStrength: THREE.IUniform<number>
  uWindSpeed: THREE.IUniform<number>
  uWindFrequency: THREE.IUniform<number>
  uWindTurbulence: THREE.IUniform<number>
  uWindLean: THREE.IUniform<number>
  uWindDirection: THREE.IUniform<THREE.Vector2>
}

const MASK_TILE_WIDTH = 160
const MASK_HEIGHT = 256
const MASK_VARIANTS = 3
const MAX_FLOWER_COUNT = 2_000

const FLOWER_PALETTES: readonly FlowerPalette[] = [
  {
    petal: new THREE.Color('#e9a5be'),
    foliage: new THREE.Color('#467628'),
    centre: new THREE.Color('#f3c463'),
  },
  {
    petal: new THREE.Color('#9e8bd7'),
    foliage: new THREE.Color('#3f7043'),
    centre: new THREE.Color('#f0d178'),
  },
  {
    petal: new THREE.Color('#e9b665'),
    foliage: new THREE.Color('#58782c'),
    centre: new THREE.Color('#bf6950'),
  },
  {
    petal: new THREE.Color('#9aa9df'),
    foliage: new THREE.Color('#466b50'),
    centre: new THREE.Color('#f3c7a2'),
  },
]

function seededRandom(seed: number): () => number {
  let state = seed >>> 0

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

function setMaskColor(
  context: CanvasRenderingContext2D,
  channel: 'petal' | 'foliage' | 'centre',
): void {
  context.fillStyle = channel === 'petal'
    ? '#ff0000'
    : channel === 'foliage'
      ? '#00ff00'
      : '#0000ff'
  context.strokeStyle = context.fillStyle
}

function drawStem(
  context: CanvasRenderingContext2D,
  points: readonly [number, number][],
  width: number,
): void {
  setMaskColor(context, 'foliage')
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = width
  context.beginPath()
  context.moveTo(points[0][0], points[0][1])

  for (let index = 1; index < points.length; index += 1) {
    context.lineTo(points[index][0], points[index][1])
  }

  context.stroke()
}

function drawLeaf(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
): void {
  setMaskColor(context, 'foliage')
  context.save()
  context.translate(x, y)
  context.rotate(angle)
  context.beginPath()
  context.moveTo(0, 0)
  context.quadraticCurveTo(length * 0.35, -length * 0.18, length, 0)
  context.quadraticCurveTo(length * 0.35, length * 0.18, 0, 0)
  context.fill()
  context.restore()
}

function drawPetals(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  petals: number,
): void {
  setMaskColor(context, 'petal')

  for (let index = 0; index < petals; index += 1) {
    context.save()
    context.translate(x, y)
    context.rotate((index / petals) * Math.PI * 2)
    context.beginPath()
    context.ellipse(0, -radius * 0.62, radius * 0.28, radius * 0.58, 0, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }

  setMaskColor(context, 'centre')
  context.beginPath()
  context.arc(x, y, radius * 0.26, 0, Math.PI * 2)
  context.fill()
}

function drawDaisy(context: CanvasRenderingContext2D, x: number): void {
  const stemX = x + 81
  drawStem(
    context,
    [
      [stemX, 248],
      [stemX - 3, 170],
      [stemX + 3, 101],
    ],
    7,
  )
  drawLeaf(context, stemX - 2, 185, Math.PI * 0.78, 52)
  drawLeaf(context, stemX + 1, 151, -Math.PI * 0.66, 45)
  drawPetals(context, stemX + 3, 72, 45, 9)
}

function drawFlowerSpike(context: CanvasRenderingContext2D, x: number): void {
  const stemX = x + 79
  drawStem(
    context,
    [
      [stemX, 249],
      [stemX - 2, 172],
      [stemX + 5, 58],
    ],
    7,
  )
  drawLeaf(context, stemX - 2, 184, Math.PI * 0.84, 51)
  drawLeaf(context, stemX + 1, 154, -Math.PI * 0.75, 38)
  setMaskColor(context, 'petal')

  for (let index = 0; index < 9; index += 1) {
    const y = 118 - index * 9
    const width = 22 - index * 1.2

    context.beginPath()
    context.ellipse(
      stemX + (index % 2 === 0 ? -6 : 6),
      y,
      width * 0.52,
      8,
      index % 2 === 0 ? -0.38 : 0.38,
      0,
      Math.PI * 2,
    )
    context.fill()
  }

  setMaskColor(context, 'centre')
  context.beginPath()
  context.ellipse(stemX + 4, 50, 6, 10, 0, 0, Math.PI * 2)
  context.fill()
}

function drawBranchingFlowers(context: CanvasRenderingContext2D, x: number): void {
  const stemX = x + 73
  drawStem(
    context,
    [
      [stemX, 249],
      [stemX - 3, 185],
      [stemX + 8, 133],
      [stemX + 24, 68],
    ],
    6,
  )
  drawStem(
    context,
    [
      [stemX + 2, 184],
      [stemX - 31, 139],
      [stemX - 43, 108],
    ],
    5,
  )
  drawStem(
    context,
    [
      [stemX + 9, 139],
      [stemX + 43, 113],
    ],
    5,
  )
  drawLeaf(context, stemX - 1, 197, Math.PI * 0.83, 47)
  drawLeaf(context, stemX + 4, 162, -Math.PI * 0.64, 43)
  drawLeaf(context, stemX + 14, 139, Math.PI * 0.64, 35)
  drawPetals(context, stemX + 24, 55, 31, 8)
  drawPetals(context, stemX - 45, 98, 23, 7)
  drawPetals(context, stemX + 49, 108, 21, 7)
}

function createMaskTexture(): THREE.Texture {
  if (typeof document === 'undefined') {
    const texture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1)
    texture.needsUpdate = true
    return texture
  }

  const canvas = document.createElement('canvas')
  canvas.width = MASK_TILE_WIDTH * MASK_VARIANTS
  canvas.height = MASK_HEIGHT
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to create the procedural wildflower texture.')
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  drawDaisy(context, 0)
  drawFlowerSpike(context, MASK_TILE_WIDTH)
  drawBranchingFlowers(context, MASK_TILE_WIDTH * 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.NoColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return texture
}

function variedColor(
  color: THREE.Color,
  random: () => number,
  hue: number,
  saturation: number,
  lightness: number,
): THREE.Color {
  return color.clone().offsetHSL(
    (random() - 0.5) * hue,
    (random() - 0.5) * saturation,
    (random() - 0.5) * lightness,
  )
}

function writeColor(colors: Float32Array, index: number, color: THREE.Color): void {
  const offset = index * 3
  colors[offset] = color.r
  colors[offset + 1] = color.g
  colors[offset + 2] = color.b
}

function createFlowerGeometry(count: number, random: () => number): THREE.PlaneGeometry {
  const variants = new Float32Array(count)
  const petalColors = new Float32Array(count * 3)
  const foliageColors = new Float32Array(count * 3)
  const centreColors = new Float32Array(count * 3)

  for (let index = 0; index < count; index += 1) {
    const palette = FLOWER_PALETTES[Math.floor(random() * FLOWER_PALETTES.length)]
    variants[index] = (index + Math.floor(random() * MASK_VARIANTS)) % MASK_VARIANTS
    writeColor(petalColors, index, variedColor(palette.petal, random, 0.06, 0.1, 0.08))
    writeColor(foliageColors, index, variedColor(palette.foliage, random, 0.025, 0.06, 0.04))
    writeColor(centreColors, index, variedColor(palette.centre, random, 0.04, 0.08, 0.06))
  }

  const geometry = new THREE.PlaneGeometry(1, 1)
  geometry.translate(0, 0.5, 0)
  geometry.setAttribute('aVariant', new THREE.InstancedBufferAttribute(variants, 1))
  geometry.setAttribute('aPetalColor', new THREE.InstancedBufferAttribute(petalColors, 3))
  geometry.setAttribute('aFoliageColor', new THREE.InstancedBufferAttribute(foliageColors, 3))
  geometry.setAttribute('aCentreColor', new THREE.InstancedBufferAttribute(centreColors, 3))
  return geometry
}

function createUniforms(mask: THREE.Texture): FlowerUniforms {
  return {
    uMask: { value: mask },
    uTime: { value: 0 },
    uWindStrength: { value: 0 },
    uWindSpeed: { value: 0 },
    uWindFrequency: { value: 0 },
    uWindTurbulence: { value: 0 },
    uWindLean: { value: 0 },
    uWindDirection: { value: new THREE.Vector2() },
  }
}

export class Wildflowers extends THREE.Group {
  readonly flowerCount: number

  private readonly flowers: THREE.InstancedMesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private readonly uniforms: FlowerUniforms
  private disposed = false

  constructor(options: WildflowerOptions) {
    super()

    const requestedCount = Math.min(
      MAX_FLOWER_COUNT,
      options.maxCount,
      Math.round(surfaceArea(options.surface) * options.density),
    )
    const samples = sampleSurfaceData(options.surface, requestedCount, options.seed)
    const random = seededRandom(options.seed ^ 0x85EBCA6B)
    const mask = createMaskTexture()

    this.uniforms = createUniforms(mask)
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: flowerVertexShader,
      fragmentShader: flowerFragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.28,
      depthWrite: true,
      toneMapped: true,
    })

    this.flowers = new THREE.InstancedMesh(
      createFlowerGeometry(samples.length, random),
      material,
      samples.length,
    )
    this.flowers.frustumCulled = false
    this.flowerCount = samples.length
    this.setWind(options.wind)

    this.updateWorldMatrix(true, false)
    const worldToLocal = this.matrixWorld.clone().invert()
    const up = THREE.Object3D.DEFAULT_UP
    const root = new THREE.Vector3()
    const localNormal = new THREE.Vector3()
    const rotation = new THREE.Quaternion()
    const spin = new THREE.Quaternion()
    const matrix = new THREE.Matrix4()
    const scale = new THREE.Vector3()

    for (let index = 0; index < samples.length; index += 1) {
      const height = THREE.MathUtils.lerp(0.32, 0.72, random())
      root.copy(samples[index].position).applyMatrix4(worldToLocal)
      localNormal.copy(samples[index].normal).transformDirection(worldToLocal).normalize()
      rotation.setFromUnitVectors(up, localNormal)
      spin.setFromAxisAngle(up, random() * Math.PI * 2)
      rotation.multiply(spin)
      matrix.compose(
        root,
        rotation,
        scale.set(height * THREE.MathUtils.lerp(0.45, 0.62, random()), height, 1),
      )
      this.flowers.setMatrixAt(index, matrix)
    }

    this.flowers.instanceMatrix.needsUpdate = true
    this.add(this.flowers)
  }

  update(timeSeconds: number): void {
    if (this.disposed) {
      return
    }

    this.uniforms.uTime.value = timeSeconds
  }

  setWind(wind: GrassWindOptions): void {
    if (this.disposed) {
      return
    }

    const radians = THREE.MathUtils.degToRad(wind.direction)
    const x = Math.cos(radians)
    const z = Math.sin(radians)

    this.uniforms.uWindStrength.value = wind.strength
    this.uniforms.uWindSpeed.value = wind.speed
    this.uniforms.uWindFrequency.value = wind.frequency
    this.uniforms.uWindTurbulence.value = wind.turbulence
    this.uniforms.uWindLean.value = wind.lean
    this.uniforms.uWindDirection.value.set(
      Math.abs(x) < Number.EPSILON ? 0 : x,
      Math.abs(z) < Number.EPSILON ? 0 : z,
    )
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.remove(this.flowers)
    this.flowers.geometry.dispose()
    this.uniforms.uMask.value.dispose()
    this.flowers.material.dispose()
    this.clear()
  }
}
