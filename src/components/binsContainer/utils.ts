import * as THREE from 'three'

export type BinsGenerationType = 'Recursive' | 'Grid'

export interface BinsLayoutItem {
  depth: number
  height: number
  index: number
  width: number
  x: number
  z: number
}

export interface BinsGeneratorProps {
  cols: number
  depth: number
  divideDepth: number
  divideWidth: number
  height: number
  innerGap: number
  iterations: number
  rows: number
  width: number
}

export const BIN_BOTTOM_THICKNESS_MM = 5
export const DRAWER_FLOOR_THICKNESS_MM = 10
export const DRAWER_WALL_THICKNESS_MM = 10
export const SCENE_SCALE = 0.01

export const clampNumber = (value: number | undefined, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return THREE.MathUtils.clamp(value as number, min, max)
}

export const normalizeBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>

    if ('value' in record) {
      return normalizeBoolean(record.value, fallback)
    }

    if ('rawValue' in record) {
      return normalizeBoolean(record.rawValue, fallback)
    }

    if ('checked' in record) {
      return normalizeBoolean(record.checked, fallback)
    }
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true' || normalized === '1') {
      return true
    }
    if (normalized === 'false' || normalized === '0' || normalized === '') {
      return false
    }
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  return fallback
}

export const mmToSceneUnits = (value: number) => value * SCENE_SCALE

const buildRoundedRectPath = (target: THREE.Shape | THREE.Path, width: number, depth: number, radius: number) => {
  const halfWidth = width / 2
  const halfDepth = depth / 2
  const safeRadius = THREE.MathUtils.clamp(radius, 0, Math.min(halfWidth, halfDepth))

  if (safeRadius <= 0) {
    target.moveTo(-halfWidth, -halfDepth)
    target.lineTo(halfWidth, -halfDepth)
    target.lineTo(halfWidth, halfDepth)
    target.lineTo(-halfWidth, halfDepth)
    target.closePath()
    return
  }

  target.moveTo(-halfWidth + safeRadius, -halfDepth)
  target.lineTo(halfWidth - safeRadius, -halfDepth)
  target.quadraticCurveTo(halfWidth, -halfDepth, halfWidth, -halfDepth + safeRadius)
  target.lineTo(halfWidth, halfDepth - safeRadius)
  target.quadraticCurveTo(halfWidth, halfDepth, halfWidth - safeRadius, halfDepth)
  target.lineTo(-halfWidth + safeRadius, halfDepth)
  target.quadraticCurveTo(-halfWidth, halfDepth, -halfWidth, halfDepth - safeRadius)
  target.lineTo(-halfWidth, -halfDepth + safeRadius)
  target.quadraticCurveTo(-halfWidth, -halfDepth, -halfWidth + safeRadius, -halfDepth)
  target.closePath()
}

export const createRoundedRectShape = (width: number, depth: number, radius: number) => {
  const shape = new THREE.Shape()
  buildRoundedRectPath(shape, width, depth, radius)
  return shape
}

export const createRoundedRectRingShape = (width: number, depth: number, radius: number, thickness: number) => {
  const safeThickness = Math.max(thickness, 0)
  const outerShape = createRoundedRectShape(width, depth, radius)
  const innerWidth = width - safeThickness * 2
  const innerDepth = depth - safeThickness * 2

  if (innerWidth <= 0.001 || innerDepth <= 0.001) {
    return outerShape
  }

  const innerPath = new THREE.Path()
  buildRoundedRectPath(innerPath, innerWidth, innerDepth, radius)
  outerShape.holes.push(innerPath)
  return outerShape
}

const normalizeLayoutItems = (items: Omit<BinsLayoutItem, 'index'>[]) => {
  return items
    .filter(item => item.width > 1 && item.depth > 1 && item.height > 1)
    .map((item, index) => ({
      ...item,
      index,
    }))
}

export const generateBinsGrid = (props: Pick<BinsGeneratorProps, 'cols' | 'depth' | 'height' | 'innerGap' | 'rows' | 'width'>) => {
  const rows = Math.max(1, Math.round(props.rows))
  const cols = Math.max(1, Math.round(props.cols))
  const totalRowInnerGap = Math.max(0, rows - 1) * props.innerGap
  const totalColInnerGap = Math.max(0, cols - 1) * props.innerGap
  const effectiveColWidth = (props.width - totalColInnerGap) / cols
  const effectiveRowDepth = (props.depth - totalRowInnerGap) / rows
  const bins: Omit<BinsLayoutItem, 'index'>[] = []

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      bins.push({
        width: effectiveColWidth,
        depth: effectiveRowDepth,
        height: props.height,
        x: col * (effectiveColWidth + props.innerGap),
        z: row * (effectiveRowDepth + props.innerGap),
      })
    }
  }

  return normalizeLayoutItems(bins)
}

const generateBinsRecursiveInternal = (props: Pick<BinsGeneratorProps, 'depth' | 'divideDepth' | 'divideWidth' | 'height' | 'innerGap' | 'iterations' | 'width'>) => {
  const bins: Array<Omit<BinsLayoutItem, 'index'>> = []
  const actualIterations = Math.max(0, Math.round(props.iterations))
  const halfInnerGap = props.innerGap / 2

  if (actualIterations === 0) {
    return bins
  }

  const initialBins: Array<Omit<BinsLayoutItem, 'index'>> = [
    {
      width: props.width * (1 - props.divideWidth) - halfInnerGap,
      depth: props.depth * (1 - props.divideDepth) - halfInnerGap,
      height: props.height,
      x: 0,
      z: 0,
    },
    {
      width: props.width * props.divideWidth - halfInnerGap,
      depth: props.depth * (1 - props.divideDepth) - halfInnerGap,
      height: props.height,
      x: props.width * (1 - props.divideWidth) + halfInnerGap,
      z: 0,
    },
    {
      width: props.width * props.divideWidth - halfInnerGap,
      depth: props.depth * props.divideDepth - halfInnerGap,
      height: props.height,
      x: 0,
      z: props.depth * (1 - props.divideDepth) + halfInnerGap,
    },
    {
      width: props.width * (1 - props.divideWidth) - halfInnerGap,
      depth: props.depth * props.divideDepth - halfInnerGap,
      height: props.height,
      x: props.width * props.divideWidth + halfInnerGap,
      z: props.depth * (1 - props.divideDepth) + halfInnerGap,
    },
  ]

  bins.push(...initialBins)

  if (actualIterations > 1) {
    initialBins.forEach((initialBin, index) => {
      const flippedDivideWidth = index % 2 === 0 ? props.divideDepth : props.divideWidth
      const flippedDivideDepth = index % 2 === 0 ? props.divideWidth : props.divideDepth
      const subBins = generateBinsRecursiveInternal({
        width: initialBin.width,
        depth: initialBin.depth,
        height: initialBin.height,
        divideWidth: flippedDivideWidth,
        divideDepth: flippedDivideDepth,
        iterations: actualIterations - 1,
        innerGap: props.innerGap,
      })

      bins.push(
        ...subBins.map(bin => ({
          ...bin,
          x: initialBin.x + bin.x,
          z: initialBin.z + bin.z,
        })),
      )
    })
  }

  return bins
}

export const generateBinsRecursive = (props: Pick<BinsGeneratorProps, 'depth' | 'divideDepth' | 'divideWidth' | 'height' | 'innerGap' | 'iterations' | 'width'>) => {
  return normalizeLayoutItems(generateBinsRecursiveInternal(props))
}
