import type { BufferGeometry, InstancedMesh, Material, Mesh, Object3D, Skeleton, SkinnedMesh, Texture } from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

export function disposeSubjects(roots: Object3D[]) {
  const geometries = new Set<BufferGeometry>()
  const materials = new Set<Material>()
  const textures = new Set<Texture>()
  const skeletons = new Set<Skeleton>()
  const bitmaps = new Set<ImageBitmap>()
  const instances = new Set<InstancedMesh>()
  for (const root of new Set(roots)) {
    root.removeFromParent()
    root.traverse((node) => {
      const mesh = node as Mesh
      if (mesh.geometry) { geometries.add(mesh.geometry) }
      if (mesh.material) {
        const entries = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        entries.forEach((material) => {
          materials.add(material)
          Object.values(material).forEach((value) => {
            if (value?.isTexture) { textures.add(value as Texture) }
          })
        })
      }
      if ((mesh as SkinnedMesh).isSkinnedMesh) { skeletons.add((mesh as SkinnedMesh).skeleton) }
      if ((mesh as InstancedMesh).isInstancedMesh) { instances.add(mesh as InstancedMesh) }
    })
  }
  instances.forEach(mesh => mesh.dispose())
  skeletons.forEach(skeleton => skeleton.dispose())
  geometries.forEach(geometry => geometry.dispose())
  materials.forEach(material => material.dispose())
  textures.forEach((texture) => {
    texture.dispose()
    const data = texture.source.data
    for (const entry of Array.isArray(data) ? data : [data]) {
      if (typeof ImageBitmap !== 'undefined' && entry instanceof ImageBitmap) { bitmaps.add(entry) }
    }
  })
  bitmaps.forEach(bitmap => bitmap.close())
}

export function disposeFireGLTF(gltf: GLTF) {
  disposeSubjects([gltf.scene, ...gltf.scenes].filter(Boolean) as unknown as Object3D[])
}
