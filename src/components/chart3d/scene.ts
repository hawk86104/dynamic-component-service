import * as THREE from 'three'

export function clearChart(group: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  group.traverse((object) => {
    const renderable = object as THREE.Mesh
    if (renderable.geometry) {
      geometries.add(renderable.geometry)
    }
    const entries = Array.isArray(renderable.material) ? renderable.material : [renderable.material]
    entries.filter(Boolean).forEach((material) => {
      materials.add(material)
      const map = (material as THREE.SpriteMaterial).map
      if (map) {
        textures.add(map)
      }
    })
  })
  group.clear()
  textures.forEach(texture => texture.dispose())
  materials.forEach(material => material.dispose())
  geometries.forEach(geometry => geometry.dispose())
}

export function roundedRectangle(width: number, height: number, radius: number) {
  const x = -width / 2
  const y = -height / 2
  const r = Math.min(radius, width / 2, height / 2)
  const shape = new THREE.Shape()
  shape.moveTo(x + r, y)
  shape.lineTo(x + width - r, y)
  shape.quadraticCurveTo(x + width, y, x + width, y + r)
  shape.lineTo(x + width, y + height - r)
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  shape.lineTo(x + r, y + height)
  shape.quadraticCurveTo(x, y + height, x, y + height - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)
  shape.closePath()
  return shape
}

interface StageOptions {
  width: number
  depth: number
  baseColor: string
  gridColor: string
  showBase: boolean
  showGrid: boolean
  round?: boolean
}

export function addStage(group: THREE.Group, options: StageOptions) {
  const { width, depth, baseColor, gridColor, showBase, showGrid, round } = options
  if (showBase) {
    const geometry = round
      ? new THREE.CylinderGeometry(width / 2, width / 2, 0.18, 96)
      : new THREE.ExtrudeGeometry(roundedRectangle(width, depth, 0.22), { depth: 0.18, bevelEnabled: false, curveSegments: 12 })
    if (!round) {
      geometry.rotateX(-Math.PI / 2)
    }
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: 0.35,
      roughness: 0.32,
    }))
    mesh.position.y = round ? 0.09 : 0
    mesh.receiveShadow = true
    mesh.name = 'ChartPlinth'
    group.add(mesh)
  }
  if (showGrid) {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(width + 0.9, depth + 0.9),
      new THREE.MeshBasicMaterial({ color: '#060d16', transparent: true, opacity: 0.86, side: THREE.DoubleSide }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.025
    group.add(floor)
    const points: THREE.Vector3[] = []
    for (let index = 0; index <= 10; index++) {
      const x = (index / 10 - 0.5) * (width + 0.9)
      const z = (index / 10 - 0.5) * (depth + 0.9)
      points.push(new THREE.Vector3(x, -0.02, -(depth + 0.9) / 2), new THREE.Vector3(x, -0.02, (depth + 0.9) / 2))
      points.push(new THREE.Vector3(-(width + 0.9) / 2, -0.02, z), new THREE.Vector3((width + 0.9) / 2, -0.02, z))
    }
    group.add(new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: gridColor, transparent: true, opacity: 0.35, depthWrite: false }),
    ))
  }
}

export function addLine(group: THREE.Group, points: THREE.Vector3[], color: string, opacity = 0.8, loop = false) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({ color, opacity, transparent: true, depthWrite: false, toneMapped: false })
  const line = loop ? new THREE.LineLoop(geometry, material) : new THREE.Line(geometry, material)
  group.add(line)
  return line
}

export function addTube(group: THREE.Group, points: THREE.Vector3[], color: string, radius: number, glow: number) {
  if (points.length < 2) {
    return
  }
  // A polyline path preserves the monotone chart interpolation without resmoothing it.
  const path = new THREE.CurvePath<THREE.Vector3>()
  for (let index = 1; index < points.length; index++) {
    path.add(new THREE.LineCurve3(points[index - 1], points[index]))
  }
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(path, Math.min(points.length * 2, 512), radius, 5, false),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1 + glow), toneMapped: false }),
  )
  mesh.name = 'ChartLuminousOutline'
  group.add(mesh)
}

interface LabelRow {
  name: string
  value: number
  color: string
}

/** Only text is rasterized; the chart itself is world-space mesh geometry. */
export function createLabel(title: string, value: string, color: string, size: number, rows: LabelRow[] = []) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = value || rows.length ? 190 + rows.length * 50 : 100
  const context = canvas.getContext('2d')
  if (context) {
    context.fillStyle = 'rgba(13, 23, 36, 0.88)'
    context.beginPath()
    context.roundRect(3, 3, 506, canvas.height - 6, 30)
    context.fill()
    context.strokeStyle = 'rgba(206, 237, 255, 0.2)'
    context.lineWidth = 2
    context.stroke()
    context.fillStyle = color
    context.font = '500 30px system-ui, sans-serif'
    context.fillText(title, 32, 54, 448)
    context.font = '600 52px system-ui, sans-serif'
    context.fillText(value, 32, 120, 448)
    const total = rows.reduce((sum, row) => sum + row.value, 0) || 1
    rows.forEach((row, index) => {
      const y = 175 + index * 50
      context.font = '400 23px system-ui, sans-serif'
      context.fillStyle = color
      context.fillText(row.name, 32, y, 290)
      context.textAlign = 'right'
      context.fillText(`${(row.value / total * 100).toFixed(1)}%`, 476, y)
      context.textAlign = 'left'
      context.fillStyle = 'rgba(255, 255, 255, 0.08)'
      context.fillRect(32, y + 10, 444, 5)
      context.fillStyle = row.color
      context.fillRect(32, y + 10, 444 * row.value / total, 5)
    })
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  }))
  sprite.scale.set(size, size * canvas.height / canvas.width, 1)
  sprite.name = `ChartLabel_${title}`
  return sprite
}
