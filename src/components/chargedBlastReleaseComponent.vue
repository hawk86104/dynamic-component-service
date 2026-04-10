<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue'
import ChargedBlastProjectileComponent from './chargedBlastProjectileComponent.vue'
import ChargedBlastRingsComponent from './chargedBlastRingsComponent.vue'

interface Props {
  accentColor?: string
  autoPlay?: boolean
  blastColor?: string
  blastLength?: number
  blastRadius?: number
  coreColor?: string
  energy?: number
  fireDirectionX?: number
  fireDirectionY?: number
  fireDirectionZ?: number
  fireSpeed?: number
  loopInterval?: number
  maxDistance?: number
  pulseScale?: number
  ringInterval?: number
  shotToken?: number
}

const props = withDefaults(
  defineProps<Props>(),
  {
    accentColor: '#e0ffff',
    autoPlay: true,
    blastColor: '#0051dc',
    blastLength: 1.2,
    blastRadius: 0.5,
    coreColor: '#a9ffff',
    energy: 1,
    fireDirectionX: 0,
    fireDirectionY: 0,
    fireDirectionZ: -1,
    fireSpeed: 11,
    loopInterval: 1.6,
    maxDistance: 60,
    pulseScale: 1.2,
    ringInterval: 0.27,
    shotToken: 0,
  },
)

const clampNumber = (value: number | undefined, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.min(max, Math.max(min, value as number))
}

const safeBlastLength = computed(() => clampNumber(props.blastLength, 0.05, 3, 1.2))
const safeBlastRadius = computed(() => clampNumber(props.blastRadius, 0.01, 1, 0.5))
const safeEnergy = computed(() => clampNumber(props.energy, 0.3, 2.5, 1))
const safeLoopInterval = computed(() => clampNumber(props.loopInterval, 0.2, 10, 1.6))
const safePulseScale = computed(() => clampNumber(props.pulseScale, 1, 2, 1.2))
const safeRingInterval = computed(() => clampNumber(props.ringInterval, 0.01, 2, 0.27))

const derivedProjGradientSpeed = computed(() => clampNumber(1.3 + safeEnergy.value * 0.6, 0, 10, 1.9))
const derivedProjFresnelEmit = computed(() => clampNumber(1.3 * safeEnergy.value, 0, 5, 1.3))
const derivedRingEmission = computed(() => clampNumber(4 * safeEnergy.value, 0, 20, 4))
const derivedRingMaxRadius = computed(() => clampNumber(safeBlastRadius.value * 1.2, 0.01, 2, 0.6))
const derivedRingSpeed = computed(() => clampNumber(safeBlastLength.value * 2.9166667, 0.1, 15, 3.5))
const derivedRingTubeRatio = computed(() => clampNumber(safeBlastRadius.value * 0.3, 0.01, 0.3, 0.15))
const derivedTrailLength = computed(() => clampNumber(safeBlastLength.value * 2.6666667, 0.1, 10, 3.2))
const derivedTrailOpacity = computed(() => clampNumber(0.3 + safeEnergy.value * 0.24, 0, 1, 0.54))
const derivedTrailWidth = computed(() => clampNumber(safeBlastRadius.value * 2.34, 0.01, 2, 1.17))

const sharedShotToken = ref(0)
const replayTimer = ref(0)

let previousShotToken = props.shotToken

const triggerShot = () => {
  replayTimer.value = 0
  sharedShotToken.value += 1
}

const triggerShotAction = () => {
  triggerShot()
}

onMounted(() => {
  if (props.autoPlay) {
    triggerShot()
  }
})

watch(
  () => props.autoPlay,
  (autoPlay) => {
    replayTimer.value = 0
    if (autoPlay) {
      triggerShot()
    }
  },
)

watch(
  () => props.shotToken,
  (nextToken) => {
    if (props.autoPlay || nextToken === previousShotToken) {
      previousShotToken = nextToken
      return
    }

    previousShotToken = nextToken
    triggerShot()
  },
)

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta }) => {
  if (!props.autoPlay) {
    return
  }

  replayTimer.value += delta
  if (replayTimer.value >= safeLoopInterval.value) {
    triggerShot()
  }
})

defineExpose({
  triggerShotAction,
})
</script>

<template>
  <TresGroup>
    <ChargedBlastRingsComponent
      :auto-play="false"
      :burst-token="sharedShotToken"
      :carrier-radius="safeBlastRadius"
      :carrier-tail-length="safeBlastLength"
      :fire-direction-x="fireDirectionX"
      :fire-direction-y="fireDirectionY"
      :fire-direction-z="fireDirectionZ"
      :fire-speed="fireSpeed"
      :loop-interval="safeLoopInterval"
      :max-distance="maxDistance"
      :ring-color-a="coreColor"
      :ring-color-b="accentColor"
      :ring-emission="derivedRingEmission"
      :ring-interval="safeRingInterval"
      :ring-lifetime="0.75"
      :ring-max-count="2"
      :ring-max-radius="derivedRingMaxRadius"
      :ring-peak-at="2.5"
      :ring-speed="derivedRingSpeed"
      :ring-tube-ratio="derivedRingTubeRatio"
    />
    <ChargedBlastProjectileComponent
      :auto-play="false"
      :shot-token="sharedShotToken"
      :fire-direction-x="fireDirectionX"
      :fire-direction-y="fireDirectionY"
      :fire-direction-z="fireDirectionZ"
      :fire-speed="fireSpeed"
      :loop-interval="safeLoopInterval"
      :max-distance="maxDistance"
      :proj-band-width="0.25"
      :proj-color-a="blastColor"
      :proj-color-b="accentColor"
      :proj-color-c="coreColor"
      :proj-fresnel-color="coreColor"
      :proj-fresnel-emit="derivedProjFresnelEmit"
      :proj-fresnel-power="2"
      :proj-gradient-speed="derivedProjGradientSpeed"
      :proj-pulse-scale="safePulseScale"
      :proj-pulse-speed="16"
      :proj-radius="safeBlastRadius"
      :proj-tail-length="safeBlastLength"
      :trail-color="coreColor"
      :trail-edge-softness="4.7"
      :trail-length="derivedTrailLength"
      :trail-opacity="derivedTrailOpacity"
      :trail-segments="20"
      :trail-width="derivedTrailWidth"
    />
  </TresGroup>
</template>
