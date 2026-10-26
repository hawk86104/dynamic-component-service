import type { RibbonAreaOptions } from './defaults'
import * as THREE from 'three'

export type RibbonAppearance = Pick<RibbonAreaOptions, 'width' | 'height' | 'ribbonWidth' | 'bevel' | 'opacity' | 'sideOpacity' | 'reflectionStrength' | 'roughness' | 'sideColor' | 'sideGradient' | 'glowIntensity' | 'outlineWidth'>

export function createRibbonGlassMaterial(style: RibbonAppearance, colors: string[], shaders: { vertexShader: string, fragmentShader: string }) {
  const transparent = style.opacity < 1 || style.sideOpacity < 1
  return new THREE.ShaderMaterial({
    ...shaders,
    uniforms: {
      uWidth: { value: style.width },
      uHeight: { value: style.height },
      uDepth: { value: style.ribbonWidth },
      uStart: { value: new THREE.Color(colors[0]) },
      uMiddle: { value: new THREE.Color(colors[1]) },
      uEnd: { value: new THREE.Color(colors[2]) },
      uSideColor: { value: new THREE.Color(style.sideColor) },
      uSideGradient: { value: style.sideGradient },
      uSideOpacity: { value: style.sideOpacity },
      uOpacity: { value: style.opacity },
      uGlow: { value: style.glowIntensity },
      uReflectionStrength: { value: style.reflectionStrength },
      uRoughness: { value: style.roughness },
    },
    transparent,
    depthWrite: !transparent,
    side: transparent ? THREE.DoubleSide : THREE.FrontSide,
    forceSinglePass: false,
    toneMapped: false,
  })
}

/** Native diffuse color is authoritative for every visible side wall and end cap. */
export function createRibbonSideMaterial(style: RibbonAppearance, shaders: { vertexShader: string, fragmentShader: string }) {
  const transparent = style.opacity < 1 || style.sideOpacity < 1
  const material = new THREE.MeshBasicMaterial({
    color: style.sideColor,
    vertexColors: true,
    fog: false,
    opacity: style.opacity * style.sideOpacity,
    transparent,
    depthWrite: !transparent,
    side: transparent ? THREE.DoubleSide : THREE.FrontSide,
    forceSinglePass: false,
    toneMapped: false,
  })
  material.name = 'RibbonSideGlass'
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRibbonSideReflection = { value: style.reflectionStrength }
    shader.uniforms.uRibbonSideRoughness = { value: style.roughness }
    shader.vertexShader = shader.vertexShader.replace('void main() {', 'void ribbonSideBaseMain() {') + shaders.vertexShader
    shader.fragmentShader = shader.fragmentShader.replace('void main() {', 'void ribbonSideBaseMain() {') + shaders.fragmentShader
  }
  material.customProgramCacheKey = () => `ribbon-side-native:${shaders.vertexShader}:${shaders.fragmentShader}`
  return material
}
