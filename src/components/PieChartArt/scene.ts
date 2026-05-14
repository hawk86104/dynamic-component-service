/*
 * @Description: 
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2026-05-14 09:31:33
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2026-05-14 10:44:30
 */
import type * as THREE from 'three'

function disposeMaterial(material: THREE.Material) {
  const maybeMap = (material as THREE.Material & { map?: THREE.Texture | null }).map

  if (maybeMap) {
    maybeMap.dispose()
  }

  material.dispose()
}

export function disposeObject3D(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Object3D & {
      geometry?: THREE.BufferGeometry
      material?: THREE.Material | THREE.Material[]
    }

    mesh.geometry?.dispose()

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(disposeMaterial)
    }
    else {
      mesh.material && disposeMaterial(mesh.material)
    }
  })
}

export function clearGroup(group: THREE.Group) {
  while (group.children.length) {
    const child = group.children[0] as any
    group.remove(child)
    disposeObject3D(child)
  }
}
