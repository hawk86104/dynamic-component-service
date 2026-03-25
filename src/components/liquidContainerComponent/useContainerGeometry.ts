import * as THREE from 'three'
import { DEFAULT_LIQUID_CONTAINER_PROPS, RADIAL_SEGMENTS, SURFACE_SEGMENTS, VASE_PROFILE_PRESETS } from './constants'
import type { ContainerGeometryBundle, LiquidContainerProps, ProfilePoint, SafeLiquidContainerProps, ShapeType, VasePreset } from './types'

export const clampNumber = (value: number | undefined, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return THREE.MathUtils.clamp(value as number, min, max)
}

const clampInteger = (value: number | undefined, min: number, max: number, fallback: number) => {
  return Math.round(clampNumber(value, min, max, fallback))
}

const ensureShapeType = (shapeType?: string): ShapeType => {
  if (shapeType === 'rectTank' || shapeType === 'cylinderTank' || shapeType === 'vaseTank') {
    return shapeType
  }

  return DEFAULT_LIQUID_CONTAINER_PROPS.shapeType
}

const ensureVasePreset = (vasePreset?: string): VasePreset => {
  if (vasePreset === 'roundPot' || vasePreset === 'slenderBottle' || vasePreset === 'bulbFlask') {
    return vasePreset
  }

  return DEFAULT_LIQUID_CONTAINER_PROPS.vasePreset
}

const buildWallThickness = (shapeType: ShapeType, length: number, width: number, height: number, radius: number) => {
  const reference = shapeType === 'rectTank'
    ? Math.min(length, width, height)
    : Math.min(radius * 2, height)

  return clampNumber(reference * 0.06, 0.03, 0.14, 0.06)
}

export const sanitizeLiquidContainerProps = (props: LiquidContainerProps): SafeLiquidContainerProps => {
  const shapeType = ensureShapeType(props.shapeType)
  const vasePreset = ensureVasePreset(props.vasePreset)
  const length = clampNumber(props.length, 0.8, 8, DEFAULT_LIQUID_CONTAINER_PROPS.length)
  const width = clampNumber(props.width, 0.6, 6, DEFAULT_LIQUID_CONTAINER_PROPS.width)
  const height = clampNumber(props.height, 1, 8, DEFAULT_LIQUID_CONTAINER_PROPS.height)
  const radius = clampNumber(props.radius, 0.35, 3.5, DEFAULT_LIQUID_CONTAINER_PROPS.radius)
  const bubbleSizeMin = clampNumber(props.bubbleSizeMin, 0.001, 0.05, DEFAULT_LIQUID_CONTAINER_PROPS.bubbleSizeMin)
  const bubbleSizeMax = clampNumber(
    props.bubbleSizeMax,
    bubbleSizeMin + 0.001,
    0.06,
    Math.max(DEFAULT_LIQUID_CONTAINER_PROPS.bubbleSizeMax, bubbleSizeMin + 0.001),
  )

  return {
    shapeType,
    vasePreset,
    length,
    width,
    height,
    radius,
    fillLevel: clampNumber(props.fillLevel, 0.05, 1, DEFAULT_LIQUID_CONTAINER_PROPS.fillLevel),
    waveSpeed: clampNumber(props.waveSpeed, 0, 6, DEFAULT_LIQUID_CONTAINER_PROPS.waveSpeed),
    waveAmplitude: clampNumber(props.waveAmplitude, 0, 0.24, DEFAULT_LIQUID_CONTAINER_PROPS.waveAmplitude),
    waveFrequency: clampNumber(props.waveFrequency, 0.5, 10, DEFAULT_LIQUID_CONTAINER_PROPS.waveFrequency),
    waveRandomness: clampNumber(props.waveRandomness, 0, 1, DEFAULT_LIQUID_CONTAINER_PROPS.waveRandomness),
    baseColor: props.baseColor || DEFAULT_LIQUID_CONTAINER_PROPS.baseColor,
    topColor: props.topColor || DEFAULT_LIQUID_CONTAINER_PROPS.topColor,
    edgeColor: props.edgeColor || DEFAULT_LIQUID_CONTAINER_PROPS.edgeColor,
    shellColor: props.shellColor || DEFAULT_LIQUID_CONTAINER_PROPS.shellColor,
    shellOpacity: clampNumber(props.shellOpacity, 0, 1, DEFAULT_LIQUID_CONTAINER_PROPS.shellOpacity),
    density: clampNumber(props.density, 0.1, 1, DEFAULT_LIQUID_CONTAINER_PROPS.density),
    opacity: clampNumber(props.opacity, 0.08, 1, DEFAULT_LIQUID_CONTAINER_PROPS.opacity),
    bubbleEnabled: props.bubbleEnabled ?? DEFAULT_LIQUID_CONTAINER_PROPS.bubbleEnabled,
    bubbleCount: clampInteger(props.bubbleCount, 0, 160, DEFAULT_LIQUID_CONTAINER_PROPS.bubbleCount),
    bubbleSizeMin,
    bubbleSizeMax,
    bubbleRandomness: clampNumber(props.bubbleRandomness, 0, 1, DEFAULT_LIQUID_CONTAINER_PROPS.bubbleRandomness),
    bubbleRiseSpeed: clampNumber(props.bubbleRiseSpeed, 0.1, 3, DEFAULT_LIQUID_CONTAINER_PROPS.bubbleRiseSpeed),
    bubbleColor: props.bubbleColor || DEFAULT_LIQUID_CONTAINER_PROPS.bubbleColor,
    clipX: clampNumber(props.clipX, 0, 1, DEFAULT_LIQUID_CONTAINER_PROPS.clipX),
    clipZ: clampNumber(props.clipZ, 0, 1, DEFAULT_LIQUID_CONTAINER_PROPS.clipZ),
    shellThickness: buildWallThickness(shapeType, length, width, height, radius),
  }
}

const mergeGeometries = (geometries: THREE.BufferGeometry[]) => {
  const positionParts: number[] = []
  const normalParts: number[] = []
  const uvParts: number[] = []

  geometries.forEach((geometry) => {
    const source = geometry.index ? geometry.toNonIndexed() : geometry.clone()
    const position = source.getAttribute('position')
    const normal = source.getAttribute('normal')
    const uv = source.getAttribute('uv')

    positionParts.push(...Array.from(position.array as ArrayLike<number>))
    normalParts.push(...Array.from(normal.array as ArrayLike<number>))
    uvParts.push(...Array.from(uv.array as ArrayLike<number>))

    source.dispose()
  })

  const merged = new THREE.BufferGeometry()
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positionParts, 3))
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normalParts, 3))
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvParts, 2))
  merged.computeBoundingBox()
  merged.computeBoundingSphere()

  return merged
}

const buildRectShellGeometry = (length: number, width: number, height: number) => {
  const front = new THREE.PlaneGeometry(length, height, 1, 1)
  front.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, width / 2))

  const back = new THREE.PlaneGeometry(length, height, 1, 1)
  back.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI))
  back.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -width / 2))

  const right = new THREE.PlaneGeometry(width, height, 1, 1)
  right.applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.PI / 2))
  right.applyMatrix4(new THREE.Matrix4().makeTranslation(length / 2, 0, 0))

  const left = new THREE.PlaneGeometry(width, height, 1, 1)
  left.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2))
  left.applyMatrix4(new THREE.Matrix4().makeTranslation(-length / 2, 0, 0))

  const merged = mergeGeometries([front, back, right, left])

  front.dispose()
  back.dispose()
  right.dispose()
  left.dispose()

  return merged
}

const sampleProfileRadius = (profile: ProfilePoint[], normalizedHeight: number) => {
  const clamped = THREE.MathUtils.clamp(normalizedHeight, 0, 1)

  for (let index = 1; index < profile.length; index += 1) {
    const previous = profile[index - 1]
    const current = profile[index]

    if (clamped <= current.h) {
      const segmentProgress = (clamped - previous.h) / Math.max(0.0001, current.h - previous.h)
      return THREE.MathUtils.lerp(previous.r, current.r, segmentProgress)
    }
  }

  return profile[profile.length - 1].r
}

const buildLathePoints = (profile: ProfilePoint[], height: number, maxRadius: number) => {
  const halfHeight = height / 2
  return profile.map(point => new THREE.Vector2(
    Math.max(0.02, point.r * maxRadius),
    -halfHeight + point.h * height,
  ))
}

export const buildContainerGeometries = (config: SafeLiquidContainerProps): ContainerGeometryBundle => {
  const innerHeight = Math.max(0.22, config.height - config.shellThickness * 1.2)
  const shellHalfExtents = new THREE.Vector3()
  const liquidHalfExtents = new THREE.Vector3()
  const fillSurfaceY = innerHeight * config.fillLevel

  if (config.shapeType === 'rectTank') {
    const innerLength = Math.max(0.3, config.length - config.shellThickness * 1.4)
    const innerWidth = Math.max(0.3, config.width - config.shellThickness * 1.4)
    const shellGeometry = buildRectShellGeometry(config.length, config.width, config.height)
    const liquidGeometry = new THREE.BoxGeometry(innerLength, innerHeight, innerWidth, 1, 24, 1)
    const surfaceGeometry = new THREE.PlaneGeometry(innerLength, innerWidth, SURFACE_SEGMENTS, SURFACE_SEGMENTS)

    shellHalfExtents.set(config.length / 2, config.height / 2, config.width / 2)
    liquidHalfExtents.set(innerLength / 2, innerHeight / 2, innerWidth / 2)

    return {
      shellGeometry,
      liquidGeometry,
      surfaceGeometry,
      shellPositionY: config.height / 2,
      liquidPositionY: innerHeight / 2,
      surfacePositionY: fillSurfaceY,
      shellHalfExtents,
      liquidHalfExtents,
      surfaceRadius: Math.max(innerLength, innerWidth) / 2,
      surfaceShape: 'rect',
      liquidHeight: innerHeight,
      sampleInnerRadius: () => Math.min(innerLength, innerWidth) / 2,
      sampleBubblePosition: (seedA, seedB) => {
        const x = (seedA * 2 - 1) * innerLength * 0.32
        const z = (seedB * 2 - 1) * innerWidth * 0.32
        return new THREE.Vector3(x, 0, z)
      },
      dispose: () => {
        shellGeometry.dispose()
        liquidGeometry.dispose()
        surfaceGeometry.dispose()
      },
    }
  }

  if (config.shapeType === 'cylinderTank') {
    const innerRadius = Math.max(0.12, config.radius - config.shellThickness * 0.7)
    const shellGeometry = new THREE.CylinderGeometry(config.radius, config.radius, config.height, RADIAL_SEGMENTS, 1, true)
    const liquidGeometry = new THREE.CylinderGeometry(innerRadius, innerRadius, innerHeight, RADIAL_SEGMENTS, 24, false)
    const surfaceGeometry = new THREE.PlaneGeometry(innerRadius * 2, innerRadius * 2, SURFACE_SEGMENTS, SURFACE_SEGMENTS)

    shellHalfExtents.set(config.radius, config.height / 2, config.radius)
    liquidHalfExtents.set(innerRadius, innerHeight / 2, innerRadius)

    return {
      shellGeometry,
      liquidGeometry,
      surfaceGeometry,
      shellPositionY: config.height / 2,
      liquidPositionY: innerHeight / 2,
      surfacePositionY: fillSurfaceY,
      shellHalfExtents,
      liquidHalfExtents,
      surfaceRadius: innerRadius,
      surfaceShape: 'circle',
      liquidHeight: innerHeight,
      sampleInnerRadius: () => innerRadius,
      sampleBubblePosition: (seedA, seedB) => {
        const angle = seedA * Math.PI * 2
        const radius = Math.sqrt(seedB) * innerRadius * 0.64
        return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
      },
      dispose: () => {
        shellGeometry.dispose()
        liquidGeometry.dispose()
        surfaceGeometry.dispose()
      },
    }
  }

  const presetProfile = VASE_PROFILE_PRESETS[config.vasePreset]
  const innerScale = Math.max(0.65, 1 - config.shellThickness / Math.max(config.radius, 0.0001))
  const shellPoints = buildLathePoints(presetProfile, config.height, config.radius)
  const innerProfile = presetProfile.map(point => ({
    h: point.h,
    r: Math.max(0.08, point.r * innerScale),
  }))
  const liquidPoints = buildLathePoints(innerProfile, innerHeight, config.radius)
  const currentSurfaceRadius = sampleProfileRadius(innerProfile, config.fillLevel) * config.radius
  const shellGeometry = new THREE.LatheGeometry(shellPoints, RADIAL_SEGMENTS)
  const liquidGeometry = new THREE.LatheGeometry(liquidPoints, RADIAL_SEGMENTS)
  const surfaceGeometry = new THREE.PlaneGeometry(currentSurfaceRadius * 2, currentSurfaceRadius * 2, SURFACE_SEGMENTS, SURFACE_SEGMENTS)

  shellHalfExtents.set(config.radius, config.height / 2, config.radius)
  liquidHalfExtents.set(config.radius * innerScale, innerHeight / 2, config.radius * innerScale)

  return {
    shellGeometry,
    liquidGeometry,
    surfaceGeometry,
    shellPositionY: config.height / 2,
    liquidPositionY: innerHeight / 2,
    surfacePositionY: fillSurfaceY,
    shellHalfExtents,
    liquidHalfExtents,
    surfaceRadius: currentSurfaceRadius,
    surfaceShape: 'circle',
    liquidHeight: innerHeight,
    sampleInnerRadius: normalizedHeight => sampleProfileRadius(innerProfile, normalizedHeight) * config.radius,
    sampleBubblePosition: (seedA, seedB, normalizedHeight) => {
      const angle = seedA * Math.PI * 2
      const bubbleRadius = sampleProfileRadius(innerProfile, normalizedHeight) * config.radius * (0.16 + Math.sqrt(seedB) * 0.4)
      return new THREE.Vector3(Math.cos(angle) * bubbleRadius, 0, Math.sin(angle) * bubbleRadius)
    },
    dispose: () => {
      shellGeometry.dispose()
      liquidGeometry.dispose()
      surfaceGeometry.dispose()
    },
  }
}
