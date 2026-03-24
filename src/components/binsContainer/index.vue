<script setup lang="ts">
import { computed } from 'vue'
import bannerLabel from '../common/bannerLabel.vue'
import BinsContainerBin from './BinItem.vue'
import {
  type BinsGenerationType,
  DRAWER_FLOOR_THICKNESS_MM,
  DRAWER_WALL_THICKNESS_MM,
  clampNumber,
  createRoundedRectRingShape,
  createRoundedRectShape,
  generateBinsGrid,
  generateBinsRecursive,
  mmToSceneUnits,
  normalizeBoolean,
} from './utils'

const props = withDefaults(
  defineProps<{
    binColor?: string
    cols?: number
    depth?: number
    divideDepth?: number
    divideWidth?: number
    generationType?: BinsGenerationType
    height?: number
    innerGap?: number
    iterations?: number
    outerGap?: number
    radius?: number
    rows?: number
    showInnerBins?: boolean
    showIndexNumbers?: boolean
    showMeasurements?: boolean
    showOuterBox?: boolean
    thickness?: number
    width?: number
  }>(),
  {
    binColor: '#60a5fa',
    cols: 2,
    depth: 560,
    divideDepth: 0.45,
    divideWidth: 0.55,
    generationType: 'Recursive',
    height: 130,
    innerGap: 2.5,
    iterations: 1,
    outerGap: 2.5,
    radius: 25,
    rows: 2,
    showInnerBins: true,
    showIndexNumbers: true,
    showMeasurements: true,
    showOuterBox: true,
    thickness: 5,
    width: 320,
  },
)

const safeWidthMm = computed(() => clampNumber(props.width, 60, 1200, 320))
const safeHeightMm = computed(() => clampNumber(props.height, 35, 450, 130))
const safeDepthMm = computed(() => clampNumber(props.depth, 100, 850, 560))
const safeRadiusMm = computed(() => clampNumber(props.radius, 0, 150, 25))
const safeThicknessMm = computed(() => clampNumber(props.thickness, 2, 20, 5))
const safeDivideWidth = computed(() => clampNumber(props.divideWidth, 0.1, 0.9, 0.55))
const safeDivideDepth = computed(() => clampNumber(props.divideDepth, 0.1, 0.9, 0.45))
const safeOuterGapMm = computed(() => clampNumber(props.outerGap, 0, 20, 2.5))
const safeInnerGapMm = computed(() => clampNumber(props.innerGap, 0, 20, 2.5))
const safeIterations = computed(() => Math.round(clampNumber(props.iterations, 0, 3, 1)))
const safeRows = computed(() => Math.round(clampNumber(props.rows, 1, 10, 2)))
const safeCols = computed(() => Math.round(clampNumber(props.cols, 1, 10, 2)))
const safeGenerationType = computed<BinsGenerationType>(() => props.generationType === 'Grid' ? 'Grid' : 'Recursive')
const isOuterBoxVisible = computed(() => normalizeBoolean(props.showOuterBox, true))
const isInnerBinsVisible = computed(() => normalizeBoolean(props.showInnerBins, true))
const isMeasurementsVisible = computed(() => normalizeBoolean(props.showMeasurements, true))
const isIndexNumbersVisible = computed(() => normalizeBoolean(props.showIndexNumbers, true))

const sceneWidth = computed(() => mmToSceneUnits(safeWidthMm.value))
const sceneHeight = computed(() => mmToSceneUnits(safeHeightMm.value))
const sceneDepth = computed(() => mmToSceneUnits(safeDepthMm.value))
const layoutWidthUnits = computed(() => mmToSceneUnits(layoutWidthMm.value))
const layoutDepthUnits = computed(() => mmToSceneUnits(layoutDepthMm.value))
const drawerWallThickness = computed(() => mmToSceneUnits(DRAWER_WALL_THICKNESS_MM))
const drawerFloorThickness = computed(() => mmToSceneUnits(DRAWER_FLOOR_THICKNESS_MM))

const drawerOuterWidth = computed(() => sceneWidth.value + drawerWallThickness.value * 2)
const drawerOuterDepth = computed(() => sceneDepth.value + drawerWallThickness.value * 2)
const drawerWallHeight = computed(() => sceneHeight.value)

const drawerBottomShape = computed(() => createRoundedRectShape(drawerOuterWidth.value, drawerOuterDepth.value, 0))
const drawerWallShape = computed(() => createRoundedRectRingShape(drawerOuterWidth.value, drawerOuterDepth.value, 0, drawerWallThickness.value))

const layoutWidthMm = computed(() => Math.max(10, safeWidthMm.value - safeOuterGapMm.value * 2))
const layoutDepthMm = computed(() => Math.max(10, safeDepthMm.value - safeOuterGapMm.value * 2))
const bins = computed(() => {
  const baseProps = {
    width: layoutWidthMm.value,
    depth: layoutDepthMm.value,
    height: safeHeightMm.value,
    divideWidth: safeDivideWidth.value,
    divideDepth: safeDivideDepth.value,
    iterations: safeIterations.value,
    rows: safeRows.value,
    cols: safeCols.value,
    innerGap: safeInnerGapMm.value,
  }

  return safeGenerationType.value === 'Grid'
    ? generateBinsGrid(baseProps)
    : generateBinsRecursive(baseProps)
})

const binsGroupPosition = computed<[number, number, number]>(() => ([
  -layoutWidthUnits.value / 2,
  drawerFloorThickness.value,
  -layoutDepthUnits.value / 2,
]))
const binsLayoutKey = computed(() => [
  safeGenerationType.value,
  safeIterations.value,
  safeRows.value,
  safeCols.value,
  safeWidthMm.value,
  safeHeightMm.value,
  safeDepthMm.value,
  safeRadiusMm.value,
  safeThicknessMm.value,
  safeDivideWidth.value,
  safeDivideDepth.value,
  safeOuterGapMm.value,
  safeInnerGapMm.value,
].join(':'))

const measurementFontSize = 36
const measurementScaleFactor = 0.0022
const widthMeasurementPosition = computed<[number, number, number]>(() => ([
  0,
  drawerFloorThickness.value + 0.05,
  drawerOuterDepth.value / 2 + 0.42,
]))
const depthMeasurementPosition = computed<[number, number, number]>(() => ([
  -drawerOuterWidth.value / 2 - 0.46,
  drawerFloorThickness.value + 0.05,
  0,
]))
const heightMeasurementPosition = computed<[number, number, number]>(() => ([
  drawerOuterWidth.value / 2 + 0.38,
  drawerFloorThickness.value + sceneHeight.value / 2,
  drawerOuterDepth.value / 2 + 0.2,
]))
</script>

<template>
  <TresGroup>
    <TresGroup v-if="isOuterBoxVisible" :key="`outer-box-${safeWidthMm}-${safeHeightMm}-${safeDepthMm}`">
      <TresMesh
        cast-shadow
        receive-shadow
        :position-y="drawerFloorThickness / 2"
        :rotation="[-Math.PI / 2, 0, 0]"
      >
        <TresExtrudeGeometry
          :args="[
            drawerBottomShape,
            {
              curveSegments: 8,
              depth: drawerFloorThickness,
              bevelEnabled: false,
              steps: 1,
            },
          ]"
        />
        <TresMeshStandardMaterial
          color="#cbd5e1"
          :metalness="0.04"
          :roughness="0.82"
        />
      </TresMesh>

      <TresMesh
        cast-shadow
        receive-shadow
        :position-y="drawerFloorThickness"
        :rotation="[-Math.PI / 2, 0, 0]"
      >
        <TresExtrudeGeometry
          :args="[
            drawerWallShape,
            {
              curveSegments: 8,
              depth: drawerWallHeight,
              bevelEnabled: false,
              steps: 1,
            },
          ]"
        />
        <TresMeshStandardMaterial
          color="#e2e8f0"
          :metalness="0.03"
          :roughness="0.78"
        />
      </TresMesh>
    </TresGroup>

    <TresGroup v-if="isInnerBinsVisible" :key="binsLayoutKey" :position="binsGroupPosition">
      <TresGroup
        v-for="bin in bins"
        :key="`${binsLayoutKey}-${bin.index}-${bin.width}-${bin.depth}-${bin.x}-${bin.z}`"
        :position="[
          mmToSceneUnits(bin.x + bin.width / 2),
          0,
          mmToSceneUnits(bin.z + bin.depth / 2),
        ]"
      >
        <BinsContainerBin
          :color="binColor"
          :depth-mm="bin.depth"
          :height-mm="bin.height"
          :index="bin.index"
          :radius-mm="safeRadiusMm"
          :show-index-number="isIndexNumbersVisible"
          :thickness-mm="safeThicknessMm"
          :width-mm="bin.width"
        />
      </TresGroup>
    </TresGroup>

    <TresGroup v-if="isMeasurementsVisible" :key="`measurements-${String(isMeasurementsVisible)}`">
      <bannerLabel
        align="center"
        backgroundColor="rgba(15, 23, 42, 0.72)"
        borderColor="#94a3b8"
        :borderRadius="12"
        :borderWidth="2"
        :fontColor="'#f8fafc'"
        :fontSize="measurementFontSize"
        :padding="{ x: 14, y: 8 }"
        :position="widthMeasurementPosition"
        :scaleFactor="measurementScaleFactor"
        :text="`${safeWidthMm}mm`"
      />
      <bannerLabel
        align="center"
        backgroundColor="rgba(15, 23, 42, 0.72)"
        borderColor="#94a3b8"
        :borderRadius="12"
        :borderWidth="2"
        :fontColor="'#f8fafc'"
        :fontSize="measurementFontSize"
        :padding="{ x: 14, y: 8 }"
        :position="depthMeasurementPosition"
        :scaleFactor="measurementScaleFactor"
        :text="`${safeDepthMm}mm`"
      />
      <bannerLabel
        align="center"
        backgroundColor="rgba(15, 23, 42, 0.72)"
        borderColor="#94a3b8"
        :borderRadius="12"
        :borderWidth="2"
        :fontColor="'#f8fafc'"
        :fontSize="measurementFontSize"
        :padding="{ x: 14, y: 8 }"
        :position="heightMeasurementPosition"
        :scaleFactor="measurementScaleFactor"
        :text="`${safeHeightMm}mm`"
      />
    </TresGroup>
  </TresGroup>
</template>
