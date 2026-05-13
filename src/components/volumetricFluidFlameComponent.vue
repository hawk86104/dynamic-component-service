<script setup lang="ts">
import { useLoop, useTres } from '@tresjs/core'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import {
  computed,
  onBeforeUnmount,
  shallowRef,
  watch,
} from 'vue'
import advectFragmentShader from '../shader/volumetricFluidFlameComponent/advect.frag?raw'
import atlasCommonShader from '../shader/volumetricFluidFlameComponent/atlasCommon.frag?raw'
import divergenceFragmentShader from '../shader/volumetricFluidFlameComponent/divergence.frag?raw'
import fullscreenVertexShader from '../shader/volumetricFluidFlameComponent/fullscreen.vert?raw'
import gradientSubtractFragmentShader from '../shader/volumetricFluidFlameComponent/gradientSubtract.frag?raw'
import groundFragmentShader from '../shader/volumetricFluidFlameComponent/ground.frag?raw'
import groundVertexShader from '../shader/volumetricFluidFlameComponent/ground.vert?raw'
import jacobiFragmentShader from '../shader/volumetricFluidFlameComponent/jacobi.frag?raw'
import volumeFragmentShader from '../shader/volumetricFluidFlameComponent/volume.frag?raw'
import volumeVertexShader from '../shader/volumetricFluidFlameComponent/volume.vert?raw'

type UniformMap = NonNullable<THREE.ShaderMaterialParameters['uniforms']>
type VolumeCustomMaterial = CustomShaderMaterial<typeof THREE.MeshBasicMaterial>
type GroundCustomMaterial = CustomShaderMaterial<typeof THREE.MeshBasicMaterial>

interface AtlasLayout {
  atlasSize: number
  grid: number
  slicesPerRow: number
}

interface FluidResources {
  advectMaterial: THREE.ShaderMaterial
  divergenceMaterial: THREE.ShaderMaterial
  divergenceTarget: THREE.WebGLRenderTarget
  fluidA: THREE.WebGLRenderTarget
  fluidB: THREE.WebGLRenderTarget
  gradientSubtractMaterial: THREE.ShaderMaterial
  groundGeometry: THREE.PlaneGeometry
  groundMaterial: GroundCustomMaterial
  groundMesh: THREE.Mesh
  jacobiMaterial: THREE.ShaderMaterial
  layout: AtlasLayout
  passCamera: THREE.OrthographicCamera
  passGeometry: THREE.PlaneGeometry
  passMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  passScene: THREE.Scene
  pressureA: THREE.WebGLRenderTarget
  pressureB: THREE.WebGLRenderTarget
  volumeGeometry: THREE.BoxGeometry
  volumeMaterial: VolumeCustomMaterial
  volumeMesh: THREE.Mesh
}

const props = withDefaults(
  defineProps<{
    absorption?: number
    brightness?: number
    buoyancy?: number
    colorMode?: number
    curlStrength?: number
    dissipation?: number
    emitStrength?: number
    flameHeight?: number
    flameScaleX?: number
    flameScaleY?: number
    flameScaleZ?: number
    flameWidth?: number
    groundOpacity?: number
    groundSize?: number
    groundVisible?: boolean
    pressureIterations?: number
    rayMarchSteps?: number
    simulationFps?: number
    simulationResolution?: number
    turbulence?: number
    volumeScale?: number
  }>(),
  {
    absorption: 7.5,
    brightness: 1.45,
    buoyancy: 2.3,
    colorMode: 0,
    curlStrength: 2.4,
    dissipation: 0.982,
    emitStrength: 3.1,
    flameHeight: 0.58,
    flameScaleX: 1,
    flameScaleY: 1.15,
    flameScaleZ: 1,
    flameWidth: 0.52,
    groundOpacity: 0.82,
    groundSize: 8,
    groundVisible: true,
    pressureIterations: 8,
    rayMarchSteps: 64,
    simulationFps: 30,
    simulationResolution: 32,
    turbulence: 0.48,
    volumeScale: 2.1,
  },
)

const { camera, renderer } = useTres()

const fluidResources = shallowRef<FluidResources | null>(null)
const volumeMesh = shallowRef<THREE.Mesh | null>(null)
const groundMesh = shallowRef<THREE.Mesh | null>(null)

const tempCameraPosition = new THREE.Vector3()
const savedClearColor = new THREE.Color()

let accumulatedSimulationTime = 0
let hasSimulated = false

const clampNumber = (value: number | undefined, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return THREE.MathUtils.clamp(value as number, min, max)
}

const clampInteger = (value: number | undefined, min: number, max: number, fallback: number) => {
  return Math.round(clampNumber(value, min, max, fallback))
}

const safeAbsorption = computed(() => clampNumber(props.absorption, 2, 20, 7.5))
const safeBrightness = computed(() => clampNumber(props.brightness, 0.3, 4, 1.45))
const safeBuoyancy = computed(() => clampNumber(props.buoyancy, 0, 8, 2.3))
const safeColorMode = computed(() => clampInteger(props.colorMode, 0, 4, 0))
const safeCurlStrength = computed(() => clampNumber(props.curlStrength, 0, 8, 2.4))
const safeDissipation = computed(() => clampNumber(props.dissipation, 0.9, 0.999, 0.982))
const safeEmitStrength = computed(() => clampNumber(props.emitStrength, 0.2, 8, 3.1))
const safeFlameHeight = computed(() => clampNumber(props.flameHeight, 0, 1, 0.58))
const safeFlameScaleX = computed(() => clampNumber(props.flameScaleX, 0.3, 2.5, 1))
const safeFlameScaleY = computed(() => clampNumber(props.flameScaleY, 0.3, 2.5, 1.15))
const safeFlameScaleZ = computed(() => clampNumber(props.flameScaleZ, 0.3, 2.5, 1))
const safeFlameWidth = computed(() => clampNumber(props.flameWidth, 0, 1, 0.52))
const safeGroundOpacity = computed(() => clampNumber(props.groundOpacity, 0, 1, 0.82))
const safeGroundSize = computed(() => clampNumber(props.groundSize, 2, 30, 8))
const safePressureIterations = computed(() => clampInteger(props.pressureIterations, 1, 24, 8))
const safeRayMarchSteps = computed(() => clampInteger(props.rayMarchSteps, 24, 128, 64))
const safeSimulationFps = computed(() => clampNumber(props.simulationFps, 10, 60, 30))
const safeSimulationResolution = computed(() => {
  const snappedResolution = Math.round(clampNumber(props.simulationResolution, 16, 64, 32) / 8) * 8

  return THREE.MathUtils.clamp(snappedResolution, 16, 64)
})
const safeTurbulence = computed(() => clampNumber(props.turbulence, 0, 1, 0.48))
const safeVolumeScale = computed(() => clampNumber(props.volumeScale, 0.5, 6, 2.1))

const injectAtlasCommon = (shader: string) => shader.replace('#include <atlas_common>', atlasCommonShader)

const createAtlasLayout = (grid: number): AtlasLayout => {
  const slicesPerRow = Math.ceil(Math.sqrt(grid))

  return {
    atlasSize: grid * slicesPerRow,
    grid,
    slicesPerRow,
  }
}

const createAtlasUniforms = (layout: AtlasLayout): UniformMap => ({
  uAtlas: { value: layout.atlasSize },
  uGrid: { value: layout.grid },
  uSlicesPerRow: { value: layout.slicesPerRow },
})

const chooseRenderTargetType = (activeRenderer: THREE.WebGLRenderer) => {
  if (activeRenderer.capabilities.isWebGL2 || activeRenderer.extensions.has('EXT_color_buffer_half_float')) {
    return THREE.HalfFloatType
  }

  if (activeRenderer.extensions.has('OES_texture_float')) {
    return THREE.FloatType
  }

  return THREE.HalfFloatType
}

const createVolumeTarget = (layout: AtlasLayout, activeRenderer: THREE.WebGLRenderer) => {
  return new THREE.WebGLRenderTarget(layout.atlasSize, layout.atlasSize, {
    depthBuffer: false,
    format: THREE.RGBAFormat,
    generateMipmaps: false,
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearFilter,
    stencilBuffer: false,
    type: chooseRenderTargetType(activeRenderer),
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  })
}

const createPassMaterial = (
  layout: AtlasLayout,
  fragmentShader: string,
  uniforms: UniformMap,
) => {
  return new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    fragmentShader: injectAtlasCommon(fragmentShader),
    uniforms: {
      ...createAtlasUniforms(layout),
      ...uniforms,
    },
    vertexShader: fullscreenVertexShader,
  })
}

const createResources = (activeRenderer: any): FluidResources => {
  const layout = createAtlasLayout(safeSimulationResolution.value)
  const advectMaterial = createPassMaterial(layout, advectFragmentShader, {
    uBuoyancy: { value: safeBuoyancy.value },
    uCurlStrength: { value: safeCurlStrength.value },
    uDissipation: { value: safeDissipation.value },
    uDt: { value: 1 / 60 },
    uEmitStrength: { value: safeEmitStrength.value },
    uFlameHeight: { value: safeFlameHeight.value },
    uFlameScaleX: { value: safeFlameScaleX.value },
    uFlameScaleY: { value: safeFlameScaleY.value },
    uFlameScaleZ: { value: safeFlameScaleZ.value },
    uFlameWidth: { value: safeFlameWidth.value },
    uFluid: { value: null },
    uTime: { value: 0 },
    uTurbulence: { value: safeTurbulence.value },
  })
  const divergenceMaterial = createPassMaterial(layout, divergenceFragmentShader, {
    uFluid: { value: null },
  })
  const jacobiMaterial = createPassMaterial(layout, jacobiFragmentShader, {
    uDivergence: { value: null },
    uPressure: { value: null },
  })
  const gradientSubtractMaterial = createPassMaterial(layout, gradientSubtractFragmentShader, {
    uFluid: { value: null },
    uPressure: { value: null },
  })
  const volumeMaterial = new CustomShaderMaterial({
    baseMaterial: THREE.MeshBasicMaterial,
    blending: THREE.AdditiveBlending,
    color: 0xFFFFFF,
    depthTest: true,
    depthWrite: false,
    fragmentShader: injectAtlasCommon(volumeFragmentShader),
    side: THREE.DoubleSide,
    silent: true,
    toneMapped: false,
    transparent: true,
    uniforms: {
      ...createAtlasUniforms(layout),
      uAbsorption: { value: safeAbsorption.value },
      uBrightness: { value: safeBrightness.value },
      uCameraPos: { value: new THREE.Vector3() },
      uColorMode: { value: safeColorMode.value },
      uFlameHeight: { value: safeFlameHeight.value },
      uFlameScaleX: { value: safeFlameScaleX.value },
      uFlameScaleY: { value: safeFlameScaleY.value },
      uFlameScaleZ: { value: safeFlameScaleZ.value },
      uFlameWidth: { value: safeFlameWidth.value },
      uFluid: { value: null },
      uInvModelMatrix: { value: new THREE.Matrix4() },
      uRayMarchSteps: { value: safeRayMarchSteps.value },
    },
    vertexShader: volumeVertexShader,
  }) as VolumeCustomMaterial
  const groundMaterial = new CustomShaderMaterial({
    baseMaterial: THREE.MeshBasicMaterial,
    blending: THREE.AdditiveBlending,
    color: 0xFFFFFF,
    depthTest: true,
    depthWrite: false,
    fragmentShader: groundFragmentShader,
    side: THREE.DoubleSide,
    silent: true,
    toneMapped: false,
    transparent: true,
    uniforms: {
      uColorMode: { value: safeColorMode.value },
      uGroundSize: { value: safeGroundSize.value },
      uGroundOpacity: { value: safeGroundOpacity.value },
    },
    vertexShader: groundVertexShader,
  }) as GroundCustomMaterial
  const passGeometry = new THREE.PlaneGeometry(2, 2)
  const passMesh = new THREE.Mesh(passGeometry, advectMaterial)
  const passScene = new THREE.Scene()
  const passCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const volumeGeometry = new THREE.BoxGeometry(2, 2, 2)
  const volume = new THREE.Mesh(volumeGeometry, volumeMaterial)
  const groundGeometry = new THREE.PlaneGeometry(1, 1)
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)

  passScene.add(passMesh)

  volume.frustumCulled = false
  volume.renderOrder = 20
  ground.frustumCulled = false
  ground.renderOrder = 9
  ground.rotation.x = -Math.PI / 2

  const resources: FluidResources = {
    advectMaterial,
    divergenceMaterial,
    divergenceTarget: createVolumeTarget(layout, activeRenderer),
    fluidA: createVolumeTarget(layout, activeRenderer),
    fluidB: createVolumeTarget(layout, activeRenderer),
    gradientSubtractMaterial,
    groundGeometry,
    groundMaterial,
    groundMesh: ground,
    jacobiMaterial,
    layout,
    passCamera,
    passGeometry,
    passMesh,
    passScene,
    pressureA: createVolumeTarget(layout, activeRenderer),
    pressureB: createVolumeTarget(layout, activeRenderer),
    volumeGeometry,
    volumeMaterial,
    volumeMesh: volume,
  }

  syncResourceUniforms(resources)
  clearFluidTargets(resources, activeRenderer)

  return resources
}

const disposeResources = (resources: FluidResources | null) => {
  if (!resources) {
    return
  }

  resources.fluidA.dispose()
  resources.fluidB.dispose()
  resources.pressureA.dispose()
  resources.pressureB.dispose()
  resources.divergenceTarget.dispose()
  resources.advectMaterial.dispose()
  resources.divergenceMaterial.dispose()
  resources.jacobiMaterial.dispose()
  resources.gradientSubtractMaterial.dispose()
  resources.volumeMaterial.dispose()
  resources.groundMaterial.dispose()
  resources.passGeometry.dispose()
  resources.volumeGeometry.dispose()
  resources.groundGeometry.dispose()
  resources.passScene.clear()
}

const withRendererState = (
  activeRenderer: THREE.WebGLRenderer,
  renderWork: () => void,
) => {
  const previousTarget = activeRenderer.getRenderTarget() as THREE.WebGLRenderTarget | null
  const previousCubeFace = activeRenderer.getActiveCubeFace()
  const previousMipmapLevel = activeRenderer.getActiveMipmapLevel()
  const previousAutoClear = activeRenderer.autoClear
  const previousClearAlpha = activeRenderer.getClearAlpha()

  activeRenderer.getClearColor(savedClearColor)

  try {
    renderWork()
  }
  finally {
    activeRenderer.setRenderTarget(previousTarget, previousCubeFace, previousMipmapLevel)
    activeRenderer.setClearColor(savedClearColor, previousClearAlpha)
    activeRenderer.autoClear = previousAutoClear
  }
}

const clearTarget = (target: THREE.WebGLRenderTarget, activeRenderer: THREE.WebGLRenderer) => {
  activeRenderer.setRenderTarget(target)
  activeRenderer.setClearColor(0x000000, 0)
  activeRenderer.clear(true, false, false)
}

function clearFluidTargets(resources: FluidResources, activeRenderer: any) {
  withRendererState(activeRenderer, () => {
    clearTarget(resources.fluidA, activeRenderer)
    clearTarget(resources.fluidB, activeRenderer)
    clearTarget(resources.pressureA, activeRenderer)
    clearTarget(resources.pressureB, activeRenderer)
    clearTarget(resources.divergenceTarget, activeRenderer)
  })
}

const renderPass = (
  resources: FluidResources,
  material: THREE.ShaderMaterial,
  target: THREE.WebGLRenderTarget,
  activeRenderer: THREE.WebGLRenderer,
) => {
  resources.passMesh.material = material
  activeRenderer.setRenderTarget(target)
  activeRenderer.render(resources.passScene, resources.passCamera)
}

function syncResourceUniforms(resources: FluidResources) {
  const advectUniforms = resources.advectMaterial.uniforms
  const volumeUniforms = resources.volumeMaterial.uniforms
  const groundUniforms = resources.groundMaterial.uniforms
  const volumeScale = safeVolumeScale.value

  advectUniforms.uBuoyancy.value = safeBuoyancy.value
  advectUniforms.uCurlStrength.value = safeCurlStrength.value
  advectUniforms.uDissipation.value = safeDissipation.value
  advectUniforms.uEmitStrength.value = safeEmitStrength.value
  advectUniforms.uFlameHeight.value = safeFlameHeight.value
  advectUniforms.uFlameScaleX.value = safeFlameScaleX.value
  advectUniforms.uFlameScaleY.value = safeFlameScaleY.value
  advectUniforms.uFlameScaleZ.value = safeFlameScaleZ.value
  advectUniforms.uFlameWidth.value = safeFlameWidth.value
  advectUniforms.uTurbulence.value = safeTurbulence.value

  volumeUniforms.uAbsorption.value = safeAbsorption.value
  volumeUniforms.uBrightness.value = safeBrightness.value
  volumeUniforms.uColorMode.value = safeColorMode.value
  volumeUniforms.uFlameHeight.value = safeFlameHeight.value
  volumeUniforms.uFlameScaleX.value = safeFlameScaleX.value
  volumeUniforms.uFlameScaleY.value = safeFlameScaleY.value
  volumeUniforms.uFlameScaleZ.value = safeFlameScaleZ.value
  volumeUniforms.uFlameWidth.value = safeFlameWidth.value
  volumeUniforms.uRayMarchSteps.value = safeRayMarchSteps.value

  groundUniforms.uColorMode.value = safeColorMode.value
  groundUniforms.uGroundSize.value = safeGroundSize.value
  groundUniforms.uGroundOpacity.value = safeGroundOpacity.value

  resources.volumeMesh.position.set(0, volumeScale * 0.5, 0)
  resources.volumeMesh.scale.setScalar(volumeScale)
  resources.groundMesh.scale.set(safeGroundSize.value, safeGroundSize.value, 1)
  resources.groundMesh.visible = Boolean(props.groundVisible)
}

const rebuildResources = () => {
  const previousResources = fluidResources.value
  const nextResources = createResources(renderer)

  fluidResources.value = nextResources
  volumeMesh.value = nextResources.volumeMesh
  groundMesh.value = nextResources.groundMesh

  accumulatedSimulationTime = 0
  hasSimulated = false
  disposeResources(previousResources)
}

const simulateFluid = (
  resources: FluidResources,
  dt: number,
  elapsed: number,
  activeRenderer: any,
) => {
  syncResourceUniforms(resources)

  withRendererState(activeRenderer, () => {
    activeRenderer.autoClear = false

    resources.advectMaterial.uniforms.uFluid.value = resources.fluidA.texture
    resources.advectMaterial.uniforms.uDt.value = Math.min(dt, 0.033)
    resources.advectMaterial.uniforms.uTime.value = elapsed
    renderPass(resources, resources.advectMaterial, resources.fluidB, activeRenderer)
    ;[resources.fluidA, resources.fluidB] = [resources.fluidB, resources.fluidA]

    resources.divergenceMaterial.uniforms.uFluid.value = resources.fluidA.texture
    renderPass(resources, resources.divergenceMaterial, resources.divergenceTarget, activeRenderer)

    clearTarget(resources.pressureA, activeRenderer)

    let pressureRead = resources.pressureA
    let pressureWrite = resources.pressureB

    for (let index = 0; index < safePressureIterations.value; index += 1) {
      resources.jacobiMaterial.uniforms.uPressure.value = pressureRead.texture
      resources.jacobiMaterial.uniforms.uDivergence.value = resources.divergenceTarget.texture
      renderPass(resources, resources.jacobiMaterial, pressureWrite, activeRenderer)
      ;[pressureRead, pressureWrite] = [pressureWrite, pressureRead]
    }

    resources.gradientSubtractMaterial.uniforms.uFluid.value = resources.fluidA.texture
    resources.gradientSubtractMaterial.uniforms.uPressure.value = pressureRead.texture
    renderPass(resources, resources.gradientSubtractMaterial, resources.fluidB, activeRenderer)
    ;[resources.fluidA, resources.fluidB] = [resources.fluidB, resources.fluidA]
  })
}

const syncVolumeRenderUniforms = (
  resources: FluidResources,
  activeCamera: THREE.Camera | null | undefined,
) => {
  resources.volumeMaterial.uniforms.uFluid.value = resources.fluidA.texture

  if (activeCamera) {
    activeCamera.getWorldPosition(tempCameraPosition)
    resources.volumeMaterial.uniforms.uCameraPos.value.copy(tempCameraPosition)
  }

  resources.volumeMesh.updateWorldMatrix(true, false)
  resources.volumeMaterial.uniforms.uInvModelMatrix.value.copy(resources.volumeMesh.matrixWorld).invert()
}

const resetFluidAction = () => {
  if (!fluidResources.value) {
    return
  }

  clearFluidTargets(fluidResources.value, renderer)
  accumulatedSimulationTime = 0
  hasSimulated = false
}

watch(
  safeSimulationResolution,
  () => {
    rebuildResources()
  },
  { immediate: true },
)

watch(
  [
    safeAbsorption,
    safeBrightness,
    safeBuoyancy,
    safeColorMode,
    safeCurlStrength,
    safeDissipation,
    safeEmitStrength,
    safeFlameHeight,
    safeFlameScaleX,
    safeFlameScaleY,
    safeFlameScaleZ,
    safeFlameWidth,
    safeGroundOpacity,
    safeGroundSize,
    safeRayMarchSteps,
    safeTurbulence,
    safeVolumeScale,
    () => props.groundVisible,
  ],
  () => {
    if (fluidResources.value) {
      syncResourceUniforms(fluidResources.value)
    }
  },
  { immediate: true },
)

const { onBeforeRender } = useLoop()

onBeforeRender(({ camera: loopCamera, delta, elapsed, renderer: activeRenderer }) => {
  if (!fluidResources.value) {
    return
  }

  const frameDelta = Math.min(Math.max(delta, 1 / 240), 0.05)
  const simulationInterval = 1 / safeSimulationFps.value

  accumulatedSimulationTime += frameDelta

  if (!hasSimulated || accumulatedSimulationTime >= simulationInterval) {
    const simulationDelta = hasSimulated
      ? accumulatedSimulationTime
      : 1 / 60

    simulateFluid(fluidResources.value, simulationDelta, elapsed, activeRenderer)
    accumulatedSimulationTime = 0
    hasSimulated = true
  }

  syncVolumeRenderUniforms(fluidResources.value, loopCamera?.value ?? camera.value)
})

defineExpose({
  resetFluidAction,
})

onBeforeUnmount(() => {
  disposeResources(fluidResources.value)
  fluidResources.value = null
  volumeMesh.value = null
  groundMesh.value = null
})
</script>

<template>
  <TresGroup>
    <primitive
      v-if="groundMesh"
      :object="groundMesh"
    />
    <primitive
      v-if="volumeMesh"
      :object="volumeMesh"
    />
  </TresGroup>
</template>
