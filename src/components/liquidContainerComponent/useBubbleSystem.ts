import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { MAX_BUBBLES } from './constants'
import type { ContainerGeometryBundle, SafeLiquidContainerProps } from './types'

type BubbleCustomMaterial = CustomShaderMaterial<typeof THREE.PointsMaterial>

export interface BubbleState {
  geometry: THREE.BufferGeometry
  material: BubbleCustomMaterial
  points: THREE.Points
  positions: Float32Array
  sizes: Float32Array
  seeds: Float32Array
  opacities: Float32Array
  offsets: Float32Array
  radialSeeds: Float32Array
  driftSeeds: Float32Array
  speedFactors: Float32Array
  activeCount: number
}

export const createBubbleState = (vertexShader: string, fragmentShader: string) => {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(MAX_BUBBLES * 3)
  const sizes = new Float32Array(MAX_BUBBLES)
  const seeds = new Float32Array(MAX_BUBBLES)
  const opacities = new Float32Array(MAX_BUBBLES)
  const offsets = new Float32Array(MAX_BUBBLES)
  const radialSeeds = new Float32Array(MAX_BUBBLES)
  const driftSeeds = new Float32Array(MAX_BUBBLES)
  const speedFactors = new Float32Array(MAX_BUBBLES)

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1))
  geometry.setDrawRange(0, 0)

  const material = new CustomShaderMaterial({
    baseMaterial: THREE.PointsMaterial,
    color: 0xFFFFFF,
    depthTest: true,
    depthWrite: false,
    fragmentShader,
    silent: true,
    size: 1,
    sizeAttenuation: true,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uColor: { value: new THREE.Color('#ffffff') },
      uOpacity: { value: 0.38 },
      uTime: { value: 0 },
    },
    vertexShader,
  })

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  points.renderOrder = 9

  return {
    geometry,
    material,
    points,
    positions,
    sizes,
    seeds,
    opacities,
    offsets,
    radialSeeds,
    driftSeeds,
    speedFactors,
    activeCount: 0,
  } satisfies BubbleState
}

export function updateBubbleState(
  state: BubbleState,
  elapsed: number,
  config: SafeLiquidContainerProps,
  geometry: ContainerGeometryBundle,
) {
  if (!state.activeCount) {
    return
  }

  const fillHeight = Math.max(0.12, geometry.liquidHeight * config.fillLevel)
  const bottomMargin = geometry.liquidHeight * 0.04
  const topMargin = geometry.liquidHeight * (0.06 + config.waveAmplitude * 0.85)
  const maxBubbleHeight = Math.max(bottomMargin, fillHeight - topMargin)
  const bobStrength = 0.01 + config.bubbleRandomness * 0.04
  state.material.uniforms.uTime.value = elapsed

  for (let index = 0; index < state.activeCount; index += 1) {
    const riseProgress = THREE.MathUtils.euclideanModulo(
      state.offsets[index] + elapsed * config.bubbleRiseSpeed * state.speedFactors[index] * 0.22,
      1,
    )
    const normalizedHeight = THREE.MathUtils.lerp(0.04, Math.max(0.08, config.fillLevel - 0.08), riseProgress)
    const bubbleOrigin = geometry.sampleBubblePosition(
      state.seeds[index],
      state.radialSeeds[index],
      normalizedHeight,
    )
    const cursor = index * 3
    const driftX = Math.sin(elapsed * (0.7 + state.speedFactors[index] * 0.18) + state.seeds[index] * 21.0)
      * bobStrength
      * state.driftSeeds[index]
    const driftZ = Math.cos(elapsed * (0.55 + state.speedFactors[index] * 0.16) + state.radialSeeds[index] * 28.0)
      * bobStrength
      * (0.55 + (1 - Math.abs(state.driftSeeds[index])) * 0.45)
    let x = bubbleOrigin.x + driftX
    let z = bubbleOrigin.z + driftZ

    if (geometry.surfaceShape === 'rect') {
      const safeX = geometry.liquidHalfExtents.x * 0.72
      const safeZ = geometry.liquidHalfExtents.z * 0.72
      x = THREE.MathUtils.clamp(x, -safeX, safeX)
      z = THREE.MathUtils.clamp(z, -safeZ, safeZ)
    }
    else {
      const safeRadius = geometry.sampleInnerRadius(normalizedHeight) * 0.72
      const radialLength = Math.hypot(x, z)

      if (radialLength > safeRadius && radialLength > 0.0001) {
        const scale = safeRadius / radialLength
        x *= scale
        z *= scale
      }
    }

    state.positions[cursor] = x
    state.positions[cursor + 1] = THREE.MathUtils.clamp(riseProgress * maxBubbleHeight, bottomMargin, maxBubbleHeight)
    state.positions[cursor + 2] = z
  }

  state.geometry.getAttribute('position').needsUpdate = true
}

export const rebuildBubbleState = (
  state: BubbleState,
  config: SafeLiquidContainerProps,
  geometry: ContainerGeometryBundle,
) => {
  state.activeCount = config.bubbleEnabled ? Math.min(config.bubbleCount, MAX_BUBBLES) : 0
  state.geometry.setDrawRange(0, state.activeCount)
  state.material.uniforms.uColor.value.set(config.bubbleColor)
  state.material.uniforms.uOpacity.value = THREE.MathUtils.clamp(config.opacity * 0.34, 0, 0.34)

  const containerReference = Math.max(
    0.9,
    Math.min(
      geometry.liquidHalfExtents.x * 2,
      geometry.liquidHalfExtents.y * 2,
      geometry.liquidHalfExtents.z * 2,
    ),
  )
  const sizeScale = THREE.MathUtils.clamp(24 / containerReference, 10, 24)

  for (let index = 0; index < MAX_BUBBLES; index += 1) {
    state.seeds[index] = Math.random()
    state.offsets[index] = Math.random()
    state.radialSeeds[index] = Math.random()
    state.driftSeeds[index] = Math.random() * 2 - 1
    state.speedFactors[index] = 0.65 + Math.random() * 0.8
    state.opacities[index] = THREE.MathUtils.lerp(0.04, 0.24, Math.random() ** 1.8)
    state.sizes[index] = THREE.MathUtils.lerp(
      config.bubbleSizeMin,
      config.bubbleSizeMax,
      Math.random() ** 2.25,
    ) * sizeScale
  }

  updateBubbleState(state, 0, config, geometry)
  state.geometry.getAttribute('aSize').needsUpdate = true
  state.geometry.getAttribute('aSeed').needsUpdate = true
  state.geometry.getAttribute('aOpacity').needsUpdate = true
  state.points.visible = state.activeCount > 0
}

export const disposeBubbleState = (state: BubbleState) => {
  state.geometry.dispose()
  state.material.dispose()
}
