<script setup lang="ts">
import * as THREE from 'three'
import {
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from 'vue'
import { GNM_HEAD_DEFAULTS as DEFAULTS } from './defaults'
import { GNMHeadModel } from './gnmModel.js'
import {
  createGNMHeadRuntime,
  type GNMHeadRuntime,
} from './runtime'
import {
  createGNMHeadLoadingPlaceholder,
  type GNMHeadLoadingPlaceholder,
} from './loadingPlaceholder'
import { GNMSamplers } from './semanticSampler.js'
import type {
  GNMHeadComponentProps,
  GNMHeadMaterialOptions,
  GNMHeadPose,
  GNMHeadVisibility,
  GNMLoadProgress,
  GNMLoadStage,
} from './types'

const props = withDefaults(
  defineProps<GNMHeadComponentProps>(),
  DEFAULTS,
)

const emit = defineEmits<{
  (event: 'loadProgress', payload: GNMLoadProgress): void
  (event: 'loadError', payload: {
    stage: GNMLoadStage
    error: unknown
  }): void
  (event: 'ready', stage: GNMLoadStage): void
}>()

const runtime = shallowRef<GNMHeadRuntime | null>(null)
const samplers = shallowRef<GNMSamplers | null>(null)
const loadingPlaceholder = shallowRef<GNMHeadLoadingPlaceholder | null>(
  createGNMHeadLoadingPlaceholder(),
)

let activeController: AbortController | null = null
let startupFrame: number | null = null
let generation = 0
let mounted = false

function clampNumber(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  return Number.isFinite(value)
    ? THREE.MathUtils.clamp(value as number, min, max)
    : fallback
}

function clampSeed(value: number | undefined, fallback: number): number {
  const normalized = Number.isFinite(value) ? Math.trunc(value as number) : fallback
  return normalized >>> 0
}

function currentMaterial(): GNMHeadMaterialOptions {
  return {
    skinColor: props.skinColor,
    irisColor: props.irisColor,
    roughness: clampNumber(props.roughness, 0, 1, DEFAULTS.roughness),
    metalness: clampNumber(props.metalness, 0, 1, DEFAULTS.metalness),
    skinOpacity: clampNumber(
      props.skinOpacity,
      0,
      1,
      DEFAULTS.skinOpacity,
    ),
  }
}

function currentPose(): GNMHeadPose {
  return {
    headPitch: clampNumber(props.headPitch, -45, 45, DEFAULTS.headPitch),
    headYaw: clampNumber(props.headYaw, -70, 70, DEFAULTS.headYaw),
    headRoll: clampNumber(props.headRoll, -45, 45, DEFAULTS.headRoll),
    eyePitch: clampNumber(props.eyePitch, -35, 35, DEFAULTS.eyePitch),
    eyeYaw: clampNumber(props.eyeYaw, -45, 45, DEFAULTS.eyeYaw),
  }
}

function currentVisibility(): GNMHeadVisibility {
  return {
    eyes: props.showEyes,
    teethGums: props.showTeethGums,
    tongue: props.showTongue,
  }
}

function scaleVector(vector: Float32Array, strength: number): Float32Array {
  for (let index = 0; index < vector.length; ++index) {
    vector[index] *= strength
  }
  return vector
}

function applyCurrentDeformation(): void {
  const currentRuntime = runtime.value
  if (!currentRuntime) { return }

  const currentSamplers = samplers.value
  const identityStrength = clampNumber(
    props.identityStrength,
    0,
    3,
    DEFAULTS.identityStrength,
  )
  const expressionStrength = clampNumber(
    props.expressionStrength,
    0,
    3,
    DEFAULTS.expressionStrength,
  )

  if (!currentSamplers || identityStrength === 0) {
    currentRuntime.model.resetIdentity()
  }
  else {
    currentSamplers.seed(clampSeed(props.identitySeed, DEFAULTS.identitySeed))
    currentRuntime.model.setIdentityVector(
      scaleVector(currentSamplers.randomIdentity(1), identityStrength),
    )
  }

  if (!currentSamplers || expressionStrength === 0) {
    currentRuntime.model.resetExpression()
  }
  else {
    const requestedClass = currentSamplers.expressionClasses.indexOf(
      props.expressionClass,
    )
    const fallbackClass = Math.max(
      0,
      currentSamplers.expressionClasses.indexOf(DEFAULTS.expressionClass),
    )
    currentSamplers.seed(
      clampSeed(props.expressionSeed, DEFAULTS.expressionSeed),
    )
    currentRuntime.model.setExpressionVector(
      scaleVector(
        currentSamplers.sampleExpression(
          requestedClass >= 0 ? requestedClass : fallbackClass,
          1,
        ),
        expressionStrength,
      ),
    )
  }

  currentRuntime.setPose(currentPose())
  currentRuntime.refresh()
}

function disposeRuntime(): void {
  runtime.value?.dispose()
  runtime.value = null
  samplers.value = null
}

function disposeLoadingPlaceholder(): void {
  loadingPlaceholder.value?.dispose()
  loadingPlaceholder.value = null
}

function resetLoadingPlaceholder(): void {
  disposeLoadingPlaceholder()
  loadingPlaceholder.value = createGNMHeadLoadingPlaceholder()
}

function cancelLoading(): void {
  if (startupFrame !== null && typeof window !== 'undefined') {
    window.cancelAnimationFrame(startupFrame)
    startupFrame = null
  }
  activeController?.abort()
  activeController = null
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

async function loadGeneration(
  token: number,
  controller: AbortController,
): Promise<void> {
  const headUrl = props.headUrl.trim()
  const samplerUrl = props.samplerUrl.trim()

  try {
    if (!headUrl) {
      throw new Error('GNM head URL is empty.')
    }

    const model = await GNMHeadModel.load(
      headUrl,
      (progress) => {
        if (generation !== token || controller.signal.aborted) { return }
        loadingPlaceholder.value?.setProgress(progress)
        emit('loadProgress', { stage: 'head', progress })
      },
      controller.signal,
    )
    if (!mounted || generation !== token || controller.signal.aborted) { return }

    const nextRuntime = createGNMHeadRuntime(model, currentMaterial())
    if (!mounted || generation !== token || controller.signal.aborted) {
      nextRuntime.dispose()
      return
    }

    runtime.value = nextRuntime
    nextRuntime.setVisibility(currentVisibility())
    applyCurrentDeformation()
    disposeLoadingPlaceholder()
    emit('ready', 'head')

    try {
      if (!samplerUrl) {
        throw new Error('GNM sampler URL is empty.')
      }

      const nextSamplers = await GNMSamplers.load(
        samplerUrl,
        (progress) => {
          if (generation !== token || controller.signal.aborted) { return }
          emit('loadProgress', {
            stage: 'sampler',
            progress,
          })
        },
        controller.signal,
      )
      if (!mounted || generation !== token || controller.signal.aborted) { return }

      samplers.value = nextSamplers
      applyCurrentDeformation()
      emit('ready', 'sampler')
    }
    catch (error) {
      if (!isAbortError(error) && generation === token) {
        console.warn('[gnmHeadComponent] Unable to load semantic sampler.', error)
        emit('loadError', { stage: 'sampler', error })
      }
    }
  }
  catch (error) {
    if (!isAbortError(error) && generation === token) {
      console.warn('[gnmHeadComponent] Unable to load GNM head.', error)
      loadingPlaceholder.value?.setError()
      emit('loadError', { stage: 'head', error })
    }
  }
  finally {
    if (activeController === controller) {
      activeController = null
    }
  }
}

function scheduleReload(): void {
  if (!mounted) { return }

  cancelLoading()
  disposeRuntime()
  resetLoadingPlaceholder()
  const token = ++generation
  const controller = new AbortController()
  activeController = controller

  if (typeof window === 'undefined') {
    void loadGeneration(token, controller)
    return
  }

  startupFrame = window.requestAnimationFrame(() => {
    startupFrame = null
    void loadGeneration(token, controller)
  })
}

watch(
  [
    () => props.headUrl,
    () => props.samplerUrl,
  ],
  scheduleReload,
)

watch(
  [
    () => props.identitySeed,
    () => props.identityStrength,
    () => props.expressionSeed,
    () => props.expressionClass,
    () => props.expressionStrength,
    () => props.headPitch,
    () => props.headYaw,
    () => props.headRoll,
    () => props.eyePitch,
    () => props.eyeYaw,
  ],
  applyCurrentDeformation,
)

watch(
  [
    () => props.skinColor,
    () => props.irisColor,
    () => props.roughness,
    () => props.metalness,
    () => props.skinOpacity,
  ],
  () => runtime.value?.setMaterial(currentMaterial()),
)

watch(
  [
    () => props.showEyes,
    () => props.showTeethGums,
    () => props.showTongue,
  ],
  () => runtime.value?.setVisibility(currentVisibility()),
)

onMounted(() => {
  mounted = true
  scheduleReload()
})

onBeforeUnmount(() => {
  mounted = false
  ++generation
  cancelLoading()
  disposeRuntime()
  disposeLoadingPlaceholder()
})
</script>

<template>
  <TresGroup>
    <primitive
      v-if="loadingPlaceholder"
      :object="loadingPlaceholder.group"
    />
    <primitive
      v-if="runtime"
      :object="runtime.group"
    />
  </TresGroup>
</template>
