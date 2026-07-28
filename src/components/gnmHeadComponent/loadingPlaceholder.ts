import * as THREE from 'three'

const SEGMENTS = 64

export interface GNMHeadLoadingPlaceholder {
  readonly group: THREE.Group
  setProgress: (progress: number) => void
  setError: () => void
  dispose: () => void
}

class DefaultGNMHeadLoadingPlaceholder implements GNMHeadLoadingPlaceholder {
  readonly group = new THREE.Group()

  private readonly headGeometry = new THREE.IcosahedronGeometry(0.12, 2)
  private readonly trackGeometry = new THREE.RingGeometry(
    0.143,
    0.151,
    SEGMENTS,
  )

  private readonly progressGeometry = new THREE.RingGeometry(
    0.139,
    0.155,
    SEGMENTS,
  )

  private readonly headMaterial = new THREE.MeshBasicMaterial({
    color: '#63d9ff',
    wireframe: true,
    transparent: true,
    opacity: 0.32,
    depthTest: false,
    depthWrite: false,
  })

  private readonly trackMaterial = new THREE.MeshBasicMaterial({
    color: '#26384d',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.72,
    depthTest: false,
    depthWrite: false,
  })

  private readonly progressMaterial = new THREE.MeshBasicMaterial({
    color: '#63d9ff',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
    depthTest: false,
    depthWrite: false,
  })

  private disposed = false

  constructor() {
    const head = new THREE.Mesh(this.headGeometry, this.headMaterial)
    head.scale.set(0.78, 1.18, 0.86)

    const track = new THREE.Mesh(this.trackGeometry, this.trackMaterial)
    const progress = new THREE.Mesh(
      this.progressGeometry,
      this.progressMaterial,
    )
    track.position.z = 0.14
    progress.position.z = 0.141
    track.renderOrder = 100
    progress.renderOrder = 101
    head.renderOrder = 99

    this.progressGeometry.setDrawRange(0, 0)
    this.group.name = 'GNM Head Loading'
    this.group.position.y = 0.23
    this.group.add(head, track, progress)
  }

  setProgress(progress: number): void {
    if (this.disposed) { return }
    const normalized = THREE.MathUtils.clamp(
      Number.isFinite(progress) ? progress : 0,
      0,
      1,
    )
    const visibleSegments = Math.round(normalized * SEGMENTS)
    this.progressGeometry.setDrawRange(0, visibleSegments * 6)
  }

  setError(): void {
    if (this.disposed) { return }
    this.headMaterial.color.set('#ff5f6d')
    this.headMaterial.opacity = 0.55
    this.progressMaterial.color.set('#ff5f6d')
    this.progressGeometry.setDrawRange(0, SEGMENTS * 6)
  }

  dispose(): void {
    if (this.disposed) { return }
    this.disposed = true
    this.group.removeFromParent()
    this.group.clear()
    this.headGeometry.dispose()
    this.trackGeometry.dispose()
    this.progressGeometry.dispose()
    this.headMaterial.dispose()
    this.trackMaterial.dispose()
    this.progressMaterial.dispose()
  }
}

export function createGNMHeadLoadingPlaceholder(): GNMHeadLoadingPlaceholder {
  return new DefaultGNMHeadLoadingPlaceholder()
}
