import * as THREE from 'three'
import type { GNMHeadModel } from './gnmModel.js'
import type {
  GNMHeadMaterialOptions,
  GNMHeadPose,
  GNMHeadVisibility,
} from './types'

const BASE_MATERIAL_COLORS = [
  '#d9a183',
  '#f2eddc',
  '#c4726b',
  '#b44f48',
  '#f4f2ec',
  '#5d4630',
  '#100e0d',
] as const

function safeColor(value: string, fallback: string): THREE.Color {
  const color = new THREE.Color(fallback)
  try {
    color.set(value)
  }
  catch {
    color.set(fallback)
  }
  return color
}

function eulerDegreesToAxisAngle(
  pitch: number,
  yaw: number,
  roll: number,
): [number, number, number] {
  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(pitch),
    THREE.MathUtils.degToRad(yaw),
    THREE.MathUtils.degToRad(roll),
    'XYZ',
  )
  const quaternion = new THREE.Quaternion().setFromEuler(euler).normalize()
  const angle = 2 * Math.acos(THREE.MathUtils.clamp(quaternion.w, -1, 1))
  const denominator = Math.sqrt(Math.max(0, 1 - quaternion.w * quaternion.w))

  if (denominator < 1e-6 || angle < 1e-6) {
    return [0, 0, 0]
  }

  return [
    quaternion.x / denominator * angle,
    quaternion.y / denominator * angle,
    quaternion.z / denominator * angle,
  ]
}

export interface GNMHeadRuntime {
  readonly group: THREE.Group
  readonly model: GNMHeadModel
  setMaterial: (options: GNMHeadMaterialOptions) => void
  setPose: (pose: GNMHeadPose) => void
  setVisibility: (visibility: GNMHeadVisibility) => void
  refresh: () => void
  dispose: () => void
}

class DefaultGNMHeadRuntime implements GNMHeadRuntime {
  readonly group = new THREE.Group()
  readonly geometry = new THREE.BufferGeometry()
  readonly skinMaterial: THREE.MeshStandardMaterial
  readonly anatomyMaterial: THREE.MeshStandardMaterial
  readonly mesh: THREE.Mesh
  readonly positionAttribute: THREE.BufferAttribute
  readonly colorAttribute: THREE.BufferAttribute
  readonly indexAttribute: THREE.BufferAttribute

  private disposed = false
  private materialOptions: GNMHeadMaterialOptions
  private visibility: GNMHeadVisibility = {
    eyes: true,
    teethGums: true,
    tongue: true,
  }

  constructor(
    readonly model: GNMHeadModel,
    materialOptions: GNMHeadMaterialOptions,
  ) {
    this.materialOptions = materialOptions

    this.positionAttribute = new THREE.BufferAttribute(
      new Float32Array(model.numVertices * 3),
      3,
    )
    this.positionAttribute.setUsage(THREE.DynamicDrawUsage)
    this.geometry.setAttribute('position', this.positionAttribute)
    this.colorAttribute = new THREE.BufferAttribute(
      this.buildMaterialColors(),
      3,
    )
    this.geometry.setAttribute('color', this.colorAttribute)
    this.indexAttribute = new THREE.BufferAttribute(
      new Uint16Array(model.triangles),
      1,
    )
    this.indexAttribute.setUsage(THREE.DynamicDrawUsage)
    this.geometry.setIndex(this.indexAttribute)
    this.geometry.setDrawRange(0, model.triangles.length)

    const sharedMaterialOptions = {
      vertexColors: true,
      roughness: materialOptions.roughness,
      metalness: materialOptions.metalness,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    }
    this.skinMaterial = new THREE.MeshStandardMaterial({
      ...sharedMaterialOptions,
      opacity: materialOptions.skinOpacity,
      transparent: materialOptions.skinOpacity < 1,
      depthWrite: materialOptions.skinOpacity >= 1,
    })
    this.anatomyMaterial = new THREE.MeshStandardMaterial({
      ...sharedMaterialOptions,
      opacity: 1,
      transparent: false,
      depthWrite: true,
    })

    this.mesh = new THREE.Mesh(
      this.geometry,
      [this.skinMaterial, this.anatomyMaterial],
    )
    this.mesh.name = 'GNM Head'
    this.mesh.frustumCulled = false
    this.group.name = 'GNM Head Component'
    this.group.add(this.mesh)
    this.refresh()
  }

  private buildMaterialColors(): Float32Array {
    const palette = BASE_MATERIAL_COLORS.map(color => new THREE.Color(color))
    palette[0] = safeColor(
      this.materialOptions.skinColor,
      BASE_MATERIAL_COLORS[0],
    )
    palette[5] = safeColor(
      this.materialOptions.irisColor,
      BASE_MATERIAL_COLORS[5],
    )

    const colors = new Float32Array(this.model.numVertices * 3)
    for (let vertex = 0; vertex < this.model.numVertices; ++vertex) {
      const color = palette[this.model.materialId[vertex]] ?? palette[0]
      colors[vertex * 3] = color.r
      colors[vertex * 3 + 1] = color.g
      colors[vertex * 3 + 2] = color.b
    }
    return colors
  }

  setMaterial(options: GNMHeadMaterialOptions): void {
    if (this.disposed) { return }

    const colorsChanged = options.skinColor !== this.materialOptions.skinColor
      || options.irisColor !== this.materialOptions.irisColor
    this.materialOptions = options

    if (colorsChanged) {
      ;(this.colorAttribute.array as Float32Array).set(
        this.buildMaterialColors(),
      )
      this.colorAttribute.needsUpdate = true
    }

    this.skinMaterial.roughness = options.roughness
    this.skinMaterial.metalness = options.metalness
    this.skinMaterial.opacity = options.skinOpacity
    this.skinMaterial.transparent = options.skinOpacity < 1
    this.skinMaterial.depthWrite = options.skinOpacity >= 1
    this.skinMaterial.needsUpdate = true

    this.anatomyMaterial.roughness = options.roughness
    this.anatomyMaterial.metalness = options.metalness
    this.anatomyMaterial.opacity = 1
    this.anatomyMaterial.transparent = false
    this.anatomyMaterial.depthWrite = true
    this.anatomyMaterial.needsUpdate = true
  }

  setPose(pose: GNMHeadPose): void {
    if (this.disposed) { return }

    const head = eulerDegreesToAxisAngle(
      pose.headPitch,
      pose.headYaw,
      pose.headRoll,
    )
    const eyes = eulerDegreesToAxisAngle(
      pose.eyePitch,
      pose.eyeYaw,
      0,
    )

    this.model.setJointRotation(0, 0, 0, 0)
    this.model.setJointRotation(1, head[0], head[1], head[2])
    this.model.setJointRotation(2, eyes[0], eyes[1], eyes[2])
    this.model.setJointRotation(3, eyes[0], eyes[1], eyes[2])
  }

  setVisibility(visibility: GNMHeadVisibility): void {
    if (this.disposed) { return }
    this.visibility = visibility
    this.updateIndexVisibility()
  }

  private updateIndexVisibility(): void {
    const index = this.indexAttribute.array as Uint16Array
    const componentNames = this.model.meta.componentNames
    const isVisible = (componentIndex: number): boolean => {
      const name = componentNames[componentIndex]
      if (name === 'left_eye' || name === 'right_eye') {
        return this.visibility.eyes
      }
      if (
        name === 'upper_teeth_and_gums'
        || name === 'lower_teeth_and_gums'
      ) {
        return this.visibility.teethGums
      }
      if (name === 'tongue') {
        return this.visibility.tongue
      }
      return true
    }

    let outputOffset = 0
    const appendTriangles = (skinPass: boolean): void => {
      for (
        let triangleOffset = 0;
        triangleOffset < this.model.triangles.length;
        triangleOffset += 3
      ) {
        const firstVertex = this.model.triangles[triangleOffset]
        const componentIndex = this.model.componentId[firstVertex]
        const isSkin = componentNames[componentIndex] === 'skin'
        if (isSkin !== skinPass || !isVisible(componentIndex)) { continue }
        index[outputOffset++] = firstVertex
        index[outputOffset++] = this.model.triangles[triangleOffset + 1]
        index[outputOffset++] = this.model.triangles[triangleOffset + 2]
      }
    }

    appendTriangles(true)
    const skinIndexCount = outputOffset
    appendTriangles(false)
    const anatomyIndexCount = outputOffset - skinIndexCount

    this.indexAttribute.needsUpdate = true
    this.geometry.setDrawRange(0, outputOffset)
    this.geometry.clearGroups()
    if (skinIndexCount > 0) {
      this.geometry.addGroup(0, skinIndexCount, 0)
    }
    if (anatomyIndexCount > 0) {
      this.geometry.addGroup(skinIndexCount, anatomyIndexCount, 1)
    }
  }

  refresh(): void {
    if (this.disposed) { return }

    this.model.computeVertices(
      this.positionAttribute.array as Float32Array,
    )
    this.positionAttribute.needsUpdate = true
    ;(this.indexAttribute.array as Uint16Array).set(this.model.triangles)
    this.geometry.setDrawRange(0, this.model.triangles.length)
    this.geometry.computeVertexNormals()
    this.updateIndexVisibility()
    this.geometry.computeBoundingSphere()
  }

  dispose(): void {
    if (this.disposed) { return }
    this.disposed = true
    this.group.removeFromParent()
    this.group.remove(this.mesh)
    this.geometry.dispose()
    this.skinMaterial.dispose()
    this.anatomyMaterial.dispose()
  }
}

export function createGNMHeadRuntime(
  model: GNMHeadModel,
  materialOptions: GNMHeadMaterialOptions,
): GNMHeadRuntime {
  return new DefaultGNMHeadRuntime(model, materialOptions)
}
