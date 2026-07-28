import * as THREE from 'three'
import grassFragmentShader from '../../shader/advancedDynamicGrassComponent/grass.frag?raw'
import grassVertexShader from '../../shader/advancedDynamicGrassComponent/grass.vert?raw'
import { sampleSurfaceData, surfaceArea } from './surfaceSampler'
import type {
  GrassAppearanceOptions,
  GrassLayerOptions,
  GrassWindOptions,
} from './types'

interface GrassUniforms extends Record<string, THREE.IUniform> {
  uTime: THREE.IUniform<number>
  uWindStrength: THREE.IUniform<number>
  uWindSpeed: THREE.IUniform<number>
  uWindFrequency: THREE.IUniform<number>
  uWindTurbulence: THREE.IUniform<number>
  uWindLean: THREE.IUniform<number>
  uWindDirection: THREE.IUniform<THREE.Vector2>
  uGrassBottom: THREE.IUniform<THREE.Color>
  uGrassTop: THREE.IUniform<THREE.Color>
  uLightDirection: THREE.IUniform<THREE.Vector3>
  uLightColor: THREE.IUniform<THREE.Color>
  uLightIntensity: THREE.IUniform<number>
  uBacklightColor: THREE.IUniform<THREE.Color>
  uBacklightStrength: THREE.IUniform<number>
  uBacklightPower: THREE.IUniform<number>
  uBacklightTip: THREE.IUniform<number>
  uBrightness: THREE.IUniform<number>
}

const MAX_BLADE_COUNT = 120_000
const STYLIZED_LIGHT_DIRECTION = new THREE.Vector3(-0.4, 0.85, 0.3).normalize()

function seededRandom(seed: number): () => number {
  let state = (seed * 1664525 + 1013904223) >>> 0

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

function createBladeGeometry(segments: number, lean: number): THREE.BufferGeometry {
  const positions = new Float32Array((segments * 2 + 1) * 3)
  const uvs = new Float32Array((segments * 2 + 1) * 2)
  const indices: number[] = []

  for (let row = 0; row < segments; row += 1) {
    const progress = row / segments
    const width = 0.5 * (1 - progress) ** 1.2
    const bend = lean * progress * progress
    const vertex = row * 2

    positions.set([-width, progress, bend, width, progress, bend], vertex * 3)
    uvs.set([0, progress, 1, progress], vertex * 2)

    if (row < segments - 1) {
      indices.push(
        vertex,
        vertex + 2,
        vertex + 1,
        vertex + 1,
        vertex + 2,
        vertex + 3,
      )
    }
  }

  positions.set([0, 1, lean], segments * 6)
  uvs.set([0.5, 1], segments * 4)
  const finalLeft = (segments - 1) * 2
  indices.push(finalLeft, segments * 2, finalLeft + 1)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function createUniforms(options: GrassLayerOptions): GrassUniforms {
  return {
    uTime: { value: 0 },
    uWindStrength: { value: options.wind.strength },
    uWindSpeed: { value: options.wind.speed },
    uWindFrequency: { value: options.wind.frequency },
    uWindTurbulence: { value: options.wind.turbulence },
    uWindLean: { value: options.wind.lean },
    uWindDirection: { value: new THREE.Vector2() },
    uGrassBottom: { value: new THREE.Color(options.colors.bottom) },
    uGrassTop: { value: new THREE.Color(options.colors.top) },
    uLightDirection: { value: STYLIZED_LIGHT_DIRECTION.clone() },
    uLightColor: { value: new THREE.Color('#fff5cf') },
    uLightIntensity: { value: 2.4 },
    uBacklightColor: { value: new THREE.Color(options.colors.backlight) },
    uBacklightStrength: { value: 2.5 },
    uBacklightPower: { value: 3 },
    uBacklightTip: { value: 0.6 },
    uBrightness: { value: options.brightness },
  }
}

export class GrassLayer extends THREE.Group {
  readonly bladeCount: number

  private readonly blades: THREE.InstancedMesh<THREE.BufferGeometry, THREE.ShaderMaterial>
  private readonly uniforms: GrassUniforms
  private disposed = false

  constructor(options: GrassLayerOptions) {
    super()

    this.uniforms = createUniforms(options)
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: grassVertexShader,
      fragmentShader: grassFragmentShader,
      side: THREE.DoubleSide,
      depthWrite: true,
      toneMapped: true,
    })

    const requestedCount = Math.min(
      MAX_BLADE_COUNT,
      Math.max(0, Math.floor(surfaceArea(options.surface) * options.density)),
    )
    const samples = sampleSurfaceData(options.surface, requestedCount, options.seed)
    const geometry = createBladeGeometry(options.blade.segments, options.blade.lean)

    this.blades = new THREE.InstancedMesh(geometry, material, samples.length)
    this.blades.frustumCulled = false
    this.bladeCount = samples.length

    this.updateWorldMatrix(true, false)
    const worldToLocal = this.matrixWorld.clone().invert()
    const random = seededRandom(options.seed ^ 0x9E3779B9)
    const rotation = new THREE.Quaternion()
    const spin = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    const matrix = new THREE.Matrix4()
    const up = THREE.Object3D.DEFAULT_UP

    for (let index = 0; index < samples.length; index += 1) {
      const localNormal = samples[index].normal.clone().transformDirection(worldToLocal)
      rotation.setFromUnitVectors(up, localNormal)
      spin.setFromAxisAngle(up, random() * Math.PI * 2)
      rotation.multiply(spin)
      scale.set(
        THREE.MathUtils.lerp(options.blade.minWidth, options.blade.maxWidth, random()),
        THREE.MathUtils.lerp(options.blade.minHeight, options.blade.maxHeight, random()),
        1,
      )
      matrix.compose(
        samples[index].position.clone().applyMatrix4(worldToLocal),
        rotation,
        scale,
      )
      this.blades.setMatrixAt(index, matrix)
    }

    this.blades.instanceMatrix.needsUpdate = true
    this.add(this.blades)
    this.setAppearance(options)
  }

  update(timeSeconds: number): void {
    if (this.disposed) {
      return
    }

    this.uniforms.uTime.value = timeSeconds
  }

  setAppearance(options: GrassAppearanceOptions): void {
    if (this.disposed) {
      return
    }

    this.setWind(options.wind)
    this.uniforms.uGrassBottom.value.set(options.colors.bottom)
    this.uniforms.uGrassTop.value.set(options.colors.top)
    this.uniforms.uBacklightColor.value.set(options.colors.backlight)
    this.uniforms.uBrightness.value = options.brightness
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.remove(this.blades)
    this.blades.geometry.dispose()
    this.blades.material.dispose()
    this.clear()
  }

  private setWind(wind: GrassWindOptions): void {
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
}
