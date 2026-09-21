import { MeshPhysicalMaterial, MeshStandardMaterial, ShaderChunk } from 'three'
import contrastFragment from '../../shader/mechanicalFloorComponent/contrast.frag?raw'
import contrastParsFragment from '../../shader/mechanicalFloorComponent/contrast-pars.frag?raw'

export function createFloorMaterial(source: MeshStandardMaterial) {
  const material = new MeshPhysicalMaterial()
  MeshStandardMaterial.prototype.copy.call(material, source)
  material.defines = { STANDARD: '', PHYSICAL: '' }
  const textureContrast = { value: 1 }

  // Keep the uniform object stable so slider changes do not recompile the shader.
  material.onBeforeCompile = (shader) => {
    shader.uniforms.floorTextureContrast = textureContrast
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${contrastParsFragment}`)
      .replace('#include <map_fragment>', ShaderChunk.map_fragment.replace(
        'diffuseColor *= sampledDiffuseColor;',
        contrastFragment,
      ))
  }
  material.customProgramCacheKey = () => 'mechanical-floor-texture-contrast-v1'

  return { material, textureContrast }
}
