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

type ColorTheme = 'cyan' | 'green' | 'warm'
type RawCoordinate = [number, number]

interface GeoJsonGeometry {
  coordinates?: unknown
  type?: string
}

interface GeoJsonFeature {
  geometry?: GeoJsonGeometry
}

interface GeoJsonFeatureCollection {
  features?: GeoJsonFeature[]
}

interface GeoBounds {
  maxLat: number
  maxLng: number
  minLat: number
  minLng: number
  valid: boolean
}

interface BusRoute {
  coordinates: RawCoordinate[]
}

interface BusLineItem {
  bucket: number
  geometry: LineGeometry
  line: Line2
  material: LineMaterial
  phase: number
}

const props = withDefaults(
  defineProps<{
    autoCenter?: boolean
    baseHeight?: number
    centerLat?: number
    centerLng?: number
    colorTheme?: ColorTheme
    dataUrl?: string
    dataUrlDraft?: string
    heightGroups?: number
    heightStep?: number
    lineWidth?: number
    mapScale?: number
    maxRoutes?: number
    opacity?: number
    pointSampleStep?: number
    pulseIntensity?: number
    pulseSpeed?: number
  }>(),
  {
    autoCenter: true,
    baseHeight: 0.06,
    centerLat: 39.800803,
    centerLng: 116.34344,
    colorTheme: 'green',
    dataUrl: './data/bj-bus.json',
    dataUrlDraft: './data/bj-bus.json',
    heightGroups: 9,
    heightStep: 0.055,
    lineWidth: 0.012,
    mapScale: 0.00003,
    maxRoutes: 1222,
    opacity: 0.82,
    pointSampleStep: 2,
    pulseIntensity: 0.28,
    pulseSpeed: 0.55,
  },
)

const DEFAULT_DATA_URL = './data/bj-bus.json'
const EARTH_RADIUS = 6378137
const DEG_TO_RAD = Math.PI / 180
const MAX_MERCATOR_LAT = 85.05112878
const ROUTE_LIMIT = 2000

const COLOR_THEMES: Record<ColorTheme, string[]> = {
  cyan: ['#083344', '#075985', '#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#f0f9ff'],
  green: ['#00441b', '#006d2c', '#238b45', '#41ab5d', '#74c476', '#a1d99b', '#c7e9c0', '#e5f5e0', '#f7fcf5'],
  warm: ['#3b1206', '#7f1d1d', '#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fde68a', '#fff7ad', '#fffbea'],
}

const rootGroup = shallowRef<THREE.Group | null>(new THREE.Group())
const lineItems = shallowRef<BusLineItem[]>([])
const sourceRoutes = shallowRef<BusRoute[]>([])
const sourceBounds = shallowRef<GeoBounds | null>(null)
const tempResolution = new THREE.Vector2(1, 1)

let abortController: AbortController | null = null
let loadToken = 0

if (rootGroup.value) {
  rootGroup.value.name = 'bus-line-network-component'
}

const clampNumber = (value: number | undefined, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return THREE.MathUtils.clamp(value as number, min, max)
}

const safeAutoCenter = computed(() => props.autoCenter !== false)
const safeBaseHeight = computed(() => clampNumber(props.baseHeight, 0, 2, 0.06))
const safeCenterLat = computed(() => clampNumber(props.centerLat, -MAX_MERCATOR_LAT, MAX_MERCATOR_LAT, 39.800803))
const safeCenterLng = computed(() => clampNumber(props.centerLng, -180, 180, 116.34344))
const safeColorTheme = computed<ColorTheme>(() => {
  return props.colorTheme && props.colorTheme in COLOR_THEMES ? props.colorTheme : 'green'
})
const normalizeDataUrl = (value: string | undefined) => value?.trim() || DEFAULT_DATA_URL

const safeDataUrl = computed(() => normalizeDataUrl(props.dataUrl))
const safeHeightGroups = computed(() => Math.round(clampNumber(props.heightGroups, 1, 12, 9)))
const safeHeightStep = computed(() => clampNumber(props.heightStep, 0, 0.5, 0.055))
const safeLineWidth = computed(() => clampNumber(props.lineWidth, 0.001, 0.08, 0.012))
const safeMapScale = computed(() => clampNumber(props.mapScale, 0.000005, 0.0002, 0.00003))
const safeMaxRoutes = computed(() => Math.round(clampNumber(props.maxRoutes, 1, ROUTE_LIMIT, 1222)))
const safeOpacity = computed(() => clampNumber(props.opacity, 0, 1, 0.82))
const safePointSampleStep = computed(() => Math.round(clampNumber(props.pointSampleStep, 1, 12, 2)))
const safePulseIntensity = computed(() => clampNumber(props.pulseIntensity, 0, 1, 0.28))
const safePulseSpeed = computed(() => clampNumber(props.pulseSpeed, 0, 6, 0.55))

const createEmptyBounds = (): GeoBounds => ({
  maxLat: -Infinity,
  maxLng: -Infinity,
  minLat: Infinity,
  minLng: Infinity,
  valid: false,
})

const extendBounds = (bounds: GeoBounds, [lng, lat]: RawCoordinate) => {
  bounds.minLng = Math.min(bounds.minLng, lng)
  bounds.maxLng = Math.max(bounds.maxLng, lng)
  bounds.minLat = Math.min(bounds.minLat, lat)
  bounds.maxLat = Math.max(bounds.maxLat, lat)
  bounds.valid = true
}

const isRawCoordinate = (value: unknown): value is RawCoordinate => {
  return Array.isArray(value)
    && value.length >= 2
    && Number.isFinite(value[0])
    && Number.isFinite(value[1])
}

const getLineCoordinateSets = (geometry: GeoJsonGeometry | undefined): RawCoordinate[][] => {
  if (!geometry || !Array.isArray(geometry.coordinates)) {
    return []
  }

  if (geometry.type === 'LineString') {
    return [geometry.coordinates.filter(isRawCoordinate)]
  }

  if (geometry.type === 'MultiLineString') {
    return geometry.coordinates
      .filter(Array.isArray)
      .map(item => item.filter(isRawCoordinate))
  }

  return []
}

const extractRoutes = (payload: unknown) => {
  const features = (payload as GeoJsonFeatureCollection)?.features
  const bounds = createEmptyBounds()
  const routes: BusRoute[] = []

  if (!Array.isArray(features)) {
    return { bounds: null, routes }
  }

  features.forEach((feature) => {
    getLineCoordinateSets(feature.geometry).forEach((coordinates) => {
      if (coordinates.length < 2) {
        return
      }

      coordinates.forEach(coordinate => extendBounds(bounds, coordinate))
      routes.push({ coordinates })
    })
  })

  return {
    bounds: bounds.valid ? bounds : null,
    routes,
  }
}

const projectMercator = (lng: number, lat: number) => {
  const clampedLat = THREE.MathUtils.clamp(lat, -MAX_MERCATOR_LAT, MAX_MERCATOR_LAT)
  const x = EARTH_RADIUS * lng * DEG_TO_RAD
  const y = EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + (clampedLat * DEG_TO_RAD) / 2))

  return { x, y }
}

const resolveCenter = () => {
  if (safeAutoCenter.value && sourceBounds.value) {
    return {
      lat: (sourceBounds.value.minLat + sourceBounds.value.maxLat) / 2,
      lng: (sourceBounds.value.minLng + sourceBounds.value.maxLng) / 2,
    }
  }

  return {
    lat: safeCenterLat.value,
    lng: safeCenterLng.value,
  }
}

const disposeLineItems = () => {
  lineItems.value.forEach(({ geometry, line, material }) => {
    line.removeFromParent()
    geometry.dispose()
    material.dispose()
  })

  lineItems.value = []
}

const pushProjectedPosition = (
  positions: number[],
  coordinate: RawCoordinate,
  center: { x: number, y: number },
  height: number,
) => {
  const projected = projectMercator(coordinate[0], coordinate[1])
  const x = (projected.x - center.x) * safeMapScale.value
  const z = -(projected.y - center.y) * safeMapScale.value
  const cursor = positions.length

  if (
    cursor >= 3
    && Math.abs(positions[cursor - 3] - x) < 0.000001
    && Math.abs(positions[cursor - 2] - height) < 0.000001
    && Math.abs(positions[cursor - 1] - z) < 0.000001
  ) {
    return
  }

  positions.push(x, height, z)
}

const buildRoutePositions = (
  coordinates: RawCoordinate[],
  center: { x: number, y: number },
  height: number,
) => {
  const positions: number[] = []
  const step = safePointSampleStep.value
  const lastIndex = coordinates.length - 1

  for (let index = 0; index < coordinates.length; index += step) {
    pushProjectedPosition(positions, coordinates[index], center, height)
  }

  if (lastIndex % step !== 0) {
    pushProjectedPosition(positions, coordinates[lastIndex], center, height)
  }

  return positions
}

const createLineItem = (positions: number[], routeIndex: number) => {
  const bucket = routeIndex % safeHeightGroups.value
  const palette = COLOR_THEMES[safeColorTheme.value]
  const color = new THREE.Color(palette[bucket % palette.length])
  const geometry = new LineGeometry()
  const material = new LineMaterial({
    color: color.getHex(),
    depthTest: true,
    depthWrite: false,
    linewidth: safeLineWidth.value,
    opacity: safeOpacity.value,
    toneMapped: false,
    transparent: true,
    worldUnits: true,
  })

  geometry.setPositions(positions)
  material.resolution.copy(tempResolution)

  const line = new Line2(geometry, material)
  line.computeLineDistances()
  line.frustumCulled = false
  line.renderOrder = 8
  rootGroup.value?.add(line)

  return {
    bucket,
    geometry,
    line,
    material,
    phase: routeIndex * 0.37,
  }
}

const rebuildLineNetwork = () => {
  disposeLineItems()

  if (!rootGroup.value || !sourceRoutes.value.length) {
    return
  }

  const centerLngLat = resolveCenter()
  const projectedCenter = projectMercator(centerLngLat.lng, centerLngLat.lat)
  const routeCount = Math.min(sourceRoutes.value.length, safeMaxRoutes.value)
  const nextItems: BusLineItem[] = []

  for (let routeIndex = 0; routeIndex < routeCount; routeIndex += 1) {
    const bucket = routeIndex % safeHeightGroups.value
    const height = safeBaseHeight.value + bucket * safeHeightStep.value
    const positions = buildRoutePositions(sourceRoutes.value[routeIndex].coordinates, projectedCenter, height)

    if (positions.length < 6) {
      continue
    }

    nextItems.push(createLineItem(positions, routeIndex))
  }

  lineItems.value = nextItems
}

const syncLineMaterials = (elapsed = 0) => {
  const palette = COLOR_THEMES[safeColorTheme.value]
  const pulseSpeed = safePulseSpeed.value
  const pulseIntensity = safePulseIntensity.value

  lineItems.value.forEach((item) => {
    const color = palette[item.bucket % palette.length]
    const pulse = pulseSpeed > 0
      ? 1 - pulseIntensity + pulseIntensity * (Math.sin(elapsed * pulseSpeed + item.phase) * 0.5 + 0.5)
      : 1

    item.material.color.set(color)
    item.material.linewidth = safeLineWidth.value
    item.material.opacity = THREE.MathUtils.clamp(safeOpacity.value * pulse, 0, 1)
    item.material.resolution.copy(tempResolution)
  })
}

const loadGeoJson = async (url = safeDataUrl.value) => {
  const token = loadToken + 1
  loadToken = token

  abortController?.abort()
  const controller = new AbortController()
  abortController = controller

  try {
    const response = await fetch(url, { signal: controller.signal })

    if (!response.ok) {
      throw new Error(`GeoJSON request failed with ${response.status}`)
    }

    const payload = await response.json()

    if (token !== loadToken) {
      return
    }

    const { bounds, routes } = extractRoutes(payload)
    sourceRoutes.value = routes
    sourceBounds.value = bounds
    rebuildLineNetwork()
  }
  catch (error) {
    if (controller.signal.aborted) {
      return
    }

    console.warn('[busLineNetworkComponent] Failed to load bus GeoJSON.', error)
    sourceRoutes.value = []
    sourceBounds.value = null
    disposeLineItems()
  }
}

const applyDataUrlAction = () => {
  const dataUrl = normalizeDataUrl(props.dataUrlDraft ?? props.dataUrl)

  if (dataUrl === safeDataUrl.value) {
    void loadGeoJson(dataUrl)
  }

  return {
    dataUrl,
    dataUrlDraft: dataUrl,
  }
}

watch(safeDataUrl, () => {
  void loadGeoJson()
}, { immediate: true })

watch(
  [
    safeAutoCenter,
    safeBaseHeight,
    safeCenterLat,
    safeCenterLng,
    safeHeightGroups,
    safeHeightStep,
    safeMapScale,
    safeMaxRoutes,
    safePointSampleStep,
  ],
  rebuildLineNetwork,
)

watch(
  [
    safeColorTheme,
    safeLineWidth,
    safeOpacity,
    safePulseIntensity,
    safePulseSpeed,
  ],
  () => syncLineMaterials(),
  { immediate: true },
)

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed, renderer }) => {
  renderer.getSize(tempResolution)
  syncLineMaterials(elapsed)
})

onBeforeUnmount(() => {
  loadToken += 1
  abortController?.abort()
  abortController = null
  disposeLineItems()
  rootGroup.value?.removeFromParent()
  rootGroup.value = null
})

defineExpose({
  applyDataUrlAction,
})
</script>

<template>
  <primitive
    v-if="rootGroup"
    :object="rootGroup"
  />
</template>
