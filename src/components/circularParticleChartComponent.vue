<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'
import {
  computed,
  onBeforeUnmount,
  shallowRef,
  watch,
} from 'vue'
import chartFragmentShader from '../shader/circularParticleChartComponent/chart.frag?raw'
import chartVertexShader from '../shader/circularParticleChartComponent/chart.vert?raw'
import sweepFragmentShader from '../shader/circularParticleChartComponent/sweep.frag?raw'
import sweepVertexShader from '../shader/circularParticleChartComponent/sweep.vert?raw'

const props = withDefaults(
  defineProps<{
    line2?: number
    lineColor?: string
    particleColor?: string
    particleSize?: number
    scanSpeed?: number
    textColor?: string
    titleSize?: number
    titleText?: string
    unitSize?: number
    unitText?: string
  }>(),
  {
    line2: 0.035,
    lineColor: '#ffffff',
    particleColor: '#34ff63',
    particleSize: 4.8,
    scanSpeed: 0.36,
    textColor: '#e8fbff',
    titleSize: 48,
    titleText: '86.4',
    unitSize: 18,
    unitText: 'ENERGY INDEX',
  },
)

const DEFAULTS = {
  line2: 0.035,
  lineColor: '#ffffff',
  particleColor: '#34ff63',
  particleSize: 4.8,
  scanSpeed: 0.36,
  textColor: '#e8fbff',
  titleSize: 48,
  titleText: '86.4',
  unitSize: 18,
  unitText: 'ENERGY INDEX',
} as const

const PARTICLE_COUNT = 5600
const CHART_RADIUS = 2.42
const INNER_RADIUS_RATIO = 0.24

const points = shallowRef<THREE.Points | null>(null)
const pointGeometry = shallowRef<THREE.BufferGeometry | null>(null)
const pointMaterial = shallowRef<THREE.ShaderMaterial | null>(null)
const reticleGroup = shallowRef<any>(null)
const sweepMaterial = shallowRef<THREE.ShaderMaterial | null>(null)
const titleMesh = shallowRef<THREE.Mesh | null>(null)
const unitMesh = shallowRef<THREE.Mesh | null>(null)

const clampNumber = (value: number | undefined, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return THREE.MathUtils.clamp(value as number, min, max)
}

const safeLine2 = computed(() => clampNumber(props.line2, 0.006, 0.18, DEFAULTS.line2))
const safeLineColor = computed(() => props.lineColor || DEFAULTS.lineColor)
const safeParticleSize = computed(() => clampNumber(props.particleSize, 1, 24, DEFAULTS.particleSize))
const safeScanSpeed = computed(() => clampNumber(props.scanSpeed, -1, 1, DEFAULTS.scanSpeed))
const safeTextColor = computed(() => props.textColor || DEFAULTS.textColor)
const safeTitleSize = computed(() => clampNumber(props.titleSize, 10, 96, DEFAULTS.titleSize))
const safeTitleText = computed(() => String(props.titleText || DEFAULTS.titleText))
const safeUnitSize = computed(() => clampNumber(props.unitSize, 8, 64, DEFAULTS.unitSize))
const safeUnitText = computed(() => String(props.unitText || DEFAULTS.unitText))

const setColor = (target: THREE.Color, value: string | undefined, fallback: string) => {
  try {
    target.set(value ?? fallback)
  }
  catch {
    target.set(fallback)
  }
}

const pseudoRandom = (value: number) => {
  const result = Math.sin(value * 12.9898) * 43758.5453
  return result - Math.floor(result)
}

const createParticleGeometry = () => {
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const angles = new Float32Array(PARTICLE_COUNT)
  const radii = new Float32Array(PARTICLE_COUNT)
  const seeds = new Float32Array(PARTICLE_COUNT)
  const sizeFactors = new Float32Array(PARTICLE_COUNT)
  const bands = new Float32Array(PARTICLE_COUNT)
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const cursor = index * 3
    const seed = pseudoRandom(index + 1)
    const scatter = pseudoRandom(index * 3.17 + 11)
    const bandSeed = pseudoRandom(index * 7.29 + 19)
    const angle = (index * goldenAngle + scatter * 0.22) % (Math.PI * 2)
    let radius = THREE.MathUtils.lerp(INNER_RADIUS_RATIO + 0.035, 0.96, Math.sqrt(seed))
    let band = 0

    if (bandSeed > 0.68) {
      const ring = Math.floor(pseudoRandom(index * 2.71 + 29) * 6)
      radius = THREE.MathUtils.lerp(INNER_RADIUS_RATIO + 0.045, 0.94, ring / 5) + (pseudoRandom(index * 9.13 + 7) - 0.5) * 0.018
      band = 1
    }

    if (bandSeed > 0.9) {
      radius = THREE.MathUtils.lerp(0.88, 1.01, pseudoRandom(index * 4.51 + 17))
      band = 2
    }

    positions[cursor] = Math.cos(angle) * radius * CHART_RADIUS
    positions[cursor + 1] = 0
    positions[cursor + 2] = Math.sin(angle) * radius * CHART_RADIUS
    angles[index] = angle
    radii[index] = radius
    seeds[index] = seed
    sizeFactors[index] = 0.58 + pseudoRandom(index * 5.71 + 5) * 0.9 + band * 0.18
    bands[index] = band
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1))
  geometry.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aSizeFactor', new THREE.BufferAttribute(sizeFactors, 1))
  geometry.setAttribute('aBand', new THREE.BufferAttribute(bands, 1))
  geometry.computeBoundingSphere()

  return geometry
}

const particleUniforms = {
  uParticleColor: { value: new THREE.Color(DEFAULTS.particleColor) },
  uParticleSize: { value: safeParticleSize.value },
  uScanSpeed: { value: safeScanSpeed.value },
  uTime: { value: 0 },
}

const createPointMaterial = () => {
  return new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    fragmentShader: chartFragmentShader,
    toneMapped: false,
    transparent: true,
    uniforms: particleUniforms,
    vertexShader: chartVertexShader,
  })
}

const sweepUniforms = {
  uColor: { value: new THREE.Color(DEFAULTS.particleColor) },
  uInnerRadius: { value: INNER_RADIUS_RATIO },
  uScanSpeed: { value: safeScanSpeed.value },
  uTime: { value: 0 },
}

const createSweepMaterial = () => {
  return new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    fragmentShader: sweepFragmentShader,
    side: THREE.DoubleSide,
    toneMapped: false,
    transparent: true,
    uniforms: sweepUniforms,
    vertexShader: sweepVertexShader,
  })
}

const createRingMesh = (radius: number, thickness: number, opacity: number) => {
  const halfThickness = thickness * 0.5
  const geometry = new THREE.RingGeometry(
    Math.max(0.01, radius - halfThickness),
    radius + halfThickness,
    192,
    1,
  )
  const material = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    color: new THREE.Color(DEFAULTS.lineColor),
    depthTest: true,
    depthWrite: false,
    opacity,
    side: THREE.DoubleSide,
    toneMapped: false,
    transparent: true,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2
  mesh.renderOrder = 4

  return mesh
}

const createReticle = () => {
  const group = new THREE.Group()
  const lineWidth = safeLine2.value
  const outerRadius = CHART_RADIUS * 1.012
  const innerRadius = outerRadius - lineWidth * 3.2

  group.name = 'CircularParticleChart_reticle'

  group.add(createRingMesh(outerRadius, lineWidth, 0.72))
  group.add(createRingMesh(innerRadius, lineWidth * 0.74, 0.46))

  return group
}

const makeTextCanvas = (text: string, fontSize: number, color: string, weight = 700) => {
  const safeText = text || ' '
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    return { canvas, width: 1, height: 1 }
  }

  const fontFamily = 'DIN Alternate, Teko, Bahnschrift, Arial, sans-serif'
  const paddingX = Math.max(28, fontSize * 0.58)
  const paddingY = Math.max(14, fontSize * 0.32)
  context.font = `${weight} ${fontSize}px ${fontFamily}`
  const metrics = context.measureText(safeText)
  const width = Math.ceil(metrics.width + paddingX * 2)
  const height = Math.ceil(fontSize + paddingY * 2)
  const dpi = 3

  canvas.width = width * dpi
  canvas.height = height * dpi
  context.scale(dpi, dpi)
  context.clearRect(0, 0, width, height)
  context.font = `${weight} ${fontSize}px ${fontFamily}`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.shadowColor = color
  context.shadowBlur = fontSize * 0.18
  context.fillStyle = color
  context.fillText(safeText, width * 0.5, height * 0.5)

  return { canvas, width, height }
}

const disposeMaterial = (material?: THREE.Material | THREE.Material[]) => {
  if (Array.isArray(material)) {
    material.forEach(item => item.dispose())
  }
  else {
    material?.dispose()
  }
}

const disposeTextMesh = (mesh: THREE.Mesh | null) => {
  if (!mesh) {
    return
  }

  const material = mesh.material as THREE.MeshBasicMaterial
  const map = material.map
  mesh.geometry.dispose()
  material.dispose()
  map?.dispose()
}

const createTextMesh = (
  text: string,
  fontSize: number,
  color: string,
  z: number,
  scaleFactor: number,
  weight = 700,
) => {
  const { canvas, width, height } = makeTextCanvas(text, fontSize, color, weight)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true

  const geometry = new THREE.PlaneGeometry(width * scaleFactor, height * scaleFactor)
  const material = new THREE.MeshBasicMaterial({
    depthTest: false,
    depthWrite: false,
    map: texture,
    side: THREE.DoubleSide,
    toneMapped: false,
    transparent: true,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(0, 0.12, z)
  mesh.rotation.x = -Math.PI / 2
  mesh.renderOrder = 12

  return mesh
}

const rebuildText = () => {
  disposeTextMesh(titleMesh.value)
  disposeTextMesh(unitMesh.value)
  titleMesh.value = createTextMesh(safeTitleText.value, safeTitleSize.value, safeTextColor.value, -0.12, 0.0098, 800)
  unitMesh.value = createTextMesh(safeUnitText.value, safeUnitSize.value, safeTextColor.value, 0.34, 0.0092, 600)
}

const disposeObject = (object: THREE.Object3D) => {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh | THREE.Line | THREE.Points
    const geometry = mesh.geometry as THREE.BufferGeometry | undefined
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined

    geometry?.dispose()
    disposeMaterial(material)
  })
}

const disposeReticle = () => {
  if (reticleGroup.value) {
    disposeObject(reticleGroup.value)
  }

  reticleGroup.value = null
  sweepMaterial.value = null
}

const disposeChart = () => {
  pointGeometry.value?.dispose()
  pointMaterial.value?.dispose()
  disposeReticle()
  disposeTextMesh(titleMesh.value)
  disposeTextMesh(unitMesh.value)

  pointGeometry.value = null
  pointMaterial.value = null
  points.value = null
  titleMesh.value = null
  unitMesh.value = null
}

const createChart = () => {
  disposeChart()

  const geometry = createParticleGeometry()
  const material = createPointMaterial()
  const particlePoints = new THREE.Points(geometry, material)
  particlePoints.frustumCulled = false
  particlePoints.renderOrder = 5

  pointGeometry.value = geometry
  pointMaterial.value = material
  points.value = particlePoints
  reticleGroup.value = createReticle()
  rebuildText()
}

const syncColors = () => {
  if (pointMaterial.value) {
    setColor(pointMaterial.value.uniforms.uParticleColor.value, props.particleColor, DEFAULTS.particleColor)
  }

  if (sweepMaterial.value) {
    setColor(sweepMaterial.value.uniforms.uColor.value, props.particleColor, DEFAULTS.particleColor)
  }

  if (!reticleGroup.value) {
    return
  }

  reticleGroup.value.traverse((child: any) => {
    const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined
    if (material?.color) {
      setColor(material.color, safeLineColor.value, DEFAULTS.lineColor)
    }
  })
}

const rebuildReticle = () => {
  disposeReticle()
  reticleGroup.value = createReticle()
  syncColors()
}

createChart()

watch(
  [() => props.particleColor, safeLineColor, safeParticleSize, safeScanSpeed],
  () => {
    if (!pointMaterial.value) {
      return
    }

    pointMaterial.value.uniforms.uParticleSize.value = safeParticleSize.value
    pointMaterial.value.uniforms.uScanSpeed.value = safeScanSpeed.value
    if (sweepMaterial.value) {
      sweepMaterial.value.uniforms.uScanSpeed.value = safeScanSpeed.value
    }
    syncColors()
  },
  { immediate: true },
)

watch(safeLine2, () => {
  rebuildReticle()
})

watch(
  [safeTitleText, safeTitleSize, safeUnitText, safeUnitSize, safeTextColor],
  () => {
    rebuildText()
  },
)

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  if (pointMaterial.value) {
    pointMaterial.value.uniforms.uTime.value = elapsed
  }

  if (sweepMaterial.value) {
    sweepMaterial.value.uniforms.uTime.value = elapsed
  }
})

onBeforeUnmount(() => {
  disposeChart()
})
</script>

<template>
  <TresGroup>
    <primitive
      v-if="reticleGroup"
      :object="reticleGroup"
    />
    <primitive
      v-if="points"
      :object="points"
    />
    <primitive
      v-if="titleMesh"
      :object="titleMesh"
    />
    <primitive
      v-if="unitMesh"
      :object="unitMesh"
    />
  </TresGroup>
</template>
