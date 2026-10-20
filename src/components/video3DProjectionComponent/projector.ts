// Adapted from hh-hang/vid3d-projection (MIT); see THIRD_PARTY_NOTICE.md.
import { CameraHelper, Color, Group, InstancedMesh, MathUtils, Matrix3, Matrix4, Mesh, PerspectiveCamera, Scene, SkinnedMesh } from 'three'
import type { Camera, Material, Texture, WebGLRenderer } from 'three'
// Tres extends the barrel's Object3D type; derived Three.js nodes use the base type.
import type { Object3D } from 'three/src/core/Object3D.js'
import { bounded } from './defaults'
import type { Video3DProjectionOptions } from './defaults'
import { createProjectorDepthCapture } from './depthCapture'
import { createProjectionMaterials } from './materials'

export const VIDEO_PROJECTION_INTERNAL = 'isVideo3DProjectionInternal'

function isVisible(object: Object3D) {
  for (let ancestor: Object3D | null = object; ancestor; ancestor = ancestor.parent) {
    if (!ancestor.visible) { return false }
  }
  return true
}

function makeProxy(source: Mesh, material: Material | Material[]) {
  let proxy: Mesh
  if (source instanceof InstancedMesh) {
    proxy = new InstancedMesh(source.geometry, material, 0)
  }
  else if (source instanceof SkinnedMesh) {
    proxy = new SkinnedMesh(source.geometry, material)
  }
  else { proxy = new Mesh(source.geometry, material) }
  proxy.matrixAutoUpdate = false
  proxy.frustumCulled = false
  proxy.userData[VIDEO_PROJECTION_INTERNAL] = true
  return proxy
}

function syncProxy(source: Mesh, proxy: Mesh) {
  proxy.geometry = source.geometry
  proxy.matrix.copy(source.matrixWorld)
  proxy.matrixWorldNeedsUpdate = true
  proxy.layers.mask = source.layers.mask
  proxy.renderOrder = source.renderOrder + 1
  proxy.morphTargetInfluences = source.morphTargetInfluences
  proxy.morphTargetDictionary = source.morphTargetDictionary
  if (source instanceof InstancedMesh && proxy instanceof InstancedMesh) {
    proxy.instanceMatrix = source.instanceMatrix
    proxy.instanceColor = null
    proxy.morphTexture = source.morphTexture
    proxy.count = source.count
  }
  else if (source instanceof SkinnedMesh && proxy instanceof SkinnedMesh) {
    proxy.skeleton = source.skeleton
    proxy.bindMode = source.bindMode
    proxy.bindMatrix.copy(source.bindMatrix)
    proxy.bindMatrixInverse.copy(source.bindMatrixInverse)
  }
}

export function createVideoProjector(initialOptions: Video3DProjectionOptions) {
  let options = { ...initialOptions }
  let disposed = false
  let boundRoots: Set<Object3D> | null = null
  let targetNames = new Set<string>()
  const root = new Group()
  root.name = 'video3DProjectionComponent'
  const camera = new PerspectiveCamera()
  camera.layers.enableAll()
  root.add(camera)

  // World-space proxies stay independent of receiver/component parent transforms.
  const overlays = new Group()
  overlays.name = 'video3DProjectionOverlays'
  overlays.userData[VIDEO_PROJECTION_INTERNAL] = true
  overlays.matrixAutoUpdate = false
  overlays.matrixWorldAutoUpdate = false
  const helper = new CameraHelper(camera)
  helper.name = 'video3DProjectionFrustum'
  overlays.add(helper)
  const depthScene = new Scene()
  const depthCapture = createProjectorDepthCapture()
  const uniforms = {
    projectorMap: { value: null as Texture | null },
    projectorDepthMap: { value: null as Texture | null },
    projectorMatrix: { value: new Matrix4() },
    projectorTint: { value: new Color() },
    projectorIntensity: { value: 1 },
    projectorOpacity: { value: 1 },
    projectorDepthBias: { value: 0.001 },
    projectorEdgeFeather: { value: 0.035 },
    projectorOcclusion: { value: true },
    projectorReversedDepth: { value: false },
    projectorUVMatrix: { value: new Matrix3() },
  }
  const materials = createProjectionMaterials(uniforms)
  const records = new Map<Mesh, { overlay: Mesh | null, depth: Mesh | null }>()
  const receivers: Mesh[] = []

  function configure(next: Video3DProjectionOptions) {
    if (disposed) { return }
    options = { ...next }
    const far = bounded(options.distance, 0.02, 10000, 8)
    camera.near = bounded(options.near, 0.001, far - 0.001, Math.min(0.1, far / 2))
    camera.far = far
    camera.fov = bounded(options.angle2, 1, 170, 40)
    camera.aspect = Math.tan(MathUtils.degToRad(bounded(options.angle, 1, 170, 64)) / 2)
      / Math.tan(MathUtils.degToRad(camera.fov) / 2)
    camera.rotation.set(
      MathUtils.degToRad(bounded(options.pitch, -89.9, 89.9, -20)),
      MathUtils.degToRad(-bounded(options.heading, -360, 360, 0)),
      MathUtils.degToRad(bounded(options.roll, -360, 360, 0)),
      'YXZ',
    )
    camera.updateProjectionMatrix()
    helper.update()
    const color = new Color(options.frustumColor)
    helper.setColors(color, color, color, color, color)
    uniforms.projectorTint.value.set(options.videoTint)
    uniforms.projectorIntensity.value = bounded(options.intensity, 0, 10, 1)
    uniforms.projectorOpacity.value = bounded(options.opacity, 0, 1, 0.95)
    uniforms.projectorDepthBias.value = bounded(options.depthBias, 0, 0.1, 0.001)
    uniforms.projectorEdgeFeather.value = bounded(options.edgeFeather, 0, 0.5, 0.035)
    uniforms.projectorOcclusion.value = options.enableOcclusion
    uniforms.projectorUVMatrix.value.setUvTransform(
      options.flipX ? 1 : 0,
      0,
      options.flipX ? -1 : 1,
      1,
      MathUtils.degToRad(bounded(options.stRotationDegree, -360, 360, 0)),
      0.5,
      0.5,
    )
    targetNames = new Set(options.targetNames.split(/[,，;；\n]+/).map(name => name.trim()).filter(Boolean))
  }

  function isReceiver(mesh: Mesh) {
    if (boundRoots === null && targetNames.size === 0) { return true }
    for (let ancestor: Object3D | null = mesh; ancestor; ancestor = ancestor.parent) {
      if (boundRoots ? boundRoots.has(ancestor) : targetNames.has(ancestor.name) || targetNames.has(ancestor.uuid)) { return true }
    }
    return false
  }

  function removeRecord(record: { overlay: Mesh | null, depth: Mesh | null }) {
    record.overlay?.removeFromParent()
    record.depth?.removeFromParent()
    // Geometries, skeletons and instance attributes belong to the host.
  }

  function syncTargets(scene: Scene, viewCamera?: Camera, ready = false) {
    const seen = new Set<Mesh>()
    receivers.length = 0
    materials.begin()
    function visit(object: Object3D) {
      if (!object.visible || object.userData[VIDEO_PROJECTION_INTERNAL]) { return }
      if ((object as Mesh).isMesh && !(object as Mesh & { isBatchedMesh?: boolean }).isBatchedMesh
        && (!viewCamera || viewCamera.layers.test(object.layers))) {
        const source = object as Mesh
        const sourceMaterials = Array.isArray(source.material) ? source.material : [source.material]
        const selected = isReceiver(source)
        if ((selected || options.enableOcclusion) && sourceMaterials.some(material => material.visible && material.opacity > 0)) {
          seen.add(source)
          let record = records.get(source)
          if (!record) {
            record = { overlay: null, depth: null }
            records.set(source, record)
          }
          const mapped = sourceMaterials.map(material => materials.get(material))
          const overlayMaterials = mapped.map(entry => entry.overlay)
          const depthMaterials = mapped.map(entry => entry.depth)
          if (selected) {
            receivers.push(source)
            if (!record.overlay) {
              record.overlay = makeProxy(source, overlayMaterials)
              overlays.add(record.overlay)
            }
            record.overlay.material = Array.isArray(source.material) ? overlayMaterials : overlayMaterials[0]
            record.overlay.visible = ready
            syncProxy(source, record.overlay)
          }
          else if (record.overlay) {
            record.overlay.removeFromParent()
            record.overlay = null
          }
          if (options.enableOcclusion) {
            if (!record.depth) {
              record.depth = makeProxy(source, depthMaterials)
              depthScene.add(record.depth)
            }
            record.depth.material = Array.isArray(source.material) ? depthMaterials : depthMaterials[0]
            syncProxy(source, record.depth)
          }
          else if (record.depth) {
            record.depth.removeFromParent()
            record.depth = null
          }
        }
      }
      for (const child of object.children) { visit(child) }
    }
    visit(scene)
    for (const [source, record] of records) {
      if (!seen.has(source)) { removeRecord(record); records.delete(source) }
    }
    materials.sweep()
  }

  function update(renderer: WebGLRenderer, scene: Scene, ready: boolean, viewCamera?: Camera) {
    if (disposed) { return }
    if (overlays.parent !== scene) { scene.add(overlays) }
    overlays.visible = options.enabled && isVisible(root)
    if (!overlays.visible) { return }
    scene.updateMatrixWorld(true)
    root.updateWorldMatrix(true, true)
    camera.updateWorldMatrix(true, false)
    helper.visible = options.showFrustum
    const canProject = ready && uniforms.projectorMap.value !== null && uniforms.projectorOpacity.value > 0
    syncTargets(scene, viewCamera, canProject)
    if (canProject && receivers.length > 0 && options.enableOcclusion) {
      uniforms.projectorDepthMap.value = depthCapture.capture(
        renderer,
        depthScene,
        camera,
        bounded(options.depthResolution, 128, 4096, 1024),
      )
    }
    if (uniforms.projectorReversedDepth.value !== camera.reversedDepth) { helper.update() }
    uniforms.projectorReversedDepth.value = camera.reversedDepth
    uniforms.projectorMatrix.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  }

  configure(options)

  return {
    root,
    camera,
    configure,
    update,
    setTexture: (texture: Texture | null) => { uniforms.projectorMap.value = texture },
    setTargets: (targets: Object3D | Object3D[] | null) => {
      boundRoots = targets === null ? null : new Set(Array.isArray(targets) ? targets : [targets])
    },
    getTargets: () => [...receivers],
    dispose: () => {
      if (disposed) { return }
      disposed = true
      for (const record of records.values()) { removeRecord(record) }
      records.clear()
      receivers.length = 0
      boundRoots = null
      overlays.removeFromParent()
      overlays.clear()
      helper.dispose()
      materials.dispose()
      depthCapture.dispose()
      uniforms.projectorMap.value = null
      uniforms.projectorDepthMap.value = null
      root.removeFromParent()
      root.clear()
    },
  }
}
