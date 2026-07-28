<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'
import {
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from 'vue'
import { GRASS_COMPONENT_DEFAULTS as DEFAULTS } from './defaults'
import { createMeadow, type MeadowRuntime } from './meadow'
import type {
  GrassAppearanceOptions,
  MeadowOptions,
} from './types'

const props = withDefaults(
  defineProps<{
    terrainWidth?: number
    terrainDepth?: number
    terrainSegments?: number
    seed?: number
    terrainDegree?: number
    groundColor?: string
    density?: number
    bladeHeight?: number
    bladeWidth?: number
    windStrength?: number
    windSpeed?: number
    windFrequency?: number
    windTurbulence?: number
    windDirection?: number
    brightness?: number
    grassBottomColor?: string
    grassTopColor?: string
    grassBacklightColor?: string
    wildflowersEnabled?: boolean
    wildflowerDensity?: number
    wildflowerMaxCount?: number
  }>(),
  DEFAULTS,
)

function clampNumber(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return THREE.MathUtils.clamp(value as number, min, max)
}

function clampInteger(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  return Math.round(clampNumber(value, min, max, fallback))
}

function safeColor(value: string | undefined, fallback: string): string {
  const color = new THREE.Color(fallback)

  try {
    color.set(value ?? fallback)
  }
  catch {
    color.set(fallback)
  }

  return `#${color.getHexString()}`
}

function normalizedOptions(): MeadowOptions {
  const seed = clampInteger(props.seed, -1_000_000, 1_000_000, DEFAULTS.seed)
  const bladeHeight = clampNumber(
    props.bladeHeight,
    0.1,
    3,
    DEFAULTS.bladeHeight,
  )
  const bladeWidth = clampNumber(
    props.bladeWidth,
    0.01,
    0.16,
    DEFAULTS.bladeWidth,
  )
  const wind = {
    strength: clampNumber(props.windStrength, 0, 0.8, DEFAULTS.windStrength),
    speed: clampNumber(props.windSpeed, 0, 5, DEFAULTS.windSpeed),
    frequency: clampNumber(props.windFrequency, 0, 3, DEFAULTS.windFrequency),
    turbulence: clampNumber(props.windTurbulence, 0, 1, DEFAULTS.windTurbulence),
    lean: 0.035,
    direction: clampNumber(props.windDirection, 0, 360, DEFAULTS.windDirection),
  }

  return {
    terrain: {
      width: clampNumber(props.terrainWidth, 0.5, 100, DEFAULTS.terrainWidth),
      depth: clampNumber(props.terrainDepth, 0.5, 100, DEFAULTS.terrainDepth),
      segments: clampInteger(
        props.terrainSegments,
        2,
        200,
        DEFAULTS.terrainSegments,
      ),
      seed,
      terrainDegree: clampNumber(
        props.terrainDegree,
        0,
        1,
        DEFAULTS.terrainDegree,
      ),
      groundColor: safeColor(props.groundColor, DEFAULTS.groundColor),
    },
    grass: {
      density: clampNumber(props.density, 0.4, 60, DEFAULTS.density),
      seed,
      blade: {
        minWidth: bladeWidth * 0.35,
        maxWidth: bladeWidth,
        minHeight: bladeHeight * 0.47,
        maxHeight: bladeHeight,
        segments: 4,
        lean: 0.1,
      },
      wind,
      colors: {
        bottom: safeColor(props.grassBottomColor, DEFAULTS.grassBottomColor),
        top: safeColor(props.grassTopColor, DEFAULTS.grassTopColor),
        backlight: safeColor(
          props.grassBacklightColor,
          DEFAULTS.grassBacklightColor,
        ),
      },
      brightness: clampNumber(props.brightness, 0.1, 2, DEFAULTS.brightness),
    },
    wildflowers: {
      enabled: props.wildflowersEnabled,
      density: clampNumber(
        props.wildflowerDensity,
        0,
        5,
        DEFAULTS.wildflowerDensity,
      ),
      maxCount: clampInteger(
        props.wildflowerMaxCount,
        0,
        2_000,
        DEFAULTS.wildflowerMaxCount,
      ),
      seed: (seed ^ 0x9E3779B9) >>> 0,
      wind,
    },
  }
}

function currentAppearance(): GrassAppearanceOptions {
  const options = normalizedOptions().grass

  return {
    wind: options.wind,
    colors: options.colors,
    brightness: options.brightness,
  }
}

const meadow = shallowRef<MeadowRuntime | null>(null)
let rebuildFrame: number | null = null
let disposed = false

function rebuildMeadow(): void {
  if (disposed) {
    return
  }

  try {
    const next = createMeadow(normalizedOptions())
    const previous = meadow.value
    meadow.value = next
    previous?.dispose()
  }
  catch (error) {
    console.warn('Unable to rebuild advanced dynamic grass.', error)
  }
}

function scheduleRebuild(): void {
  if (disposed || rebuildFrame !== null) {
    return
  }

  if (typeof window === 'undefined') {
    rebuildMeadow()
    return
  }

  rebuildFrame = window.requestAnimationFrame(() => {
    rebuildFrame = null
    rebuildMeadow()
  })
}

watch(
  [
    () => props.terrainWidth,
    () => props.terrainDepth,
    () => props.terrainSegments,
    () => props.seed,
    () => props.terrainDegree,
    () => props.density,
    () => props.bladeHeight,
    () => props.bladeWidth,
    () => props.wildflowersEnabled,
    () => props.wildflowerDensity,
    () => props.wildflowerMaxCount,
  ],
  scheduleRebuild,
)

watch(
  [
    () => props.windStrength,
    () => props.windSpeed,
    () => props.windFrequency,
    () => props.windTurbulence,
    () => props.windDirection,
    () => props.brightness,
    () => props.grassBottomColor,
    () => props.grassTopColor,
    () => props.grassBacklightColor,
  ],
  () => meadow.value?.setAppearance(currentAppearance()),
)

watch(
  () => props.groundColor,
  () => meadow.value?.setGroundColor(
    safeColor(props.groundColor, DEFAULTS.groundColor),
  ),
)

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  meadow.value?.update(elapsed)
})

onMounted(rebuildMeadow)

onBeforeUnmount(() => {
  disposed = true

  if (rebuildFrame !== null && typeof window !== 'undefined') {
    window.cancelAnimationFrame(rebuildFrame)
    rebuildFrame = null
  }

  meadow.value?.dispose()
  meadow.value = null
})
</script>

<template>
  <TresGroup>
    <primitive
      v-if="meadow"
      :object="meadow.group"
    />
  </TresGroup>
</template>
