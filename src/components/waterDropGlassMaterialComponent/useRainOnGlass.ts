import * as THREE from 'three'
import type { SanitizedWaterDropGlassConfig } from './types'

interface DropState {
  isNew: boolean
  killed: boolean
  lastSpawn: number
  momentum: number
  momentumX: number
  nextSpawn: number
  parent: DropState | null
  r: number
  shrink: number
  spreadX: number
  spreadY: number
  x: number
  y: number
}

interface RainSimulationOptions {
  autoShrink: boolean
  collisionBoost: number
  collisionBoostMultiplier: number
  collisionRadius: number
  collisionRadiusIncrease: number
  dropFallMultiplier: number
  dropletsCleaningRadiusMultiplier: number
  dropletsRate: number
  dropletsSize: [number, number]
  globalTimeScale: number
  maxDrops: number
  maxR: number
  minR: number
  rainChance: number
  rainLimit: number
  raining: boolean
  spawnArea: [number, number]
  trailRate: number
  trailScaleRange: [number, number]
}

interface DropGraphics {
  clearDropletsGfx: HTMLCanvasElement
  dropsGfx: HTMLCanvasElement[]
}

export interface RainOnGlassSimulation {
  backgroundTexture: THREE.CanvasTexture
  foregroundTexture: THREE.CanvasTexture
  normalTexture: THREE.CanvasTexture
  resolution: THREE.Vector2
  setConfig: (config: SanitizedWaterDropGlassConfig) => void
  shineTexture: THREE.CanvasTexture
  update: (deltaSeconds: number) => void
  waterTexture: THREE.CanvasTexture
  dispose: () => void
}

const TEXTURE_SIZE = 1024
const SHINE_TEXTURE_SIZE = 512
const DROP_SIZE = 64
const DEPTH_VARIANTS = 255

const DEFAULT_DROPLETS_CLEANING_RADIUS_MULTIPLIER = 0.28
const DEFAULT_TRAIL_SCALE_RANGE: [number, number] = [0.25, 0.35]
const DEFAULT_SPAWN_AREA: [number, number] = [-0.1, 0.95]
const DEFAULT_COLLISION_BOOST_MULTIPLIER = 0.05
const DEFAULT_COLLISION_BOOST = 1
const DEFAULT_DROP_FALL_MULTIPLIER = 1

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const random = (from = 0, to = 1, interp?: (value: number) => number) => {
  const delta = to - from
  const transform = interp ?? (value => value)
  return from + transform(Math.random()) * delta
}

const chance = (value: number) => Math.random() <= value

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

const getCanvasContext = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to create 2D canvas context for waterDropGlassMaterialComponent.')
  }

  return context
}

class SeededRandom {
  private seed = 42

  reset(nextSeed = 42) {
    this.seed = nextSeed
  }

  next() {
    this.seed = (this.seed * 16807) % 2147483647
    return (this.seed - 1) / 2147483646
  }
}

const generateDropAlpha = (size: number) => {
  const canvas = createCanvas(size, size)
  const context = getCanvasContext(canvas)
  const image = context.createImageData(size, size)
  const { data } = image
  const centerX = size / 2
  const centerY = size / 2

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const dx = (px - centerX) / centerX
      let dy = (py - centerY) / centerY
      dy *= 1 + dy * 0.15
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 1) {
        continue
      }

      const alpha = Math.max(0, 1 - (distance / 0.35) ** 6) * 255
      const index = (py * size + px) * 4

      data[index] = 255
      data[index + 1] = 255
      data[index + 2] = 255
      data[index + 3] = Math.round(clamp(alpha, 0, 255))
    }
  }

  context.putImageData(image, 0, 0)
  return canvas
}

const generateDropColor = (size: number) => {
  const canvas = createCanvas(size, size)
  const context = getCanvasContext(canvas)
  const image = context.createImageData(size, size)
  const { data } = image
  const centerX = size / 2
  const centerY = size / 2

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const dx = (px - centerX) / centerX
      let dy = (py - centerY) / centerY
      dy *= 1 + dy * 0.15
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 1) {
        continue
      }

      const nx = distance > 0.001 ? dx / distance : 0
      const ny = distance > 0.001 ? dy / distance : 0
      const strength = distance

      const r = Math.round(ny * 60 * strength + 128)
      const g = Math.round(nx * 60 * strength + 128)
      const depth = Math.sqrt(Math.max(0, 1 - distance * distance)) * 255
      const index = (py * size + px) * 4

      data[index] = clamp(r, 0, 255)
      data[index + 1] = clamp(g, 0, 255)
      data[index + 2] = Math.round(depth)
      data[index + 3] = 255
    }
  }

  context.putImageData(image, 0, 0)
  return canvas
}

const createDropGraphics = (dropAlphaTexture: HTMLCanvasElement, dropColorTexture: HTMLCanvasElement): DropGraphics => {
  const dropsGfx: HTMLCanvasElement[] = []
  const dropBuffer = createCanvas(DROP_SIZE, DROP_SIZE)
  const dropBufferContext = getCanvasContext(dropBuffer)

  for (let index = 0; index < DEPTH_VARIANTS; index += 1) {
    const dropCanvas = createCanvas(DROP_SIZE, DROP_SIZE)
    const dropContext = getCanvasContext(dropCanvas)

    dropBufferContext.clearRect(0, 0, DROP_SIZE, DROP_SIZE)
    dropBufferContext.globalCompositeOperation = 'source-over'
    dropBufferContext.drawImage(dropColorTexture, 0, 0, DROP_SIZE, DROP_SIZE)

    dropBufferContext.globalCompositeOperation = 'screen'
    dropBufferContext.fillStyle = `rgba(0, 0, ${index}, 1)`
    dropBufferContext.fillRect(0, 0, DROP_SIZE, DROP_SIZE)

    dropContext.globalCompositeOperation = 'source-over'
    dropContext.drawImage(dropAlphaTexture, 0, 0, DROP_SIZE, DROP_SIZE)
    dropContext.globalCompositeOperation = 'source-in'
    dropContext.drawImage(dropBuffer, 0, 0, DROP_SIZE, DROP_SIZE)

    dropsGfx.push(dropCanvas)
  }

  const clearDropletsGfx = createCanvas(128, 128)
  const clearContext = getCanvasContext(clearDropletsGfx)
  const clearGradient = clearContext.createRadialGradient(64, 64, 0, 64, 64, 64)

  clearGradient.addColorStop(0, 'rgba(0,0,0,1)')
  clearGradient.addColorStop(0.6, 'rgba(0,0,0,0.35)')
  clearGradient.addColorStop(1, 'rgba(0,0,0,0)')

  clearContext.fillStyle = clearGradient
  clearContext.fillRect(0, 0, 128, 128)

  return {
    clearDropletsGfx,
    dropsGfx,
  }
}

const drawAmberCity = (canvas: HTMLCanvasElement) => {
  const context = getCanvasContext(canvas)
  const { width, height } = canvas
  const rng = new SeededRandom()
  rng.reset(42)

  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#0c0a1a')
  sky.addColorStop(0.15, '#1a1228')
  sky.addColorStop(0.35, '#2a1830')
  sky.addColorStop(0.55, '#4a2520')
  sky.addColorStop(0.75, '#6a3818')
  sky.addColorStop(1, '#8a4a10')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  const glow = context.createLinearGradient(0, height * 0.3, 0, height)
  glow.addColorStop(0, 'rgba(200, 100, 30, 0)')
  glow.addColorStop(0.3, 'rgba(200, 120, 40, 0.15)')
  glow.addColorStop(0.6, 'rgba(210, 140, 50, 0.3)')
  glow.addColorStop(1, 'rgba(220, 150, 60, 0.5)')
  context.fillStyle = glow
  context.fillRect(0, 0, width, height)

  const buildingColors = ['#08060e', '#0a0812', '#0c0a16', '#0e0c1a']

  for (let index = 0; index < 35; index += 1) {
    const baseX = rng.next() * width * 1.3 - width * 0.15
    const baseWidth = width * 0.02 + rng.next() * width * 0.12
    const baseHeight = height * 0.15 + rng.next() * height * 0.55
    const baseY = height - baseHeight + rng.next() * height * 0.05

    context.fillStyle = buildingColors[index % buildingColors.length]
    context.fillRect(baseX, baseY, baseWidth, baseHeight)

    const rows = Math.floor(baseHeight / (height * 0.04))
    const cols = Math.floor(baseWidth / (width * 0.02))

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (rng.next() > 0.45) {
          const windowX = baseX + width * 0.005 + col * (width * 0.02)
          const windowY = baseY + height * 0.01 + row * (height * 0.04)
          const warmth = rng.next()

          if (warmth > 0.3) {
            context.fillStyle = `rgba(255, 200, 120, ${0.4 + rng.next() * 0.5})`
          }
          else if (warmth > 0.1) {
            context.fillStyle = `rgba(255, 160, 80, ${0.3 + rng.next() * 0.4})`
          }
          else {
            context.fillStyle = `rgba(180, 220, 255, ${0.2 + rng.next() * 0.3})`
          }

          context.fillRect(windowX, windowY, width * 0.008, height * 0.02)
        }
      }
    }
  }

  for (let index = 0; index < 80; index += 1) {
    const x = rng.next() * width
    const y = height * 0.1 + rng.next() * height * 0.85
    const radius = width * 0.02 + rng.next() * width * 0.15
    const picker = rng.next()
    let hue = 25
    let saturation = 80
    let lightness = 55

    if (picker < 0.45) {
      hue = 25 + rng.next() * 20
      saturation = 80 + rng.next() * 20
      lightness = 55 + rng.next() * 35
    }
    else if (picker < 0.7) {
      hue = 10 + rng.next() * 15
      saturation = 85 + rng.next() * 15
      lightness = 50 + rng.next() * 30
    }
    else if (picker < 0.85) {
      hue = 40 + rng.next() * 15
      saturation = 75 + rng.next() * 25
      lightness = 60 + rng.next() * 30
    }
    else if (picker < 0.93) {
      hue = 200 + rng.next() * 30
      saturation = 60 + rng.next() * 30
      lightness = 50 + rng.next() * 30
    }
    else {
      hue = 330 + rng.next() * 25
      saturation = 65 + rng.next() * 25
      lightness = 55 + rng.next() * 25
    }

    const alpha = 0.08 + rng.next() * 0.25
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha * 1.3})`)
    gradient.addColorStop(0.3, `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha * 0.6})`)
    gradient.addColorStop(0.6, `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha * 0.15})`)
    gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`)

    context.fillStyle = gradient
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
  }

  for (let index = 0; index < 25; index += 1) {
    const x = rng.next() * width
    const y = height * 0.15 + rng.next() * height * 0.75
    const radius = width * 0.006 + rng.next() * width * 0.02
    const alpha = 0.25 + rng.next() * 0.5

    context.fillStyle = `rgba(255, 214, 160, ${alpha})`
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
  }

  const vignette = context.createRadialGradient(
    width * 0.5,
    height * 0.55,
    width * 0.2,
    width * 0.5,
    height * 0.55,
    width * 0.8,
  )
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.35)')
  context.fillStyle = vignette
  context.fillRect(0, 0, width, height)
}

const generateCityBackground = (size: number, blurPx = 0) => {
  const sharpCanvas = createCanvas(size, size)
  drawAmberCity(sharpCanvas)

  if (blurPx <= 0) {
    return sharpCanvas
  }

  const blurredCanvas = createCanvas(size, size)
  const blurredContext = getCanvasContext(blurredCanvas)

  blurredContext.filter = `blur(${blurPx}px)`
  blurredContext.drawImage(sharpCanvas, -blurPx, -blurPx, size + blurPx * 2, size + blurPx * 2)
  blurredContext.filter = 'none'
  blurredContext.globalAlpha = 0.2
  blurredContext.drawImage(sharpCanvas, 0, 0)
  blurredContext.globalAlpha = 1

  return blurredCanvas
}

const generateShineMap = (size: number) => {
  const canvas = createCanvas(size, size)
  const context = getCanvasContext(canvas)

  const streak = context.createLinearGradient(0, size * 0.2, size, size * 0.9)
  streak.addColorStop(0, 'rgba(255,255,255,0)')
  streak.addColorStop(0.35, 'rgba(255,246,223,0.16)')
  streak.addColorStop(0.5, 'rgba(255,252,239,0.4)')
  streak.addColorStop(0.65, 'rgba(255,246,223,0.14)')
  streak.addColorStop(1, 'rgba(255,255,255,0)')

  context.fillStyle = streak
  context.fillRect(0, 0, size, size)

  context.fillStyle = 'rgba(255, 244, 216, 0.28)'
  context.beginPath()
  context.ellipse(size * 0.72, size * 0.26, size * 0.12, size * 0.05, -0.5, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = 'rgba(255, 255, 255, 0.2)'
  context.beginPath()
  context.ellipse(size * 0.28, size * 0.68, size * 0.08, size * 0.03, -0.35, 0, Math.PI * 2)
  context.fill()

  return canvas
}

class RainOnGlassSimulationImpl implements RainOnGlassSimulation {
  readonly backgroundTexture: THREE.CanvasTexture
  readonly foregroundTexture: THREE.CanvasTexture
  readonly normalTexture: THREE.CanvasTexture
  readonly resolution = new THREE.Vector2(TEXTURE_SIZE, TEXTURE_SIZE)
  readonly shineTexture: THREE.CanvasTexture
  readonly waterTexture: THREE.CanvasTexture

  private config: SanitizedWaterDropGlassConfig
  private readonly dropGraphics: DropGraphics
  private drops: DropState[] = []
  private dropletsCanvas = createCanvas(TEXTURE_SIZE, TEXTURE_SIZE)
  private dropletsContext = getCanvasContext(this.dropletsCanvas)
  private dropletsCounter = 0
  private readonly backgroundCanvas = generateCityBackground(TEXTURE_SIZE, 10)
  private readonly normalCanvas = createCanvas(TEXTURE_SIZE, TEXTURE_SIZE)
  private readonly normalContext = getCanvasContext(this.normalCanvas)
  private options: RainSimulationOptions
  private readonly foregroundCanvas = generateCityBackground(TEXTURE_SIZE, 0)
  private readonly rdCanvas = createCanvas(TEXTURE_SIZE, TEXTURE_SIZE)
  private readonly rdContext = getCanvasContext(this.rdCanvas)
  private textureCleaningIterations = 0

  constructor(config: SanitizedWaterDropGlassConfig) {
    this.config = config

    const dropAlphaTexture = generateDropAlpha(DROP_SIZE)
    const dropColorTexture = generateDropColor(DROP_SIZE)
    this.dropGraphics = createDropGraphics(dropAlphaTexture, dropColorTexture)
    this.options = this.buildOptions(config)

    this.waterTexture = new THREE.CanvasTexture(this.rdCanvas)
    this.normalTexture = new THREE.CanvasTexture(this.normalCanvas)
    this.foregroundTexture = new THREE.CanvasTexture(this.foregroundCanvas)
    this.backgroundTexture = new THREE.CanvasTexture(this.backgroundCanvas)
    this.shineTexture = new THREE.CanvasTexture(generateShineMap(SHINE_TEXTURE_SIZE))

    this.applyTextureSettings(this.waterTexture)
    this.applyTextureSettings(this.normalTexture)
    this.applyTextureSettings(this.foregroundTexture)
    this.applyTextureSettings(this.backgroundTexture)
    this.applyTextureSettings(this.shineTexture)

    this.foregroundTexture.colorSpace = THREE.SRGBColorSpace
    this.backgroundTexture.colorSpace = THREE.SRGBColorSpace
    this.shineTexture.colorSpace = THREE.SRGBColorSpace

    this.resetState()
  }

  setConfig(config: SanitizedWaterDropGlassConfig) {
    this.config = config
    this.options = this.buildOptions(config)
  }

  update(deltaSeconds: number) {
    const safeDelta = Number.isFinite(deltaSeconds) ? deltaSeconds : 1 / 60
    let timeScale = safeDelta / (1 / 60)
    timeScale = clamp(timeScale, 0.1, 1.1)
    timeScale *= this.options.globalTimeScale

    this.rdContext.clearRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
    this.updateDrops(timeScale)
    this.syncNormalTexture()
    this.waterTexture.needsUpdate = true
    this.normalTexture.needsUpdate = true
  }

  dispose() {
    this.waterTexture.dispose()
    this.normalTexture.dispose()
    this.foregroundTexture.dispose()
    this.backgroundTexture.dispose()
    this.shineTexture.dispose()
    this.drops = []
  }

  private applyTextureSettings(texture: THREE.CanvasTexture) {
    texture.generateMipmaps = false
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.needsUpdate = true
  }

  private buildOptions(config: SanitizedWaterDropGlassConfig): RainSimulationOptions {
    return {
      autoShrink: true,
      collisionBoost: DEFAULT_COLLISION_BOOST,
      collisionBoostMultiplier: DEFAULT_COLLISION_BOOST_MULTIPLIER,
      collisionRadius: config.collisionRadius,
      collisionRadiusIncrease: config.collisionRadiusIncrease,
      dropFallMultiplier: DEFAULT_DROP_FALL_MULTIPLIER,
      dropletsCleaningRadiusMultiplier: DEFAULT_DROPLETS_CLEANING_RADIUS_MULTIPLIER,
      dropletsRate: config.dropletsRate,
      dropletsSize: [config.dropletSizeMin, config.dropletSizeMax],
      globalTimeScale: config.globalTimeScale,
      maxDrops: 900,
      maxR: config.maxDropRadius,
      minR: config.minDropRadius,
      rainChance: config.rainChance,
      rainLimit: config.rainLimit,
      raining: config.rainAmount > 0.0001,
      spawnArea: DEFAULT_SPAWN_AREA,
      trailRate: config.trailRate,
      trailScaleRange: DEFAULT_TRAIL_SCALE_RANGE,
    }
  }

  private resetState() {
    this.drops = []
    this.dropletsCanvas = createCanvas(TEXTURE_SIZE, TEXTURE_SIZE)
    this.dropletsContext = getCanvasContext(this.dropletsCanvas)
    this.dropletsCounter = 0
    this.textureCleaningIterations = 30
    this.rdContext.clearRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
    this.syncNormalTexture()
    this.waterTexture.needsUpdate = true
    this.normalTexture.needsUpdate = true
  }

  private syncNormalTexture() {
    this.normalContext.globalCompositeOperation = 'source-over'
    this.normalContext.fillStyle = 'rgb(128, 128, 255)'
    this.normalContext.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
    this.normalContext.drawImage(this.rdCanvas, 0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  }

  private deltaR() {
    return Math.max(1, this.options.maxR - this.options.minR)
  }

  private area() {
    return TEXTURE_SIZE * TEXTURE_SIZE
  }

  private areaMultiplier() {
    return Math.sqrt(this.area() / (1024 * 768))
  }

  private drawDrop(context: CanvasRenderingContext2D, drop: DropState) {
    if (!this.dropGraphics.dropsGfx.length) {
      return
    }

    const { x, y, r } = drop
    const scaleX = 1
    const scaleY = 1.5

    let depthIndex = clamp(((r - this.options.minR) / this.deltaR()) * 0.9, 0, 1)
    depthIndex *= 1 / (((drop.spreadX + drop.spreadY) * 0.5) + 1)
    const spriteIndex = Math.floor(depthIndex * (this.dropGraphics.dropsGfx.length - 1))

    context.globalAlpha = 1
    context.globalCompositeOperation = 'source-over'
    context.drawImage(
      this.dropGraphics.dropsGfx[spriteIndex],
      x - (r * scaleX * (drop.spreadX + 1)),
      y - (r * scaleY * (drop.spreadY + 1)),
      r * 2 * scaleX * (drop.spreadX + 1),
      r * 2 * scaleY * (drop.spreadY + 1),
    )
  }

  private drawDroplet(x: number, y: number, r: number) {
    this.drawDrop(this.dropletsContext, {
      isNew: false,
      killed: false,
      lastSpawn: 0,
      momentum: 0,
      momentumX: 0,
      nextSpawn: 0,
      parent: null,
      r,
      shrink: 0,
      spreadX: 0,
      spreadY: 0,
      x,
      y,
    })
  }

  private clearDroplets(x: number, y: number, r: number) {
    const clearScale = 1.5
    this.dropletsContext.globalCompositeOperation = 'destination-out'
    this.dropletsContext.drawImage(
      this.dropGraphics.clearDropletsGfx,
      (x - r) * clearScale,
      (y - r) * clearScale,
      r * 2 * clearScale,
      r * 2 * clearScale * 1.5,
    )
    this.dropletsContext.globalCompositeOperation = 'source-over'
  }

  private createDrop(overrides: Partial<DropState> & Pick<DropState, 'r' | 'x' | 'y'>) {
    if (this.drops.length >= this.options.maxDrops * this.areaMultiplier()) {
      return null
    }

    return {
      isNew: true,
      killed: false,
      lastSpawn: overrides.lastSpawn ?? 0,
      momentum: overrides.momentum ?? 0,
      momentumX: overrides.momentumX ?? 0,
      nextSpawn: overrides.nextSpawn ?? random(this.options.minR, this.options.maxR),
      parent: overrides.parent ?? null,
      r: overrides.r,
      shrink: overrides.shrink ?? 0,
      spreadX: overrides.spreadX ?? 0,
      spreadY: overrides.spreadY ?? 0,
      x: overrides.x,
      y: overrides.y,
    } satisfies DropState
  }

  private updateRain(timeScale: number) {
    const rainDrops: DropState[] = []

    if (!this.options.raining || this.options.rainChance <= 0) {
      return rainDrops
    }

    const limit = this.options.rainLimit * timeScale * this.areaMultiplier() * this.config.rainAmount
    let count = 0

    while (chance(this.options.rainChance * timeScale * this.areaMultiplier() * this.config.rainAmount) && count < limit) {
      count += 1

      const radius = random(this.options.minR, this.options.maxR, value => value ** 3)
      const drop = this.createDrop({
        momentum: 1 + ((radius - this.options.minR) * 0.1) + random(0, 2),
        r: radius,
        spreadX: 1.5,
        spreadY: 1.5,
        x: random(0, TEXTURE_SIZE),
        y: random(
          TEXTURE_SIZE * this.options.spawnArea[0],
          TEXTURE_SIZE * this.options.spawnArea[1],
        ),
      })

      if (drop) {
        rainDrops.push(drop)
      }
    }

    return rainDrops
  }

  private updateDroplets(timeScale: number) {
    if (this.textureCleaningIterations > 0) {
      this.textureCleaningIterations -= 1 * timeScale
      this.dropletsContext.globalCompositeOperation = 'destination-out'
      this.dropletsContext.fillStyle = `rgba(0,0,0,${0.05 * timeScale})`
      this.dropletsContext.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
      this.dropletsContext.globalCompositeOperation = 'source-over'
    }

    if (!this.options.raining || this.options.dropletsRate <= 0) {
      return
    }

    this.dropletsCounter += this.options.dropletsRate * timeScale * this.areaMultiplier() * this.config.rainAmount

    let totalToSpawn = Math.floor(this.dropletsCounter)
    this.dropletsCounter -= totalToSpawn

    while (totalToSpawn > 0) {
      if (chance(0.8) && totalToSpawn >= 4) {
        const clusterSize = Math.min(totalToSpawn, 4 + Math.floor(Math.random() * 5))
        const centerX = random(0, TEXTURE_SIZE)
        const centerY = random(0, TEXTURE_SIZE)
        const clusterSpread = 4 + Math.random() * 8

        for (let index = 0; index < clusterSize; index += 1) {
          const angle = Math.random() * Math.PI * 2
          const distance = Math.random() * clusterSpread
          this.drawDroplet(
            centerX + Math.cos(angle) * distance,
            centerY + Math.sin(angle) * distance,
            random(this.options.dropletsSize[0], this.options.dropletsSize[1], value => value * value),
          )
        }

        totalToSpawn -= clusterSize
      }
      else {
        this.drawDroplet(
          random(0, TEXTURE_SIZE),
          random(0, TEXTURE_SIZE),
          random(this.options.dropletsSize[0], this.options.dropletsSize[1], value => value * value),
        )

        totalToSpawn -= 1
      }
    }
  }

  private updateDrops(timeScale: number) {
    const nextDrops: DropState[] = []

    this.updateDroplets(timeScale)
    this.rdContext.drawImage(this.dropletsCanvas, 0, 0, TEXTURE_SIZE, TEXTURE_SIZE)

    const rainDrops = this.updateRain(timeScale)
    nextDrops.push(...rainDrops)

    this.drops.sort((first, second) => {
      const a = (first.y * TEXTURE_SIZE) + first.x
      const b = (second.y * TEXTURE_SIZE) + second.x
      return a > b ? 1 : a === b ? 0 : -1
    })

    for (let index = 0; index < this.drops.length; index += 1) {
      const drop = this.drops[index]

      if (drop.killed) {
        continue
      }

      if (chance((drop.r - (this.options.minR * this.options.dropFallMultiplier)) * (0.1 / this.deltaR()) * timeScale)) {
        drop.momentum += random(0, (drop.r / this.options.maxR) * 4)
      }

      if (this.options.autoShrink && drop.r <= this.options.minR && chance(0.05 * timeScale)) {
        drop.shrink += 0.01
      }

      drop.r -= drop.shrink * timeScale

      if (drop.r <= 0) {
        drop.killed = true
        continue
      }

      if (this.options.raining) {
        drop.lastSpawn += drop.momentum * timeScale * this.options.trailRate

        if (drop.lastSpawn > drop.nextSpawn) {
          const trailDrop = this.createDrop({
            parent: drop,
            r: drop.r * random(this.options.trailScaleRange[0], this.options.trailScaleRange[1]),
            spreadY: drop.momentum * 0.1,
            x: drop.x + (random(-drop.r, drop.r) * 0.1),
            y: drop.y - (drop.r * 0.01),
          })

          if (trailDrop) {
            nextDrops.push(trailDrop)
            drop.r *= 0.97 ** timeScale
            drop.lastSpawn = 0
            drop.nextSpawn = random(this.options.minR, this.options.maxR)
              - (drop.momentum * 2 * this.options.trailRate)
              + (this.options.maxR - drop.r)
          }
        }
      }

      drop.spreadX *= 0.4 ** timeScale
      drop.spreadY *= 0.7 ** timeScale

      const moved = drop.momentum > 0

      if (moved && !drop.killed) {
        drop.y += drop.momentum * this.options.globalTimeScale
        drop.x += drop.momentumX * this.options.globalTimeScale

        if (drop.y > TEXTURE_SIZE + drop.r) {
          drop.killed = true
        }
      }

      const shouldCheckCollision = (moved || drop.isNew) && !drop.killed
      drop.isNew = false

      if (shouldCheckCollision) {
        const endIndex = Math.min(index + 70, this.drops.length)

        for (let siblingIndex = index + 1; siblingIndex < endIndex; siblingIndex += 1) {
          const other = this.drops[siblingIndex]

          if (
            drop === other
            || drop.r <= other.r
            || drop.parent === other
            || other.parent === drop
            || other.killed
          ) {
            continue
          }

          const dx = other.x - drop.x
          const dy = other.y - drop.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (
            distance
            < (drop.r + other.r) * (this.options.collisionRadius + (drop.momentum * this.options.collisionRadiusIncrease * timeScale))
          ) {
            const areaA = Math.PI * drop.r * drop.r
            const areaB = Math.PI * other.r * other.r
            let targetRadius = Math.sqrt((areaA + (areaB * 0.8)) / Math.PI)
            targetRadius = Math.min(targetRadius, this.options.maxR)

            drop.r = targetRadius
            drop.momentumX += dx * 0.1
            drop.spreadX = 0
            drop.spreadY = 0
            other.killed = true
            drop.momentum = Math.max(
              other.momentum,
              Math.min(
                40,
                drop.momentum + (targetRadius * this.options.collisionBoostMultiplier) + this.options.collisionBoost,
              ),
            )
          }
        }
      }

      drop.momentum -= Math.max(1, (this.options.minR * 0.5) - drop.momentum) * 0.1 * timeScale
      drop.momentum = Math.max(0, drop.momentum)
      drop.momentumX *= 0.7 ** timeScale

      if (!drop.killed) {
        nextDrops.push(drop)

        if (moved && this.options.dropletsRate > 0) {
          this.clearDroplets(
            drop.x,
            drop.y,
            drop.r * this.options.dropletsCleaningRadiusMultiplier,
          )
        }

        this.drawDrop(this.rdContext, drop)
      }
    }

    this.drops = nextDrops
  }
}

export const createRainOnGlassSimulation = (config: SanitizedWaterDropGlassConfig): RainOnGlassSimulation => {
  return new RainOnGlassSimulationImpl(config)
}
