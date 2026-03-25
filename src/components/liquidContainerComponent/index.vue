<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import {
  computed,
  onBeforeUnmount,
  shallowRef,
  watch,
} from 'vue'
import type { ContainerGeometryBundle, LiquidContainerProps } from './types'
import { DEFAULT_LIQUID_CONTAINER_PROPS } from './constants'
import { buildContainerGeometries, sanitizeLiquidContainerProps } from './useContainerGeometry'
import { createSurfaceUniforms, syncSurfaceUniforms } from './useLiquidSurface'
import { createBubbleState, disposeBubbleState, rebuildBubbleState, updateBubbleState } from './useBubbleSystem'
import shellFragmentShader from '../../shader/liquidContainerComponent/shell.frag?raw'
import shellVertexShader from '../../shader/liquidContainerComponent/shell.vert?raw'
import liquidFragmentShader from '../../shader/liquidContainerComponent/liquid.frag?raw'
import liquidVertexShader from '../../shader/liquidContainerComponent/liquid.vert?raw'
import surfaceFragmentShader from '../../shader/liquidContainerComponent/surface.frag?raw'
import surfaceVertexShader from '../../shader/liquidContainerComponent/surface.vert?raw'
import bubbleFragmentShader from '../../shader/liquidContainerComponent/bubble.frag?raw'
import bubbleVertexShader from '../../shader/liquidContainerComponent/bubble.vert?raw'

type LiquidMeshCustomMaterial = CustomShaderMaterial<typeof THREE.MeshBasicMaterial>

const props = withDefaults(defineProps<LiquidContainerProps>(), DEFAULT_LIQUID_CONTAINER_PROPS)

const safeConfig = computed(() => sanitizeLiquidContainerProps(props))
const currentGeometry = shallowRef<ContainerGeometryBundle | null>(null)

const shellUniforms = {
  uShellColor: { value: new THREE.Color(safeConfig.value.shellColor) },
  uOpacity: { value: safeConfig.value.shellOpacity },
  uHalfExtents: { value: new THREE.Vector3(1, 1, 1) },
  uClipX: { value: safeConfig.value.clipX },
  uClipZ: { value: safeConfig.value.clipZ },
}

const liquidUniforms = {
  uBaseColor: { value: new THREE.Color(safeConfig.value.baseColor) },
  uTopColor: { value: new THREE.Color(safeConfig.value.topColor) },
  uEdgeColor: { value: new THREE.Color(safeConfig.value.edgeColor) },
  uOpacity: { value: safeConfig.value.opacity },
  uDensity: { value: safeConfig.value.density },
  uFillLevel: { value: safeConfig.value.fillLevel },
  uHalfHeight: { value: 1 },
  uTime: { value: 0 },
}

const surfaceUniforms = createSurfaceUniforms(safeConfig.value, {
  shellGeometry: new THREE.BufferGeometry(),
  liquidGeometry: new THREE.BufferGeometry(),
  surfaceGeometry: new THREE.BufferGeometry(),
  shellPositionY: 0,
  liquidPositionY: 0,
  surfacePositionY: 0,
  shellHalfExtents: new THREE.Vector3(1, 1, 1),
  liquidHalfExtents: new THREE.Vector3(1, 1, 1),
  surfaceRadius: 1,
  surfaceShape: 'circle',
  liquidHeight: 1,
  sampleInnerRadius: () => 1,
  sampleBubblePosition: () => new THREE.Vector3(),
  dispose: () => {},
})
surfaceUniforms.uTime.value = 0

const createMeshCustomMaterial = (
  vertexShader: string,
  fragmentShader: string,
  uniforms: Record<string, THREE.IUniform>,
): LiquidMeshCustomMaterial => {
  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshBasicMaterial,
    color: 0xFFFFFF,
    depthTest: true,
    depthWrite: false,
    fragmentShader,
    side: THREE.DoubleSide,
    silent: true,
    toneMapped: false,
    transparent: true,
    uniforms,
    vertexShader,
  })
}

const shellMaterial = createMeshCustomMaterial(shellVertexShader, shellFragmentShader, shellUniforms)
const liquidMaterial = createMeshCustomMaterial(liquidVertexShader, liquidFragmentShader, liquidUniforms)
const surfaceMaterial = createMeshCustomMaterial(surfaceVertexShader, surfaceFragmentShader, surfaceUniforms)

const shellMesh = shallowRef(new THREE.Mesh(new THREE.BufferGeometry(), shellMaterial))
const liquidMesh = shallowRef(new THREE.Mesh(new THREE.BufferGeometry(), liquidMaterial))
const surfaceMesh = shallowRef(new THREE.Mesh(new THREE.BufferGeometry(), surfaceMaterial))
const bubbleState = createBubbleState(bubbleVertexShader, bubbleFragmentShader)

shellMesh.value.renderOrder = 10
liquidMesh.value.renderOrder = 4
surfaceMesh.value.renderOrder = 8
bubbleState.points.renderOrder = 5

const syncMaterialUniforms = (config = safeConfig.value, geometry = currentGeometry.value) => {
  if (!geometry) {
    return
  }

  const opaqueShellMode = config.shellOpacity >= 0.92

  shellUniforms.uShellColor.value.set(config.shellColor)
  shellUniforms.uOpacity.value = config.shellOpacity
  shellUniforms.uHalfExtents.value.copy(geometry.shellHalfExtents)
  shellUniforms.uClipX.value = config.clipX
  shellUniforms.uClipZ.value = config.clipZ
  shellMesh.value.visible = config.shellOpacity > 0.0001
  shellMaterial.depthWrite = opaqueShellMode
  shellMaterial.transparent = !opaqueShellMode
  shellMaterial.needsUpdate = true
  shellMesh.value.renderOrder = opaqueShellMode ? 2 : 10
  liquidMesh.value.renderOrder = opaqueShellMode ? 4 : 4
  bubbleState.points.renderOrder = opaqueShellMode ? 5 : 5
  surfaceMesh.value.renderOrder = opaqueShellMode ? 6 : 8

  liquidUniforms.uBaseColor.value.set(config.baseColor)
  liquidUniforms.uTopColor.value.set(config.topColor)
  liquidUniforms.uEdgeColor.value.set(config.edgeColor)
  liquidUniforms.uOpacity.value = config.opacity
  liquidUniforms.uDensity.value = config.density
  liquidUniforms.uFillLevel.value = config.fillLevel
  liquidUniforms.uHalfHeight.value = geometry.liquidHalfExtents.y

  syncSurfaceUniforms(surfaceUniforms, config, geometry)
  bubbleState.material.uniforms.uColor.value.set(config.bubbleColor)
  bubbleState.material.uniforms.uOpacity.value = THREE.MathUtils.clamp(config.opacity * 0.42, 0, 0.42)
  bubbleState.points.visible = config.bubbleEnabled && bubbleState.activeCount > 0
}

const rebuildScene = () => {
  const config = safeConfig.value
  currentGeometry.value?.dispose()

  const nextGeometry = buildContainerGeometries(config)
  currentGeometry.value = nextGeometry

  shellMesh.value.geometry.dispose()
  liquidMesh.value.geometry.dispose()
  surfaceMesh.value.geometry.dispose()

  shellMesh.value.geometry = nextGeometry.shellGeometry
  shellMesh.value.position.set(0, nextGeometry.shellPositionY, 0)

  liquidMesh.value.geometry = nextGeometry.liquidGeometry
  liquidMesh.value.position.set(0, nextGeometry.liquidPositionY, 0)

  surfaceMesh.value.geometry = nextGeometry.surfaceGeometry
  surfaceMesh.value.position.set(0, nextGeometry.surfacePositionY, 0)
  surfaceMesh.value.rotation.set(-Math.PI / 2, 0, 0)

  rebuildBubbleState(bubbleState, config, nextGeometry)
  syncMaterialUniforms(config, nextGeometry)
}

watch(safeConfig, () => {
  rebuildScene()
}, { immediate: true })

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  liquidUniforms.uTime.value = elapsed
  surfaceUniforms.uTime.value = elapsed

  if (currentGeometry.value) {
    updateBubbleState(bubbleState, elapsed, safeConfig.value, currentGeometry.value)
  }
})

onBeforeUnmount(() => {
  currentGeometry.value?.dispose()
  shellMesh.value.geometry.dispose()
  liquidMesh.value.geometry.dispose()
  surfaceMesh.value.geometry.dispose()
  shellMaterial.dispose()
  liquidMaterial.dispose()
  surfaceMaterial.dispose()
  disposeBubbleState(bubbleState)
})
</script>

<template>
  <TresGroup>
    <primitive :object="liquidMesh" />
    <primitive :object="bubbleState.points" />
    <primitive :object="surfaceMesh" />
    <primitive :object="shellMesh" />
  </TresGroup>
</template>
