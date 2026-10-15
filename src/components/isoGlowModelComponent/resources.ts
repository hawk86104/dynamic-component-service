import type { BufferGeometry, Material, Object3D, Skeleton, Texture } from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

type ResourceObject = Object3D & {
  geometry?: BufferGeometry
  material?: Material | Material[]
  skeleton?: Skeleton
  isInstancedMesh?: boolean
  dispose?: () => void
}

const disposedModels = new WeakSet<GLTF>()

/** Clone-specific buffers are owned independently of shared source geometry. */
export function disposeObjectBuffers(root: Object3D | GLTF['scene']) {
  const skeletons = new Set<Skeleton>()
  root.traverse((node) => {
    const object = node as ResourceObject
    if (object.skeleton) { skeletons.add(object.skeleton) }
    if (object.isInstancedMesh) { object.dispose?.() }
  })
  skeletons.forEach(skeleton => skeleton.dispose())
}

/** Dispose every GLTF scene, deduplicating resources shared across nodes/scenes. */
export function disposeIsoGlowGLTF(gltf: GLTF) {
  if (disposedModels.has(gltf)) { return }
  disposedModels.add(gltf)
  const geometries = new Set<BufferGeometry>()
  const materials = new Set<Material>()
  const textures = new Set<Texture>()
  const images = new Set<ImageBitmap>()
  const scenes = new Set([gltf.scene, ...gltf.scenes].filter(Boolean))

  scenes.forEach((scene) => {
    scene.removeFromParent()
    scene.traverse((node) => {
      const object = node as ResourceObject
      if (object.geometry) { geometries.add(object.geometry) }
      const entries = object.material
        ? (Array.isArray(object.material) ? object.material : [object.material])
        : []
      entries.forEach((material) => {
        materials.add(material)
        Object.values(material).forEach((value) => {
          if (value?.isTexture) { textures.add(value as Texture) }
        })
      })
    })
    disposeObjectBuffers(scene)
  })
  geometries.forEach(geometry => geometry.dispose())
  materials.forEach(material => material.dispose())
  textures.forEach((texture) => {
    texture.dispose()
    const data = texture.source.data
    const entries = Array.isArray(data) ? data : [data]
    entries.forEach((entry) => {
      if (typeof ImageBitmap !== 'undefined' && entry instanceof ImageBitmap) { images.add(entry) }
    })
  })
  images.forEach(bitmap => bitmap.close())
}
