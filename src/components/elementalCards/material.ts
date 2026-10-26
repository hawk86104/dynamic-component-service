import * as THREE from 'three'
import commonShader from '../../shader/elementalCards/common.glsl?raw'
import type { Uniforms } from './types'

export function createElementMaterial(vertexShader: string, fragmentShader: string, uniforms: Uniforms, options: THREE.ShaderMaterialParameters = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: vertexShader.replace('#include <elemental_common>', commonShader),
    fragmentShader: fragmentShader.replace('#include <elemental_common>', commonShader),
    uniforms,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    clipping: true,
    ...options,
  })
}
