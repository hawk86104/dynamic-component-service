import * as THREE from 'three'
import type { TerrainOptions } from './types'

export interface TerrainRuntime {
  ground: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>
  grassSurface: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
  setGroundColor: (color: THREE.ColorRepresentation) => void
  dispose: () => void
}

const DIRT_COLOR = new THREE.Color('#94744a')
const DIRT_SHADE = new THREE.Color('#6f5435')
const MAX_TERRAIN_CELL_SIZE = 0.56

function hash(x: number, z: number, seed: number): number {
  const value = Math.sin(x * 127.1 + z * 311.7 + seed * 74.7) * 43758.5453123
  return value - Math.floor(value)
}

function valueNoise(x: number, z: number, seed: number): number {
  const x0 = Math.floor(x)
  const z0 = Math.floor(z)
  const tx = x - x0
  const tz = z - z0
  const sx = tx * tx * (3 - 2 * tx)
  const sz = tz * tz * (3 - 2 * tz)
  const a = hash(x0, z0, seed)
  const b = hash(x0 + 1, z0, seed)
  const c = hash(x0, z0 + 1, seed)
  const d = hash(x0 + 1, z0 + 1, seed)

  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(a, b, sx),
    THREE.MathUtils.lerp(c, d, sx),
    sz,
  )
}

function fbm(x: number, z: number, seed: number): number {
  let total = 0
  let amplitude = 0.5
  let normalizer = 0
  let frequency = 1

  for (let octave = 0; octave < 4; octave += 1) {
    total += valueNoise(x * frequency, z * frequency, seed + octave * 101) * amplitude
    normalizer += amplitude
    frequency *= 2.03
    amplitude *= 0.5
  }

  return total / normalizer
}

function smooth01(value: number, edge0: number, edge1: number): number {
  const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function warpedFbm(x: number, z: number, seed: number, warp = 1.1): number {
  const warpX = fbm(x + 11.3, z + 2.7, seed + 79)
  const warpZ = fbm(x + 5.9, z + 17.1, seed + 151)
  return fbm(x + (warpX - 0.5) * warp, z + (warpZ - 0.5) * warp, seed)
}

function terrainDirtAmount(x: number, z: number, seed: number): number {
  const macro = warpedFbm(x * 0.27, z * 0.27, seed, 1.7)
  const edge = warpedFbm(x * 0.73 + 13.1, z * 0.73 - 8.7, seed + 31, 0.85)
  const overspray = fbm(x * 1.55 - 4.2, z * 1.55 + 19.6, seed + 67)
  return smooth01(macro * 0.69 + edge * 0.23 + overspray * 0.08, 0.46, 0.7)
}

function terrainHeight(
  x: number,
  z: number,
  seed: number,
  terrainDegree: number,
): number {
  const broad = warpedFbm(x * 0.15, z * 0.15, seed + 211, 0.55) - 0.5
  const detail = fbm(x * 0.62, z * 0.62, seed + 29) - 0.5
  return (broad * 3 + detail * 0.45) * smooth01(terrainDegree, 0, 1)
}

function grassCoverage(x: number, z: number, seed: number): number {
  const meadowVariation = 0.62 + fbm(x * 0.46, z * 0.46, seed + 63) * 0.38
  return (1 - terrainDirtAmount(x, z, seed)) * meadowVariation
}

function terrainSegments(
  width: number,
  depth: number,
  segments: number,
): { widthSegments: number, depthSegments: number } {
  return {
    widthSegments: Math.max(segments, Math.ceil(width / MAX_TERRAIN_CELL_SIZE)),
    depthSegments: Math.max(segments, Math.ceil(depth / MAX_TERRAIN_CELL_SIZE)),
  }
}

function createGrassSamplingGeometry(
  options: TerrainOptions,
  widthSegments: number,
  depthSegments: number,
): THREE.BufferGeometry {
  const positions: number[] = []
  const cellWidth = options.width / widthSegments
  const cellDepth = options.depth / depthSegments
  const minX = -options.width * 0.5
  const minZ = -options.depth * 0.5

  const append = (x: number, z: number): void => {
    positions.push(x, terrainHeight(x, z, options.seed, options.terrainDegree), z)
  }

  for (let row = 0; row < depthSegments; row += 1) {
    for (let column = 0; column < widthSegments; column += 1) {
      const x0 = minX + column * cellWidth
      const x1 = x0 + cellWidth
      const z0 = minZ + row * cellDepth
      const z1 = z0 + cellDepth
      const centerX = (x0 + x1) * 0.5
      const centerZ = (z0 + z1) * 0.5

      if (grassCoverage(centerX, centerZ, options.seed) < 0.42) {
        continue
      }

      append(x0, z0)
      append(x1, z1)
      append(x1, z0)
      append(x0, z0)
      append(x0, z1)
      append(x1, z1)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}

function updateGroundColors(
  geometry: THREE.PlaneGeometry,
  seed: number,
  groundColor: THREE.ColorRepresentation,
): void {
  const positions = geometry.getAttribute('position')
  const colors = geometry.getAttribute('color')
  const meadow = new THREE.Color(groundColor)
  const meadowShade = meadow.clone().offsetHSL(0, 0, -0.09)
  const meadowColor = new THREE.Color()
  const soil = new THREE.Color()
  const color = new THREE.Color()

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index)
    const z = positions.getZ(index)
    const variation = fbm(x * 0.55, z * 0.55, seed + 31)
    meadowColor.copy(meadowShade).lerp(meadow, variation)
    soil.copy(DIRT_SHADE).lerp(DIRT_COLOR, fbm(x * 0.72, z * 0.72, seed + 47))
    color.copy(meadowColor).lerp(soil, terrainDirtAmount(x, z, seed))
    colors.setXYZ(index, color.r, color.g, color.b)
  }

  colors.needsUpdate = true
}

export function createTerrain(options: TerrainOptions): TerrainRuntime {
  const { widthSegments, depthSegments } = terrainSegments(
    options.width,
    options.depth,
    options.segments,
  )
  const geometry = new THREE.PlaneGeometry(
    options.width,
    options.depth,
    widthSegments,
    depthSegments,
  )
  geometry.rotateX(-Math.PI / 2)

  const positions = geometry.getAttribute('position')
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index)
    const z = positions.getZ(index)
    positions.setY(index, terrainHeight(x, z, options.seed, options.terrainDegree))
  }

  geometry.setAttribute(
    'color',
    new THREE.BufferAttribute(new Float32Array(positions.count * 3), 3),
  )
  updateGroundColors(geometry, options.seed, options.groundColor)
  geometry.computeVertexNormals()

  const groundMaterial = new THREE.MeshStandardMaterial({
    metalness: 0,
    roughness: 0.98,
    vertexColors: true,
  })
  const ground = new THREE.Mesh(geometry, groundMaterial)
  ground.receiveShadow = true

  const grassSurface = new THREE.Mesh(
    createGrassSamplingGeometry(options, widthSegments, depthSegments),
    new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: false,
    }),
  )
  grassSurface.visible = false

  return {
    ground,
    grassSurface,
    setGroundColor: color => updateGroundColors(geometry, options.seed, color),
    dispose: () => {
      ground.geometry.dispose()
      ground.material.dispose()
      grassSurface.geometry.dispose()
      grassSurface.material.dispose()
    },
  }
}
