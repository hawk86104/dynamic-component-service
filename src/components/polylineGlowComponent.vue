<script setup lang="ts">
// 参考 Mars3D PolylineGlow: http://mars3d.cn/editor-vue.html?key=ex_4_1_1&id=layer-graphic/geojson/polylineGlow
// 只暴露 Mars3D PolylineGlow 的原生属性: width / color / opacity / glowPower
// 以及 dataUrl / 确认生成 / 原始定位 3 项编辑器集成入口
import { useLoop } from '@tresjs/core'
import { LineMaterial, LineSegments2, LineSegmentsGeometry } from 'three-stdlib'
import * as THREE from 'three'
import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  shallowRef,
  watch,
} from 'vue'

type RawCoordinate = [number, number]

interface GeoJsonGeometry { coordinates?: unknown, type?: string }
interface GeoJsonFeature { geometry?: GeoJsonGeometry }
interface GeoJsonFeatureCollection { features?: GeoJsonFeature[] }
interface GeoBounds { maxLat: number, maxLng: number, minLat: number, minLng: number, valid: boolean }
interface GlowRoute { coordinates: RawCoordinate[] }
interface GeoPosition { height: number, lat: number, lon: number }
interface GeoPositionTarget { geoPosition?: GeoPosition, uuid?: string }
interface GisPlaneEditorMeshEntry { object3D?: GeoPositionTarget }
interface GisPlaneEditorMeshListState { emxlist?: Record<string, GisPlaneEditorMeshEntry> }

interface LinePair {
  geometry: LineSegmentsGeometry
  line: LineSegments2
  material: LineMaterial
}

declare global {
  interface Window {
    gisPlaneEditorExtendMeshList?: GisPlaneEditorMeshListState
    gisPlaneEditor_extendMeshes_group?: unknown
  }
}

const props = withDefaults(
  defineProps<{
    color?: string
    dataUrl?: string
    dataUrlDraft?: string
    glowColor?: string
    glowPower?: number
    opacity?: number
    uuid?: string
    width?: number
    widthScale?: number
  }>(),
  {
    color: '#FF4500',
    dataUrl: 'https://dcser.icegl.cn/data/wuhan-line3.json',
    dataUrlDraft: 'https://dcser.icegl.cn/data/wuhan-line3.json',
    glowColor: '#FF4500',
    glowPower: 0.1,
    opacity: 0.9,
    width: 0.05,
    widthScale: 1,
  },
)

// —— 内部常量: 将 GeoJSON 投影到 tresjs 场景所需, 非 Mars3D 属性, 不开放配置 ——
const DEFAULT_DATA_URL = 'https://dcser.icegl.cn/data/wuhan-line3.json'
const EARTH_RADIUS = 6378137
const DEG_TO_RAD = Math.PI / 180
const MAX_MERCATOR_LAT = 85.05112878
const MAP_SCALE = 0.00003
const LINE_HEIGHT = 0
const LINE_WORLD_RAY_LENGTH = '1e12'
const LINE_WORLD_RAY_TOKEN = 'normalize( worldPos.xyz ) * 1e5'
const CAMERA_FAR_PADDING = 100
const CAMERA_FAR_PADDING_RATIO = 1.25
const DEFAULT_CENTER = { lat: 30.588, lng: 114.305 }

const componentInstance = getCurrentInstance()
const rootGroup = shallowRef<THREE.Group | null>(new THREE.Group())
const coreItem = shallowRef<LinePair | null>(null)
const haloItem = shallowRef<LinePair | null>(null)
const sourceRoutes = shallowRef<GlowRoute[]>([])
const sourceBounds = shallowRef<GeoBounds | null>(null)
const tempResolution = new THREE.Vector2(1, 1)
const tempWorldScale = new THREE.Vector3(1, 1, 1)
const tempCameraPosition = new THREE.Vector3()
const tempNetworkSphere = new THREE.Sphere()

let abortController: AbortController | null = null
let loadToken = 0
let syncedCamera: THREE.OrthographicCamera | THREE.PerspectiveCamera | null = null
let syncedCameraFar = -1
let syncedCoreLineWidth = -1
let syncedHaloLineWidth = -1
let syncedResolutionWidth = -1
let syncedResolutionHeight = -1
// 本地包围球在 rebuildLines 时计算一次，后续每帧只需叠加 rootGroup 的 matrixWorld
const localBoundingSphere = new THREE.Sphere()
let hasLocalBoundingSphere = false

if (rootGroup.value) {
  rootGroup.value.name = 'polyline-glow-component'
  rootGroup.value.frustumCulled = false
}

const syncRootGroupUuid = () => {
  if (rootGroup.value && props.uuid) {
    rootGroup.value.uuid = props.uuid
  }
}

const clampNumber = (value: number | undefined, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback
  }
  return THREE.MathUtils.clamp(value as number, min, max)
}

const normalizeDataUrl = (value: string | undefined) => value?.trim() || DEFAULT_DATA_URL

const safeColor = computed(() => props.color || '#FF4500')
const safeGlowColor = computed(() => props.glowColor || props.color || '#FF4500')
const safeDataUrl = computed(() => normalizeDataUrl(props.dataUrl))
const safeGlowPower = computed(() => clampNumber(props.glowPower, 0.01, 1, 0.1))
const safeOpacity = computed(() => clampNumber(props.opacity, 0, 1, 0.9))
const safeWidthScale = computed(() => clampNumber(props.widthScale, 0.1, 30, 1))
const safeWidth = computed(() => clampNumber(props.width, 0.001, 1, 0.05) * safeWidthScale.value)

// halo 宽度与透明度根据 glowPower 内部换算, 不暴露
const safeHaloWidth = computed(() => safeWidth.value * (1 + safeGlowPower.value * 12))
const safeHaloOpacity = computed(() => THREE.MathUtils.clamp(safeOpacity.value * (0.2 + safeGlowPower.value * 1.6), 0, 1))

// —— GeoJSON 解析 ——
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
  const routes: GlowRoute[] = []

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
  if (sourceBounds.value) {
    return {
      lat: (sourceBounds.value.minLat + sourceBounds.value.maxLat) / 2,
      lng: (sourceBounds.value.minLng + sourceBounds.value.maxLng) / 2,
    }
  }
  return DEFAULT_CENTER
}

const getGlowNativeGeoPosition = (): GeoPosition => {
  if (!sourceBounds.value) {
    throw new TypeError('光晕线原始坐标尚未准备完成，请稍后再试')
  }
  const lon = (sourceBounds.value.minLng + sourceBounds.value.maxLng) / 2
  const lat = (sourceBounds.value.minLat + sourceBounds.value.maxLat) / 2
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    throw new TypeError('光晕线原始坐标解析失败')
  }
  return {
    height: 0,
    lat: Number(lat.toFixed(6)),
    lon: Number(lon.toFixed(6)),
  }
}

// —— GIS 编辑器适配 (uuid 透传 / 原始定位回写) ——
const toRecord = (value: unknown): Record<string, unknown> | null => {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
}

const unwrapRefLike = (value: unknown): unknown => {
  const record = toRecord(value)
  if (record && 'value' in record) {
    return record.value
  }
  return value
}

const getComponentInstanceSources = (instance: unknown): unknown[] => {
  const record = toRecord(instance)
  if (!record) {
    return []
  }
  return [record.exposed, record.proxy, record.setupState, record.ctx]
}

const getComponentInstanceParent = (instance: unknown): unknown => {
  return toRecord(instance)?.parent ?? null
}

const getMeshListFromSource = (source: unknown): Record<string, GisPlaneEditorMeshEntry> | null => {
  const record = toRecord(unwrapRefLike(source))
  if (!record) {
    return null
  }

  const directEmxlist = toRecord(unwrapRefLike(record.emxlist))
  if (directEmxlist) {
    return directEmxlist as Record<string, GisPlaneEditorMeshEntry>
  }

  const storeState = toRecord(unwrapRefLike(record.gisPlaneEditorExtendMeshList))
  const storeEmxlist = toRecord(unwrapRefLike(storeState?.emxlist))
  if (storeEmxlist) {
    return storeEmxlist as Record<string, GisPlaneEditorMeshEntry>
  }

  const piniaState = toRecord(unwrapRefLike(toRecord(record.state)?.value))
  const piniaStore = toRecord(unwrapRefLike(piniaState?.gisPlaneEditorExtendMeshList))
  const piniaEmxlist = toRecord(unwrapRefLike(piniaStore?.emxlist))
  if (piniaEmxlist) {
    return piniaEmxlist as Record<string, GisPlaneEditorMeshEntry>
  }

  return null
}

const getMeshListFromComponentChain = (): Record<string, GisPlaneEditorMeshEntry> | null => {
  let current: unknown = componentInstance
  while (current) {
    for (const source of getComponentInstanceSources(current)) {
      const directMeshList = getMeshListFromSource(source)
      if (directMeshList) {
        return directMeshList
      }
      const record = toRecord(source)
      if (!record) {
        continue
      }
      for (const key of ['curExtendMeshList', 'extendMeshList', 'extendMeshListStore']) {
        const nestedMeshList = getMeshListFromSource(record[key])
        if (nestedMeshList) {
          return nestedMeshList
        }
      }
    }
    current = getComponentInstanceParent(current)
  }
  return null
}

const getGeoPositionTargetFromSource = (
  source: unknown,
  uuid: string,
  seen: WeakSet<object> = new WeakSet<object>(),
): GeoPositionTarget | null => {
  const record = toRecord(unwrapRefLike(source))
  if (!record || seen.has(record)) {
    return null
  }
  seen.add(record)

  const object3D = toRecord(unwrapRefLike(record.object3D))
  if (object3D?.uuid === uuid && toRecord(object3D.geoPosition)) {
    return object3D as GeoPositionTarget
  }
  if (record.uuid === uuid && toRecord(record.geoPosition)) {
    return record as GeoPositionTarget
  }
  for (const value of Object.values(record)) {
    const target: GeoPositionTarget | null = getGeoPositionTargetFromSource(value, uuid, seen)
    if (target) {
      return target
    }
  }
  return null
}

const getGeoPositionTargetFromComponentChain = (uuid: string): GeoPositionTarget | null => {
  let current: unknown = componentInstance
  while (current) {
    for (const source of getComponentInstanceSources(current)) {
      const target = getGeoPositionTargetFromSource(source, uuid)
      if (target) {
        return target
      }
    }
    current = getComponentInstanceParent(current)
  }
  return null
}

const getWindowEditorMeshList = (): Record<string, GisPlaneEditorMeshEntry> | null => {
  const componentMeshList = getMeshListFromComponentChain()
  if (componentMeshList) {
    return componentMeshList
  }
  return typeof window !== 'undefined' ? window.gisPlaneEditorExtendMeshList?.emxlist ?? null : null
}

const getGisPlaneEditorGeoPositionTarget = (): GeoPositionTarget | null => {
  const uuid = props.uuid?.trim()
  if (uuid) {
    const emxlist = getWindowEditorMeshList()
    const storeTarget = emxlist?.[uuid]?.object3D
    if (storeTarget) {
      return storeTarget
    }
    const componentTarget = getGeoPositionTargetFromComponentChain(uuid)
    if (componentTarget) {
      return componentTarget
    }
  }
  const emxlist = getWindowEditorMeshList()
  if (!emxlist) {
    return null
  }
  let current = rootGroup.value?.parent ?? null
  while (current) {
    const mesh = emxlist[current.uuid]
    if (mesh?.object3D) {
      return mesh.object3D
    }
    current = current.parent
  }
  return null
}

// —— 线段构建 ——
const disposeLinePair = (pair: LinePair | null) => {
  if (!pair) {
    return
  }
  pair.line.removeFromParent()
  pair.geometry.dispose()
  pair.material.dispose()
}

const disposeAllLines = () => {
  disposeLinePair(coreItem.value)
  disposeLinePair(haloItem.value)
  coreItem.value = null
  haloItem.value = null
}

const pushProjectedPosition = (
  positions: number[],
  coordinate: RawCoordinate,
  center: { x: number, y: number },
) => {
  const projected = projectMercator(coordinate[0], coordinate[1])
  const x = (projected.x - center.x) * MAP_SCALE
  const z = -(projected.y - center.y) * MAP_SCALE
  const cursor = positions.length

  if (
    cursor >= 3
    && Math.abs(positions[cursor - 3] - x) < 0.000001
    && Math.abs(positions[cursor - 2] - LINE_HEIGHT) < 0.000001
    && Math.abs(positions[cursor - 1] - z) < 0.000001
  ) {
    return
  }
  positions.push(x, LINE_HEIGHT, z)
}

const buildAllSegments = () => {
  const centerLngLat = resolveCenter()
  const projectedCenter = projectMercator(centerLngLat.lng, centerLngLat.lat)
  const segments: number[] = []

  sourceRoutes.value.forEach((route) => {
    const positions: number[] = []
    route.coordinates.forEach(coordinate => pushProjectedPosition(positions, coordinate, projectedCenter))
    for (let i = 0; i <= positions.length - 6; i += 3) {
      segments.push(
        positions[i],
        positions[i + 1],
        positions[i + 2],
        positions[i + 3],
        positions[i + 4],
        positions[i + 5],
      )
    }
  })

  return segments
}

const expandWorldLineMaterialRange = (material: LineMaterial) => {
  if (!material.fragmentShader.includes(LINE_WORLD_RAY_TOKEN)) {
    return
  }
  material.fragmentShader = material.fragmentShader.replace(
    LINE_WORLD_RAY_TOKEN,
    `normalize( worldPos.xyz ) * ${LINE_WORLD_RAY_LENGTH}`,
  )
  material.needsUpdate = true
}

const createLineItem = (
  segments: number[],
  options: { blending: THREE.Blending, color: string, linewidth: number, opacity: number, renderOrder: number },
): LinePair => {
  const geometry = new LineSegmentsGeometry()
  geometry.setPositions(segments)
  geometry.computeBoundingSphere()

  const material = new LineMaterial({
    color: new THREE.Color(options.color).getHex(),
    depthTest: false,
    depthWrite: false,
    linewidth: options.linewidth,
    opacity: options.opacity,
    toneMapped: false,
    transparent: true,
    worldUnits: true,
  })
  material.blending = options.blending
  expandWorldLineMaterialRange(material)
  material.resolution.copy(tempResolution)

  const line = new LineSegments2(geometry, material)
  line.frustumCulled = false
  line.renderOrder = options.renderOrder
  rootGroup.value?.add(line)

  return { geometry, line, material }
}

const getLineWidthWorldScale = () => {
  if (!rootGroup.value) {
    return 1
  }
  rootGroup.value.updateWorldMatrix(true, false)
  rootGroup.value.getWorldScale(tempWorldScale)
  const horizontalScale = (Math.abs(tempWorldScale.x) + Math.abs(tempWorldScale.z)) / 2
  return clampNumber(horizontalScale, 0.0001, 1000000, 1)
}

// 静态: 属性变化时立即写入一次, 不在每帧循环里跑
const applyStaticMaterials = () => {
  if (coreItem.value) {
    coreItem.value.material.color.set(safeColor.value)
    coreItem.value.material.opacity = safeOpacity.value
  }
  if (haloItem.value) {
    haloItem.value.material.color.set(safeGlowColor.value)
    haloItem.value.material.opacity = safeHaloOpacity.value
  }
  // 下一帧需要按新的 linewidth 目标重算一次 (因为 width 可能变了)
  syncedCoreLineWidth = -1
  syncedHaloLineWidth = -1
}

// 动态: 每帧仅在真正变化时写入 GPU
const applyFrameMaterials = () => {
  if (!coreItem.value && !haloItem.value) {
    return
  }

  const worldScale = getLineWidthWorldScale()
  const coreLineWidth = safeWidth.value * worldScale
  const haloLineWidth = safeHaloWidth.value * worldScale

  const resolutionChanged = tempResolution.x !== syncedResolutionWidth
    || tempResolution.y !== syncedResolutionHeight

  if (coreItem.value) {
    if (Math.abs(coreLineWidth - syncedCoreLineWidth) > 1e-6) {
      coreItem.value.material.linewidth = coreLineWidth
      syncedCoreLineWidth = coreLineWidth
    }
    if (resolutionChanged) {
      coreItem.value.material.resolution.copy(tempResolution)
    }
  }

  if (haloItem.value) {
    if (Math.abs(haloLineWidth - syncedHaloLineWidth) > 1e-6) {
      haloItem.value.material.linewidth = haloLineWidth
      syncedHaloLineWidth = haloLineWidth
    }
    if (resolutionChanged) {
      haloItem.value.material.resolution.copy(tempResolution)
    }
  }

  if (resolutionChanged) {
    syncedResolutionWidth = tempResolution.x
    syncedResolutionHeight = tempResolution.y
  }
}

const rebuildLines = () => {
  disposeAllLines()
  hasLocalBoundingSphere = false

  if (!rootGroup.value || !sourceRoutes.value.length) {
    return
  }

  const segments = buildAllSegments()
  if (segments.length < 6) {
    return
  }

  // halo 先画, core 覆盖其上
  haloItem.value = createLineItem(segments, {
    blending: THREE.AdditiveBlending,
    color: safeGlowColor.value,
    linewidth: safeHaloWidth.value,
    opacity: safeHaloOpacity.value,
    renderOrder: 7,
  })
  coreItem.value = createLineItem(segments, {
    blending: THREE.NormalBlending,
    color: safeColor.value,
    linewidth: safeWidth.value,
    opacity: safeOpacity.value,
    renderOrder: 9,
  })

  // 两条线用同一份 segments, 几何一致, 缓存一份局部包围球即可
  const sphere = haloItem.value.geometry.boundingSphere
  if (sphere && Number.isFinite(sphere.radius)) {
    localBoundingSphere.copy(sphere)
    hasLocalBoundingSphere = true
  }

  // 标记需要重算相机 far
  syncedCamera = null
  syncedCameraFar = -1
  syncedCoreLineWidth = -1
  syncedHaloLineWidth = -1
  applyStaticMaterials()
}

// —— 相机远裁面同步 (大场景下必要, 不是 Mars3D 属性, 不暴露) ——
const isRangeCamera = (camera: THREE.Camera | undefined): camera is THREE.OrthographicCamera | THREE.PerspectiveCamera => {
  return camera instanceof THREE.OrthographicCamera || camera instanceof THREE.PerspectiveCamera
}

const getLineNetworkWorldSphere = () => {
  if (!rootGroup.value || !hasLocalBoundingSphere) {
    return null
  }
  rootGroup.value.updateWorldMatrix(true, false)
  tempNetworkSphere.copy(localBoundingSphere).applyMatrix4(rootGroup.value.matrixWorld)
  // 叠加当前线宽半径, halo 比 core 宽, 用 halo
  const linewidthHalf = (haloItem.value?.material.linewidth ?? coreItem.value?.material.linewidth ?? 0) * 0.5
  tempNetworkSphere.radius += linewidthHalf
  if (
    !Number.isFinite(tempNetworkSphere.center.x)
    || !Number.isFinite(tempNetworkSphere.center.y)
    || !Number.isFinite(tempNetworkSphere.center.z)
    || !Number.isFinite(tempNetworkSphere.radius)
  ) {
    return null
  }
  return tempNetworkSphere
}

const syncCameraFarClip = (camera: THREE.Camera | undefined) => {
  if (!isRangeCamera(camera)) {
    return
  }
  const worldSphere = getLineNetworkWorldSphere()
  if (!worldSphere) {
    return
  }
  camera.getWorldPosition(tempCameraPosition)
  const requiredFar = Math.max(
    camera.far,
    (tempCameraPosition.distanceTo(worldSphere.center) + worldSphere.radius + CAMERA_FAR_PADDING) * CAMERA_FAR_PADDING_RATIO,
  )
  if (
    camera === syncedCamera
    && Math.abs(requiredFar - syncedCameraFar) < 1
    && camera.far >= requiredFar
  ) {
    return
  }
  syncedCamera = camera
  syncedCameraFar = requiredFar
  if (camera.far < requiredFar) {
    camera.far = requiredFar
    camera.updateProjectionMatrix()
  }
}

// —— 数据加载 ——
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
    rebuildLines()
  }
  catch (error) {
    if (controller.signal.aborted) {
      return
    }
    console.warn('[polylineGlowComponent] Failed to load GeoJSON.', error)
    sourceRoutes.value = []
    sourceBounds.value = null
    disposeAllLines()
  }
}

const applyDataUrlAction = () => {
  const dataUrl = normalizeDataUrl(props.dataUrlDraft ?? props.dataUrl)
  if (dataUrl === safeDataUrl.value) {
    void loadGeoJson(dataUrl)
  }
  return { dataUrl, dataUrlDraft: dataUrl }
}

const applyNativeGeoPosition = () => {
  const target = getGisPlaneEditorGeoPositionTarget()
  if (!target) {
    return
  }
  const geoPosition = getGlowNativeGeoPosition()
  if (!target.geoPosition) {
    target.geoPosition = { height: 0, lat: 0, lon: 0 }
  }
  Object.assign(target.geoPosition, geoPosition)
  return geoPosition
}

watch(safeDataUrl, () => {
  void loadGeoJson()
}, { immediate: true })

watch(() => props.uuid, syncRootGroupUuid, { immediate: true })

// 颜色/透明度/宽度/发光强度 -> 仅在实际变化时触发, 重置每帧比对缓存
watch(
  [safeColor, safeGlowColor, safeGlowPower, safeOpacity, safeWidth, safeWidthScale],
  applyStaticMaterials,
  { immediate: true },
)

const { onBeforeRender } = useLoop()
let cameraCheckFrame = 0
onBeforeRender(({ camera, renderer }) => {
  renderer.getSize(tempResolution)
  applyFrameMaterials()

  // 相机 far 变化慢, 每 15 帧检查一次就够了
  cameraCheckFrame = (cameraCheckFrame + 1) % 15
  if (cameraCheckFrame === 0) {
    syncCameraFarClip(camera.value)
  }
})

onBeforeUnmount(() => {
  loadToken += 1
  abortController?.abort()
  abortController = null
  syncedCamera = null
  syncedCameraFar = -1
  disposeAllLines()
  rootGroup.value?.removeFromParent()
  rootGroup.value = null
})

defineExpose({
  applyDataUrlAction,
  applyNativeGeoPosition,
})
</script>

<template>
  <primitive
    v-if="rootGroup"
    :object="rootGroup"
  />
</template>
