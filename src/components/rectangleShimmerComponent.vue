<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { Line2, LineGeometry, LineMaterial } from 'three-stdlib'
import * as THREE from 'three'
import {
  computed,
  onBeforeUnmount,
  shallowRef,
  watch,
} from 'vue'

interface RunningLineSegment {
  geometry: LineGeometry
  line: Line2
  material: LineMaterial
}

const props = withDefaults(
  defineProps<{
    baseColor?: string
    gradientLength?: number
    height?: number
    length?: number
    lineColor?: string
    lineSpeed?: number
    lineWidth?: number
    segmentCount?: number
    wallBottomColor?: string
    wallTopColor?: string
    width?: number
  }>(),
  {
    baseColor: '#081426',
    gradientLength: 1.4,
    height: 1.4,
    length: 4,
    lineColor: '#4dd8ff',
    lineSpeed: 1.25,
    lineWidth: 0.08,
    segmentCount: 3,
    wallBottomColor: '#0f3a64',
    wallTopColor: '#76e4ff',
    width: 2.6,
  },
)

const tempResolution = new THREE.Vector2(1, 1)
const lineSegments = shallowRef<RunningLineSegment[]>([])

const clampNumber = (value: number | undefined, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback
  }
  return THREE.MathUtils.clamp(value as number, min, max)
}

const safeLength = computed(() => clampNumber(props.length, 0.4, 20, 4))
const safeWidth = computed(() => clampNumber(props.width, 0.4, 20, 2.6))
const safeHeight = computed(() => clampNumber(props.height, 0.2, 10, 1.4))
const safeLineWidth = computed(() => clampNumber(props.lineWidth, 0.01, 0.8, 0.08))
const safeLineSpeed = computed(() => clampNumber(props.lineSpeed, 0, 20, 1.25))
const safeSegmentCount = computed(() => Math.round(clampNumber(props.segmentCount, 1, 12, 3)))
const perimeterLength = computed(() => (safeLength.value + safeWidth.value) * 2)
const safeGradientLength = computed(() => {
  return clampNumber(props.gradientLength, 0.1, perimeterLength.value * 0.9, 1.4)
})

const wallUniforms = {
  uBottomColor: { value: new THREE.Color(props.wallBottomColor) },
  uTopColor: { value: new THREE.Color(props.wallTopColor) },
}

const wallVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const wallFragmentShader = `
uniform vec3 uBottomColor;
uniform vec3 uTopColor;
varying vec2 vUv;

void main() {
  vec3 color = mix(uBottomColor, uTopColor, clamp(vUv.y, 0.0, 1.0));
  gl_FragColor = vec4(color, 1.0);
}
`

const buildPerimeterPoint = (distance: number) => {
  const total = perimeterLength.value
  let cursor = THREE.MathUtils.euclideanModulo(distance, total)
  const halfLength = safeLength.value / 2
  const halfWidth = safeWidth.value / 2
  const y = 0.025

  if (cursor <= safeLength.value) {
    return new THREE.Vector3(-halfLength + cursor, y, -halfWidth)
  }
  cursor -= safeLength.value

  if (cursor <= safeWidth.value) {
    return new THREE.Vector3(halfLength, y, -halfWidth + cursor)
  }
  cursor -= safeWidth.value

  if (cursor <= safeLength.value) {
    return new THREE.Vector3(halfLength - cursor, y, halfWidth)
  }
  cursor -= safeLength.value

  return new THREE.Vector3(-halfLength, y, halfWidth - cursor)
}

const disposeLineSegments = () => {
  lineSegments.value.forEach(({ geometry, material }) => {
    geometry.dispose()
    material.dispose()
  })
  lineSegments.value = []
}

const rebuildLineSegments = () => {
  disposeLineSegments()
  const nextSegments: RunningLineSegment[] = []

  for (let index = 0; index < safeSegmentCount.value; index += 1) {
    const geometry = new LineGeometry()
    const material = new LineMaterial({
      color: new THREE.Color(props.lineColor).getHex(),
      depthWrite: false,
      transparent: true,
      linewidth: safeLineWidth.value,
      opacity: 1,
      toneMapped: false,
      vertexColors: true,
      worldUnits: true,
    })
    material.resolution.copy(tempResolution)
    const line = new Line2(geometry, material)
    line.renderOrder = 10
    nextSegments.push({ geometry, line, material })
  }

  lineSegments.value = nextSegments
}

const updateLineSegments = (elapsed: number, renderer?: { getSize: (target: THREE.Vector2) => THREE.Vector2 }) => {
  if (!lineSegments.value.length) {
    return
  }

  if (renderer) {
    renderer.getSize(tempResolution)
  }

  const segmentSpacing = perimeterLength.value / safeSegmentCount.value
  const lineColor = new THREE.Color(props.lineColor)
  const sampleCount = Math.max(24, Math.ceil(safeGradientLength.value * 18))

  lineSegments.value.forEach((segment, index) => {
    segment.material.color.set(props.lineColor)
    segment.material.linewidth = safeLineWidth.value
    segment.material.resolution.copy(tempResolution)

    const positions: number[] = []
    const colors: number[] = []
    const startDistance = elapsed * safeLineSpeed.value + index * segmentSpacing

    for (let step = 0; step < sampleCount; step += 1) {
      const t = sampleCount === 1 ? 1 : step / (sampleCount - 1)
      const point = buildPerimeterPoint(startDistance + t * safeGradientLength.value)
      const fade = 0.12 + 0.88 * t
      positions.push(point.x, point.y, point.z)
      colors.push(lineColor.r * fade, lineColor.g * fade, lineColor.b * fade)
    }

    segment.geometry.setPositions(positions)
    segment.geometry.setColors(colors)
    segment.line.computeLineDistances()
  })
}

watch(
  [safeLength, safeWidth, safeLineWidth, safeGradientLength, safeSegmentCount, () => props.lineColor],
  () => {
    rebuildLineSegments()
    updateLineSegments(0)
  },
  { immediate: true },
)

watch(
  [() => props.wallBottomColor, () => props.wallTopColor],
  ([wallBottomColor, wallTopColor]) => {
    wallUniforms.uBottomColor.value.set(wallBottomColor)
    wallUniforms.uTopColor.value.set(wallTopColor)
  },
  { immediate: true },
)

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed, renderer }) => {
  updateLineSegments(elapsed, renderer)
})

onBeforeUnmount(() => {
  disposeLineSegments()
})
</script>

<template>
  <TresGroup>
    <TresMesh :rotation="[-Math.PI / 2, 0, 0]">
      <TresPlaneGeometry :args="[safeLength, safeWidth]" />
      <TresMeshStandardMaterial :color="props.baseColor" :metalness="0.15" :roughness="0.72" />
    </TresMesh>

    <TresMesh :position="[0, safeHeight / 2, safeWidth / 2]">
      <TresPlaneGeometry :args="[safeLength, safeHeight]" />
      <TresShaderMaterial
        :fragment-shader="wallFragmentShader"
        :side="THREE.DoubleSide"
        :uniforms="wallUniforms"
        :vertex-shader="wallVertexShader"
      />
    </TresMesh>

    <TresMesh :position="[0, safeHeight / 2, -safeWidth / 2]" :rotation="[0, Math.PI, 0]">
      <TresPlaneGeometry :args="[safeLength, safeHeight]" />
      <TresShaderMaterial
        :fragment-shader="wallFragmentShader"
        :side="THREE.DoubleSide"
        :uniforms="wallUniforms"
        :vertex-shader="wallVertexShader"
      />
    </TresMesh>

    <TresMesh :position="[safeLength / 2, safeHeight / 2, 0]" :rotation="[0, -Math.PI / 2, 0]">
      <TresPlaneGeometry :args="[safeWidth, safeHeight]" />
      <TresShaderMaterial
        :fragment-shader="wallFragmentShader"
        :side="THREE.DoubleSide"
        :uniforms="wallUniforms"
        :vertex-shader="wallVertexShader"
      />
    </TresMesh>

    <TresMesh :position="[-safeLength / 2, safeHeight / 2, 0]" :rotation="[0, Math.PI / 2, 0]">
      <TresPlaneGeometry :args="[safeWidth, safeHeight]" />
      <TresShaderMaterial
        :fragment-shader="wallFragmentShader"
        :side="THREE.DoubleSide"
        :uniforms="wallUniforms"
        :vertex-shader="wallVertexShader"
      />
    </TresMesh>

    <primitive
      v-for="segment in lineSegments"
      :key="segment.line.uuid"
      :object="segment.line"
    />
  </TresGroup>
</template>
