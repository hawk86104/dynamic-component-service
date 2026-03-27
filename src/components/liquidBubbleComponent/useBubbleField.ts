import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import bubbleFragmentShader from '../../shader/liquidBubbleComponent/bubble.frag?raw'
import bubbleVertexShader from '../../shader/liquidBubbleComponent/bubble.vert?raw'
import {
  clampInteger,
  type LiquidBubbleShape,
  normalizeShapeType,
  setMaterialColor,
} from './shared'

export interface BubbleFieldOptions {
  bubbleColor: string
  bubbleCount: number
  bubbleOpacity: number
  bubbleSize: number
  bubbleSpeed: number
  bubbleSpread: number
  depth: number
  height: number
  radius: number
  shapeType: LiquidBubbleShape | string | undefined
  width: number
}

const MAX_BUBBLES = 240
const BOX_CLUSTER_COUNT = 8
const CYLINDER_CLUSTER_COUNT = 7

const seededRandom = (seed: number) => {
  const value = Math.sin(seed * 127.1) * 43758.5453123
  return value - Math.floor(value)
}

const clampSymmetric = (value: number, limit: number) => {
  return THREE.MathUtils.clamp(value, -limit, limit)
}

const createClusterCenters = (shapeType: LiquidBubbleShape) => {
  const clusterCount = shapeType === 'box' ? BOX_CLUSTER_COUNT : CYLINDER_CLUSTER_COUNT

  return Array.from({ length: clusterCount }, (_, index) => {
    const seed = index + 1

    if (shapeType === 'box') {
      return {
        x: seededRandom(seed * 1.13) * 1.3 - 0.65,
        z: seededRandom(seed * 2.17) * 1.3 - 0.65,
        radius: 0.1 + seededRandom(seed * 3.23) * 0.18,
      }
    }

    const angle = seededRandom(seed * 1.91) * Math.PI * 2
    const radial = seededRandom(seed * 2.83) ** 1.25 * 0.62

    return {
      x: Math.cos(angle) * radial,
      z: Math.sin(angle) * radial,
      radius: 0.09 + seededRandom(seed * 4.41) * 0.12,
    }
  })
}

const createNormalizedSpawn = (
  shapeType: LiquidBubbleShape,
  centers: ReturnType<typeof createClusterCenters>,
  index: number,
) => {
  const center = centers[Math.floor(seededRandom(index * 7.13 + 3.0) * centers.length)]
  const angle = seededRandom(index * 5.73 + 11.0) * Math.PI * 2
  const radial = seededRandom(index * 9.31 + 17.0) ** 1.8 * center.radius
  const outlierChance = seededRandom(index * 12.47 + 23.0)

  if (shapeType === 'box') {
    let x = center.x + Math.cos(angle) * radial
    let z = center.z + Math.sin(angle) * radial

    if (outlierChance > 0.84) {
      x = seededRandom(index * 13.71 + 29.0) * 1.7 - 0.85
      z = seededRandom(index * 15.37 + 31.0) * 1.7 - 0.85
    }

    return {
      x: clampSymmetric(x, 0.88),
      z: clampSymmetric(z, 0.88),
    }
  }

  let x = center.x + Math.cos(angle) * radial
  let z = center.z + Math.sin(angle) * radial

  if (outlierChance > 0.84) {
    const randomAngle = seededRandom(index * 13.71 + 29.0) * Math.PI * 2
    const randomRadius = Math.sqrt(seededRandom(index * 15.37 + 31.0)) * 0.82
    x = Math.cos(randomAngle) * randomRadius
    z = Math.sin(randomAngle) * randomRadius
  }

  const length = Math.hypot(x, z)
  if (length > 0.88) {
    const scale = 0.88 / Math.max(length, 0.0001)
    x *= scale
    z *= scale
  }

  return { x, z }
}

const createBubbleGeometry = (shapeType: LiquidBubbleShape) => {
  const positions = new Float32Array(MAX_BUBBLES * 3)
  const jitters = new Float32Array(MAX_BUBBLES * 3)
  const seeds = new Float32Array(MAX_BUBBLES)
  const lifeOffsets = new Float32Array(MAX_BUBBLES)
  const sizeFactors = new Float32Array(MAX_BUBBLES)
  const centers = createClusterCenters(shapeType)

  for (let index = 0; index < MAX_BUBBLES; index += 1) {
    const cursor = index * 3
    const spawn = createNormalizedSpawn(shapeType, centers, index + 1)

    positions[cursor] = spawn.x
    positions[cursor + 1] = seededRandom(index * 17.41 + 37.0) * 0.12
    positions[cursor + 2] = spawn.z

    jitters[cursor] = seededRandom(index * 19.63 + 41.0) * 2 - 1
    jitters[cursor + 1] = seededRandom(index * 23.11 + 43.0) * 2 - 1
    jitters[cursor + 2] = seededRandom(index * 29.29 + 47.0) * 2 - 1

    seeds[index] = seededRandom(index * 31.73 + 53.0)
    lifeOffsets[index] = seededRandom(index * 37.09 + 59.0)
    sizeFactors[index] = 0.72 + seededRandom(index * 41.53 + 61.0) * 0.95
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aJitter', new THREE.BufferAttribute(jitters, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aLifeOffset', new THREE.BufferAttribute(lifeOffsets, 1))
  geometry.setAttribute('aSizeFactor', new THREE.BufferAttribute(sizeFactors, 1))

  return geometry
}

const createBubbleMaterial = (options: BubbleFieldOptions) => {
  return new CustomShaderMaterial({
    baseMaterial: THREE.PointsMaterial,
    blending: THREE.NormalBlending,
    color: 0xFFFFFF,
    depthTest: true,
    depthWrite: false,
    fragmentShader: bubbleFragmentShader,
    silent: true,
    size: options.bubbleSize,
    sizeAttenuation: true,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uBubbleColor: { value: new THREE.Color(options.bubbleColor) },
      uBubbleOpacity: { value: options.bubbleOpacity },
      uBubbleSize: { value: options.bubbleSize },
      uBubbleSpeed: { value: options.bubbleSpeed },
      uBubbleSpread: { value: options.bubbleSpread },
      uDepth: { value: options.depth },
      uHalfWidth: { value: options.width / 2 },
      uHeight: { value: options.height },
      uRadius: { value: options.radius },
      uShapeType: { value: normalizeShapeType(options.shapeType) === 'box' ? 0 : 1 },
      uTime: { value: 0 },
    },
    vertexShader: bubbleVertexShader,
  })
}

export const createBubbleField = (options: BubbleFieldOptions) => {
  let geometry = createBubbleGeometry(normalizeShapeType(options.shapeType))
  const material = createBubbleMaterial(options)
  const points = new THREE.Points(geometry, material)

  points.frustumCulled = false
  points.renderOrder = 8
  geometry.setDrawRange(0, clampInteger(options.bubbleCount, 0, MAX_BUBBLES, 110))

  const rebuildGeometry = (shapeType: LiquidBubbleShape) => {
    const nextGeometry = createBubbleGeometry(shapeType)
    nextGeometry.setDrawRange(0, geometry.drawRange.count)
    geometry.dispose()
    geometry = nextGeometry
    points.geometry = geometry
  }

  const sync = (nextOptions: BubbleFieldOptions) => {
    const shapeType = normalizeShapeType(nextOptions.shapeType)
    const targetCount = clampInteger(nextOptions.bubbleCount, 0, MAX_BUBBLES, 110)
    const uniforms = material.uniforms

    ;(material as unknown as THREE.PointsMaterial).size = nextOptions.bubbleSize
    setMaterialColor(uniforms.uBubbleColor, nextOptions.bubbleColor, '#fff8e8')
    uniforms.uBubbleOpacity.value = nextOptions.bubbleOpacity
    uniforms.uBubbleSize.value = nextOptions.bubbleSize
    uniforms.uBubbleSpeed.value = nextOptions.bubbleSpeed
    uniforms.uBubbleSpread.value = nextOptions.bubbleSpread
    uniforms.uDepth.value = nextOptions.depth
    uniforms.uHalfWidth.value = nextOptions.width / 2
    uniforms.uHeight.value = nextOptions.height
    uniforms.uRadius.value = nextOptions.radius
    uniforms.uShapeType.value = shapeType === 'box' ? 0 : 1
    geometry.setDrawRange(0, targetCount)
  }

  const setTime = (time: number) => {
    material.uniforms.uTime.value = time
  }

  const setShapeType = (shapeType: LiquidBubbleShape) => {
    rebuildGeometry(shapeType)
    material.uniforms.uShapeType.value = shapeType === 'box' ? 0 : 1
  }

  const dispose = () => {
    geometry.dispose()
    material.dispose()
  }

  return {
    dispose,
    points,
    setShapeType,
    setTime,
    sync,
  }
}
