import { Box3, Vector3 } from 'three'
import type { InstancedMesh, Material, Mesh, Object3D } from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { resolveIsoGlowStyle } from './defaults'
import type { IsoGlowStyle } from './defaults'
import { createEdgeOverlays, yieldEdgeWork } from './edges'
import { createIsoGlowMaterials } from './materials'
import { disposeIsoGlowGLTF, disposeObjectBuffers } from './resources'

type EdgeSet = NonNullable<Awaited<ReturnType<typeof createEdgeOverlays>>>

export function createIsoGlowRuntime(
  gltf: GLTF,
  options: Partial<IsoGlowStyle>,
  invalidate: () => void = () => {},
) {
  if (!gltf.scene) { throw new Error('GLB 未提供可显示的默认场景。') }
  // SkeletonUtils keeps the original hierarchy and correctly remaps cloned bones.
  // Tres augments Object3D pointer APIs that GLTFLoader's Group type omits.
  const group = clone(gltf.scene as unknown as Object3D)
  group.updateMatrixWorld(true)
  const size = new Box3().setFromObject(group).getSize(new Vector3())
  const materials = createIsoGlowMaterials(Math.max(size.x, size.y, size.z, 0.001))
  const bindings: Array<{ mesh: Mesh, original: Material | Material[], styled: Material | Material[] }> = []
  const contours: Mesh[] = []
  let style = resolveIsoGlowStyle(options)
  let disposed = false
  let currentEdges: EdgeSet | null = null
  let currentThreshold = Number.NaN
  let pendingThreshold = Number.NaN
  let edgeController: AbortController | null = null
  let edgeTask: Promise<void> = Promise.resolve()
  let edgeError: unknown = null

  group.traverse((object) => {
    const mesh = object as Mesh
    if (!mesh.isMesh) { return }
    bindings.push({
      mesh,
      original: mesh.material,
      styled: Array.isArray(mesh.material) ? mesh.material.map(materials.surfaceFor) : materials.surfaceFor(mesh.material),
    })
  })

  if (!bindings.length) {
    materials.dispose()
    disposeObjectBuffers(group)
    throw new Error('GLB 中没有可风格化的 Mesh 网格。')
  }
  // A back-face shell gives curved parts a silhouette even without sharp creases.
  // Collect original meshes before adding children, so overlays are never restyled.
  bindings.forEach(({ mesh, original }) => {
    const sources = Array.isArray(original) ? original : [original]
    if (!mesh.geometry.hasAttribute('normal') || sources.some(source => source.alphaTest > 0 || source.transparent || source.opacity < 1)) { return }
    const shell = mesh.clone(false)
    shell.name = `${mesh.name || 'mesh'}__isoGlowContour`
    shell.position.set(0, 0, 0)
    shell.quaternion.identity()
    shell.scale.set(1, 1, 1)
    shell.matrix.identity()
    shell.material = materials.outline
    shell.raycast = () => {}
    shell.onBeforeRender = renderer => materials.updateViewport(renderer)
    mesh.add(shell)
    contours.push(shell)
  })

  function updateMaterials() {
    materials.update(style)
    bindings.forEach(({ mesh, original, styled }) => { mesh.material = style.enabled ? styled : original })
    const showEdges = style.enabled && style.showEdges && style.edgeOpacity > 0
    contours.forEach((shell) => {
      shell.visible = showEdges && style.stylePreset === 'iso-glow' && style.surfaceOpacity === 1
    })
    currentEdges?.overlays.forEach(({ line, hidden }) => {
      line.visible = showEdges
      hidden.visible = showEdges && style.stylePreset === 'blueprint' && style.surfaceOpacity === 1
    })
  }

  function stopPendingEdges() {
    edgeController?.abort()
    edgeController = null
    pendingThreshold = Number.NaN
  }

  function queueEdges(threshold: number) {
    stopPendingEdges()
    const controller = new AbortController()
    edgeController = controller
    pendingThreshold = threshold
    edgeError = null
    edgeTask = (async () => {
      await yieldEdgeWork(controller.signal, currentEdges ? 120 : 0)
      if (controller.signal.aborted) { return }
      const next = await createEdgeOverlays(bindings.map(binding => binding.mesh), materials.edges, materials.hiddenEdges, threshold, controller.signal)
      if (!next) { return }
      if (disposed || controller.signal.aborted) { next.dispose(); return }
      currentEdges?.dispose()
      currentEdges = next
      currentThreshold = threshold
      next.overlays.forEach(({ mesh, line, hidden }) => mesh.add(line, hidden))
      updateMaterials()
      invalidate()
    })().catch((error: unknown) => {
      if (!controller.signal.aborted && !disposed) { edgeError = error }
    }).finally(() => {
      if (edgeController === controller) {
        edgeController = null
        pendingThreshold = Number.NaN
      }
    })
  }

  function update(next: Partial<IsoGlowStyle>) {
    if (disposed) { return }
    style = resolveIsoGlowStyle(next)
    updateMaterials()
    if (!style.enabled || !style.showEdges) {
      stopPendingEdges()
      edgeError = null
    }
    else if (style.edgeThreshold === currentThreshold) {
      stopPendingEdges()
    }
    else if (style.edgeThreshold !== pendingThreshold) {
      queueEdges(style.edgeThreshold)
    }
    invalidate()
  }

  async function whenEdgesReady() {
    let pending: Promise<void>
    do {
      pending = edgeTask
      await pending
    } while (pending !== edgeTask)
    if (edgeError) { throw edgeError }
  }

  update(style)
  return {
    group,
    update,
    whenEdgesReady,
    dispose() {
      if (disposed) { return }
      disposed = true
      stopPendingEdges()
      group.removeFromParent()
      currentEdges?.dispose()
      currentEdges = null
      bindings.forEach(({ mesh, original }) => { mesh.material = original })
      contours.forEach((shell) => {
        shell.removeFromParent()
        if ((shell as InstancedMesh).isInstancedMesh) { (shell as InstancedMesh).dispose() }
      })
      contours.length = 0
      materials.dispose()
      disposeObjectBuffers(group)
      group.clear()
      bindings.length = 0
      disposeIsoGlowGLTF(gltf)
    },
  }
}

export type IsoGlowRuntime = ReturnType<typeof createIsoGlowRuntime>
