import { BoxGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry, SphereGeometry } from 'three'
import type { Scene } from 'three'

export function createProjectionDemo(scene: Scene) {
  const group = new Group()
  group.name = 'video3DProjectionDemo'
  // Fixed scene placement, independent of the projector and its transform controls.
  group.position.set(0, 2.5, 3)
  const material = new MeshStandardMaterial({ color: '#d4e0eb', roughness: 0.85, metalness: 0 })
  const floor = new Mesh(new PlaneGeometry(5.8, 6), material)
  floor.name = 'projectionDemoFloor'
  floor.rotation.x = -Math.PI / 2
  floor.position.set(0, -2.5, -3.2)
  const wall = new Mesh(new PlaneGeometry(5.8, 3.4), material)
  wall.name = 'projectionDemoWall'
  wall.position.set(0, -0.8, -6.2)
  const box = new Mesh(new BoxGeometry(1.15, 2.1, 1.25), material)
  box.name = 'projectionDemoBox'
  box.position.set(-1, -1.45, -3.7)
  const sphere = new Mesh(new SphereGeometry(0.85, 40, 24), material)
  sphere.name = 'projectionDemoSphere'
  sphere.position.set(1, -1.65, -4.2)
  group.add(floor, wall, box, sphere)
  scene.add(group)
  return {
    group,
    dispose: () => {
      group.removeFromParent()
      for (const mesh of [floor, wall, box, sphere]) { mesh.geometry.dispose() }
      material.dispose()
      group.clear()
    },
  }
}
