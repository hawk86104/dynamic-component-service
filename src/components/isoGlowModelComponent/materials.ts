import {
  AdditiveBlending,
  BackSide,
  Color,
  DoubleSide,
  GreaterDepth,
  LineDashedMaterial,
  MeshStandardMaterial,
  NormalBlending,
  ShaderChunk,
  ShaderMaterial,
  Vector2,
  Vector4,
} from 'three'
import type { Material, WebGLRenderer } from 'three'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import surfacePars from '../../shader/isoGlowModelComponent/surface-pars.frag?raw'
import surfaceFragment from '../../shader/isoGlowModelComponent/surface.frag?raw'
import outlineVertex from '../../shader/isoGlowModelComponent/outline.vert?raw'
import outlineFragment from '../../shader/isoGlowModelComponent/outline.frag?raw'
import type { IsoGlowStyle } from './defaults'

/** Materials and uniforms are owned per model, never by the host scene. */
export function createIsoGlowMaterials(modelSize: number) {
  const surfaces = new Map<Material, MeshStandardMaterial>()
  const uniforms = {
    isoStyleMode: { value: 0 },
    isoEdgeColor: { value: new Color() },
    isoGlowColor: { value: new Color() },
    isoGlowIntensity: { value: 0 },
  }
  const edges = new LineMaterial({ linewidth: 1, transparent: true, depthWrite: false, toneMapped: false, alphaToCoverage: true })
  const hiddenEdges = new LineDashedMaterial({
    transparent: true,
    depthWrite: false,
    depthFunc: GreaterDepth,
    dashSize: modelSize * 0.012,
    gapSize: modelSize * 0.008,
    toneMapped: false,
  })
  const outline = new ShaderMaterial({
    vertexShader: outlineVertex,
    fragmentShader: outlineFragment,
    uniforms: {
      isoViewport: { value: new Vector2(1, 1) },
      isoOutlineWidth: { value: 0.9 },
      isoOutlineColor: { value: new Color() },
      isoOutlineOpacity: { value: 1 },
    },
    side: BackSide,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: 2,
    toneMapped: false,
    clipping: true,
  })
  const viewport = new Vector4()

  function surfaceFor(source: Material) {
    let material = surfaces.get(source)
    if (!material) {
      const original = source as MeshStandardMaterial
      material = new MeshStandardMaterial({
        name: `${source.name || 'material'}__isoGlowSurface`,
        side: source.side,
        alphaTest: source.alphaTest,
        alphaMap: original.alphaMap ?? null,
        map: source.alphaTest > 0 || source.transparent ? original.map ?? null : null,
        emissiveMap: original.emissiveMap ?? null,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      })
      material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms)
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', `#include <common>\n${surfacePars}`)
          .replace('#include <map_fragment>', ShaderChunk.map_fragment.replace(
            'diffuseColor *= sampledDiffuseColor;',
            'diffuseColor.a *= sampledDiffuseColor.a;',
          ))
          .replace('#include <opaque_fragment>', `${surfaceFragment}\n#include <opaque_fragment>`)
      }
      material.customProgramCacheKey = () => 'iso-glow-surface-v2'
      surfaces.set(source, material)
    }
    return material
  }

  function update(style: IsoGlowStyle) {
    const blueprint = style.stylePreset === 'blueprint'
    const xray = style.stylePreset === 'x-ray'
    uniforms.isoStyleMode.value = xray ? 2 : blueprint ? 1 : 0
    uniforms.isoEdgeColor.value.set(style.edgeColor)
    uniforms.isoGlowColor.value.set(style.emissiveColor)
    uniforms.isoGlowIntensity.value = style.emissiveIntensity
    surfaces.forEach((material, source) => {
      const original = source as MeshStandardMaterial
      const transparent = style.surfaceOpacity * source.opacity < 1 || source.transparent || xray
      const side = xray ? DoubleSide : source.side
      const blending = xray ? AdditiveBlending : NormalBlending
      if (material.transparent !== transparent || material.side !== side || material.blending !== blending || material.flatShading !== blueprint) {
        material.needsUpdate = true
      }
      // Retain material-to-material tonal separation without keeping colour textures.
      const luminance = original.color
        ? original.color.r * 0.2126 + original.color.g * 0.7152 + original.color.b * 0.0722
        : 0.5
      const tone = 0.72 + Math.sqrt(Math.max(0, luminance)) * 0.58
      const emissive = original.emissive
      const luminous = (emissive && Math.max(emissive.r, emissive.g, emissive.b) > 0 && original.emissiveIntensity > 0)
        || /emiss|head.?light|tail.?light|lamp|bulb|display|(?:^|[_.\s-])(?:led|screen)(?:$|[_.\s-])/i.test(source.name)
      material.color.set(style.surfaceColor).multiplyScalar(tone)
      material.emissive.set(style.emissiveColor)
      material.emissiveIntensity = luminous ? style.emissiveIntensity : 0
      material.opacity = style.surfaceOpacity * source.opacity
      material.transparent = transparent
      material.side = side
      material.blending = blending
      material.flatShading = blueprint
      material.depthTest = true
      material.depthWrite = !transparent
      material.roughness = 0.9
      material.metalness = 0.05
      material.envMapIntensity = 0.1
    })
    edges.color.set(style.edgeColor).multiplyScalar(blueprint ? 1.6 : xray ? 2 : 0.78)
    edges.opacity = style.edgeOpacity * (xray ? 0.55 : 1)
    edges.linewidth = blueprint ? 1.1 : 0.85
    edges.blending = xray ? AdditiveBlending : NormalBlending
    hiddenEdges.color.set(style.edgeColor)
    hiddenEdges.opacity = style.edgeOpacity * 0.28
    outline.uniforms.isoOutlineColor.value.set(style.edgeColor)
    outline.uniforms.isoOutlineOpacity.value = style.edgeOpacity
  }

  return {
    edges,
    hiddenEdges,
    outline,
    surfaceFor,
    update,
    updateViewport(renderer: WebGLRenderer) {
      renderer.getViewport(viewport)
      outline.uniforms.isoViewport.value.set(Math.max(viewport.z, 1), Math.max(viewport.w, 1))
    },
    dispose() {
      surfaces.forEach(material => material.dispose())
      surfaces.clear()
      edges.dispose()
      hiddenEdges.dispose()
      outline.dispose()
    },
  }
}
