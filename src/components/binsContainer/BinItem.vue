<script setup lang="ts">
import { computed } from 'vue'
import * as THREE from 'three'
import bannerLabel from '../common/bannerLabel.vue'
import {
  BIN_BOTTOM_THICKNESS_MM,
  clampNumber,
  createRoundedRectRingShape,
  createRoundedRectShape,
  mmToSceneUnits,
  normalizeBoolean,
} from './utils'

const props = withDefaults(
  defineProps<{
    color?: string
    depthMm: number
    heightMm: number
    index: number
    radiusMm: number
    showIndexNumber?: boolean
    thicknessMm: number
    widthMm: number
  }>(),
  {
    color: '#60a5fa',
    showIndexNumber: true,
  },
)

const safeWidthMm = computed(() => clampNumber(props.widthMm, 10, 4000, 100))
const safeDepthMm = computed(() => clampNumber(props.depthMm, 10, 4000, 100))
const safeHeightMm = computed(() => clampNumber(props.heightMm, 10, 4000, 100))
const safeRadiusMm = computed(() => clampNumber(props.radiusMm, 0, 400, 12))
const maxWallThicknessMm = computed(() => Math.max(1, Math.min(safeWidthMm.value, safeDepthMm.value) / 2 - 1))
const safeThicknessMm = computed(() => clampNumber(props.thicknessMm, 1, maxWallThicknessMm.value, 5))
const bottomThicknessMm = computed(() => THREE.MathUtils.clamp(BIN_BOTTOM_THICKNESS_MM, 1, Math.max(1, safeHeightMm.value - 1)))
const wallHeightMm = computed(() => Math.max(0.5, safeHeightMm.value - bottomThicknessMm.value))

const widthUnits = computed(() => mmToSceneUnits(safeWidthMm.value))
const depthUnits = computed(() => mmToSceneUnits(safeDepthMm.value))
const radiusUnits = computed(() => mmToSceneUnits(safeRadiusMm.value))
const thicknessUnits = computed(() => mmToSceneUnits(safeThicknessMm.value))
const bottomThicknessUnits = computed(() => mmToSceneUnits(bottomThicknessMm.value))
const wallHeightUnits = computed(() => mmToSceneUnits(wallHeightMm.value))
const outerShape = computed(() => createRoundedRectShape(widthUnits.value, depthUnits.value, radiusUnits.value))
const wallShape = computed(() => createRoundedRectRingShape(widthUnits.value, depthUnits.value, radiusUnits.value, thicknessUnits.value))
const indexFontSize = computed(() => THREE.MathUtils.clamp(Math.min(safeWidthMm.value, safeDepthMm.value) * 0.16, 18, 40))
const indexScaleFactor = computed(() => THREE.MathUtils.clamp(Math.min(widthUnits.value, depthUnits.value) * 0.0022, 0.0016, 0.0032))
const isIndexVisible = computed(() => normalizeBoolean(props.showIndexNumber, true))
const baseColor = computed(() => new THREE.Color(props.color))
const floorColor = computed(() => `#${baseColor.value.clone().offsetHSL(0, -0.08, 0.08).getHexString()}`)
const wallColor = computed(() => `#${baseColor.value.getHexString()}`)
</script>

<template>
  <TresGroup>
    <TresMesh
      cast-shadow
      receive-shadow
      :position-y="bottomThicknessUnits / 2"
      :rotation="[-Math.PI / 2, 0, 0]"
    >
      <TresExtrudeGeometry
        :args="[
          outerShape,
          {
            curveSegments: 16,
            depth: bottomThicknessUnits,
            bevelEnabled: false,
            steps: 1,
          },
        ]"
      />
      <TresMeshStandardMaterial
        :color="floorColor"
        :metalness="0.08"
        :roughness="0.56"
      />
    </TresMesh>

    <TresMesh
      cast-shadow
      receive-shadow
      :position-y="bottomThicknessUnits"
      :rotation="[-Math.PI / 2, 0, 0]"
    >
      <TresExtrudeGeometry
        :args="[
          wallShape,
          {
            curveSegments: 16,
            depth: wallHeightUnits,
            bevelEnabled: false,
            steps: 1,
          },
        ]"
      />
      <TresMeshStandardMaterial
        :color="wallColor"
        :metalness="0.06"
        :roughness="0.62"
      />
    </TresMesh>

    <bannerLabel
      v-if="isIndexVisible"
      align="center"
      backgroundColor="rgba(15, 23, 42, 0.72)"
      borderColor="#cbd5e1"
      :borderRadius="10"
      :borderWidth="2"
      :fontColor="'#f8fafc'"
      :fontSize="indexFontSize"
      :padding="{ x: 10, y: 6 }"
      :position="[0, bottomThicknessUnits + 0.04, 0]"
      :scaleFactor="indexScaleFactor"
      :text="String(index + 1)"
    />
  </TresGroup>
</template>
