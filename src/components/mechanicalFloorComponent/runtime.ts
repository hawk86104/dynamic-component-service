import { Box3, Color, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Texture, Vector3 } from 'three'
import type { BufferGeometry, Material, MeshPhysicalMaterial } from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { bounded, MECHANICAL_FLOOR_DEFAULTS as defaults } from './defaults'
import type { FloorOptions } from './defaults'
import { createFloorMaterial } from './material'

// floor.glb is a 5 m module; its 4.996 m geometry leaves the intended seam.
const TILE_PITCH = 5
const CHUNK_SIZE = 4
const MAX_REPEAT = 32

export function disposeSource(scene: GLTF['scene']) {
  const geometries = new Set<BufferGeometry>()
  const materials = new Set<Material>()
  const textures = new Set<Texture>()
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) { return }
    geometries.add(object.geometry)
    const entries = Array.isArray(object.material) ? object.material : [object.material]
    entries.forEach((material) => {
      materials.add(material)
      Object.values(material).forEach((value) => {
        if (value instanceof Texture) { textures.add(value) }
      })
    })
  })
  geometries.forEach(geometry => geometry.dispose())
  materials.forEach(material => material.dispose())
  textures.forEach((texture) => {
    texture.dispose()
    const image = texture.source.data
    if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) { image.close() }
  })
}

export function createFloorRuntime(scene: GLTF['scene']) {
  const group = new Group()
  const parts: {
    geometry: BufferGeometry
    material: MeshPhysicalMaterial
    baseColor: Color
    textureContrast: { value: number }
  }[] = []
  scene.updateMatrixWorld(true)
  const bounds = new Box3().setFromObject(scene)
  const center = bounds.getCenter(new Vector3())
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) { return }
    // The supplied asset has one static primitive and one PBR material.
    if (!(object.material instanceof MeshStandardMaterial)) { return }
    const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld)
    geometry.translate(-center.x, -bounds.max.y, -center.z)
    const { material, textureContrast } = createFloorMaterial(object.material)
    parts.push({ geometry, material, textureContrast, baseColor: material.color.clone() })
  })
  if (!parts.length) { throw new Error('floor.glb has no supported static PBR meshes') }

  function clearInstances() {
    group.children.slice().forEach((object) => {
      group.remove(object)
      if (object instanceof InstancedMesh) { object.dispose() }
    })
  }

  function setLayout(width: number, length: number) {
    clearInstances()
    const columns = Math.floor(bounded(width, 1, MAX_REPEAT, defaults.repeatWidth))
    const rows = Math.floor(bounded(length, 1, MAX_REPEAT, defaults.repeatLength))
    const matrix = new Matrix4()
    // Small spatial batches retain frustum culling without per-frame CPU work.
    for (let z = 0; z < rows; z += CHUNK_SIZE) {
      for (let x = 0; x < columns; x += CHUNK_SIZE) {
        const nx = Math.min(CHUNK_SIZE, columns - x)
        const nz = Math.min(CHUNK_SIZE, rows - z)
        parts.forEach(({ geometry, material }) => {
          const mesh = new InstancedMesh(geometry, material, nx * nz)
          mesh.position.set((x - (columns - 1) / 2) * TILE_PITCH, 0, (z - (rows - 1) / 2) * TILE_PITCH)
          mesh.receiveShadow = true
          for (let iz = 0; iz < nz; iz++) {
            for (let ix = 0; ix < nx; ix++) {
              matrix.makeTranslation(ix * TILE_PITCH, 0, iz * TILE_PITCH)
              mesh.setMatrixAt(iz * nx + ix, matrix)
            }
          }
          mesh.instanceMatrix.needsUpdate = true
          mesh.computeBoundingBox()
          mesh.computeBoundingSphere()
          group.add(mesh)
        })
      }
    }
  }

  function setMaterial(options: FloorOptions) {
    const tint = new Color(options.color)
    parts.forEach(({ material, baseColor, textureContrast }) => {
      material.color.copy(baseColor).multiply(tint)
      textureContrast.value = bounded(options.textureContrast, 0, 2, defaults.textureContrast)
      material.emissiveIntensity = bounded(options.emissiveIntensity, 0, 10, defaults.emissiveIntensity)
      material.roughness = bounded(options.roughness, 0, 1, defaults.roughness)
      material.metalness = bounded(options.metalness, 0, 1, defaults.metalness)
      material.specularIntensity = bounded(options.reflectivity, 0, 1, defaults.reflectivity)
      material.ior = bounded(options.ior, 1, 2.333, defaults.ior)
      material.envMapIntensity = bounded(options.envMapIntensity, 0, 5, defaults.envMapIntensity)
    })
  }

  return {
    group,
    setLayout,
    setMaterial,
    dispose() {
      clearInstances()
      parts.forEach(({ geometry, material }) => {
        geometry.dispose()
        material.dispose()
      })
      disposeSource(scene)
    },
  }
}
