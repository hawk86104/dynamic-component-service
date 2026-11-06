import * as THREE from 'three'
import type { PixelFxMeta } from '../../vendor/pixelfx/core/fx.js'
import type { PixelFxRenderMode } from './types'

export function createPixelFxPresentation(texture: THREE.Texture, meta: PixelFxMeta) {
  const [pixelWidth, pixelHeight] = meta.size
  const [originX, originY] = meta.origin
  const object = new THREE.Group()
  object.name = `PixelFX:${meta.name}`

  const geometry = new THREE.PlaneGeometry(1, 1)
  const pivotX = originX / pixelWidth
  const pivotY = 1 - originY / pixelHeight
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  })
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
  })
  const mesh = new THREE.Mesh(geometry, material)
  const plane = new THREE.Group()
  plane.add(mesh)
  const sprite = new THREE.Sprite(spriteMaterial)
  object.add(plane, sprite)

  const direction = new THREE.Vector3()
  const worldToLocal = new THREE.Matrix4()
  let renderMode: PixelFxRenderMode = 'billboard'

  function setMode(mode: PixelFxRenderMode): void {
    renderMode = ['billboard', 'sprite', 'vertical', 'ground'].includes(mode) ? mode : 'billboard'
    mesh.visible = renderMode !== 'sprite'
    sprite.visible = renderMode === 'sprite'
    plane.rotation.set(renderMode === 'ground' ? -Math.PI / 2 : 0, 0, 0)
  }

  function setAppearance(width: number, opacity: number, mirror = false): void {
    const safeWidth = Number.isFinite(width) ? THREE.MathUtils.clamp(width, 0.1, 50) : 4
    const safeOpacity = Number.isFinite(opacity) ? THREE.MathUtils.clamp(opacity, 0, 1) : 1
    const height = safeWidth * pixelHeight / pixelWidth
    const centerX = mirror ? 1 - pivotX : pivotX
    mesh.scale.set(safeWidth, height, 1)
    mesh.position.set((0.5 - centerX) * safeWidth, (0.5 - pivotY) * height, 0)
    sprite.scale.set(safeWidth, height, 1)
    sprite.center.set(centerX, pivotY)
    texture.repeat.x = mirror ? -1 : 1
    texture.offset.x = mirror ? 1 : 0
    texture.updateMatrix()
    material.opacity = safeOpacity
    spriteMaterial.opacity = safeOpacity
  }

  function faceCamera(camera: THREE.Camera): void {
    if (renderMode !== 'billboard') {
      return
    }
    if ((camera as THREE.OrthographicCamera).isOrthographicCamera) {
      object.updateWorldMatrix(true, false)
      worldToLocal.copy(object.matrixWorld).invert()
      camera.getWorldDirection(direction).negate().transformDirection(worldToLocal)
    }
    else {
      object.worldToLocal(camera.getWorldPosition(direction))
    }
    if (Math.hypot(direction.x, direction.z) > 1e-8) {
      plane.rotation.y = Math.atan2(direction.x, direction.z)
    }
  }

  function dispose(): void {
    object.removeFromParent()
    object.clear()
    geometry.dispose()
    material.dispose()
    spriteMaterial.dispose()
  }

  setMode('billboard')
  setAppearance(4, 1)
  return { object, setMode, setAppearance, faceCamera, dispose }
}
