import { MeshBasicMaterial, MeshDepthMaterial, RGBADepthPacking } from 'three'
import type { Material, Texture } from 'three'
import projectionVertexPars from '../../shader/video3DProjectionComponent/projection-pars.vert?raw'
import projectionVertex from '../../shader/video3DProjectionComponent/projection.vert?raw'
import projectionFragmentPars from '../../shader/video3DProjectionComponent/projection-pars.frag?raw'
import projectionFragment from '../../shader/video3DProjectionComponent/projection.frag?raw'

type SurfaceMaterial = Material & { map?: Texture | null, alphaMap?: Texture | null, wireframe?: boolean }
type ProjectionUniforms = Record<string, { value: unknown }>

export function createProjectionMaterials(uniforms: ProjectionUniforms) {
  const cache = new Map<Material, { overlay: MeshBasicMaterial, depth: MeshDepthMaterial }>()
  const used = new Set<Material>()

  function sync(source: SurfaceMaterial, target: MeshBasicMaterial | MeshDepthMaterial) {
    const map = source.map ?? null
    const alphaMap = source.alphaMap ?? null
    if (target.map !== map || target.alphaMap !== alphaMap || target.side !== source.side
      || (target.alphaTest > 0) !== (source.alphaTest > 0) || target.alphaHash !== source.alphaHash) {
      target.needsUpdate = true
    }
    target.map = map
    target.alphaMap = alphaMap
    target.side = source.side
    target.alphaTest = source.alphaTest
    target.alphaHash = source.alphaHash
    target.opacity = source.opacity
    target.visible = source.visible && source.opacity > 0
    target.wireframe = source.wireframe ?? false
    target.clippingPlanes = source.clippingPlanes
    target.clipIntersection = source.clipIntersection
  }

  function get(source: Material) {
    used.add(source)
    let entry = cache.get(source)
    if (!entry) {
      const overlay = new MeshBasicMaterial({
        transparent: true,
        depthTest: true,
        depthWrite: false,
        toneMapped: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -4,
      })
      overlay.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms)
        shader.vertexShader = shader.vertexShader
          .replace('void main() {', `${projectionVertexPars}\nvoid main() {`)
          .replace('#include <project_vertex>', `#include <project_vertex>\n${projectionVertex}`)
        shader.fragmentShader = shader.fragmentShader
          .replace('void main() {', `${projectionFragmentPars}\nvoid main() {`)
          .replace('#include <opaque_fragment>', projectionFragment)
      }
      overlay.customProgramCacheKey = () => 'video-3d-projection-v1'
      const depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, toneMapped: false })
      entry = { overlay, depth }
      cache.set(source, entry)
    }
    sync(source, entry.overlay)
    sync(source, entry.depth)
    return entry
  }

  function sweep() {
    for (const [source, entry] of cache) {
      if (!used.has(source)) {
        entry.overlay.dispose()
        entry.depth.dispose()
        cache.delete(source)
      }
    }
  }

  return {
    begin: () => used.clear(),
    get,
    sweep,
    dispose: () => { used.clear(); sweep() },
  }
}
