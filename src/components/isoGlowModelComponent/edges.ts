import { BufferAttribute, BufferGeometry, EdgesGeometry, LineSegments, Matrix4, Vector3 } from 'three'
import type { InstancedMesh, LineDashedMaterial, Mesh, SkinnedMesh } from 'three'
import type { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'

export interface EdgeOverlay {
  mesh: Mesh
  line: LineSegments2
  hidden: LineSegments
}

/** Aborting also releases the scheduled timer, including threshold debounce. */
export function yieldEdgeWork(signal: AbortSignal, delay = 0) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) { resolve(); return }
    let timer: ReturnType<typeof setTimeout>
    const finish = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', finish)
      resolve()
    }
    timer = setTimeout(finish, delay)
    signal.addEventListener('abort', finish, { once: true })
  })
}

function isDeformed(mesh: Mesh) {
  return (mesh as SkinnedMesh).isSkinnedMesh
    || mesh.morphTargetInfluences?.some(value => value !== 0)
}

/** Extract a static posed snapshot while retaining the source vertex/index data. */
function snapshotGeometry(mesh: Mesh) {
  const position = mesh.geometry.getAttribute('position')
  const values = new Float32Array(position.count * 3)
  const vertex = new Vector3()
  if ((mesh as SkinnedMesh).isSkinnedMesh) { (mesh as SkinnedMesh).skeleton.update() }
  for (let index = 0; index < position.count; index++) {
    mesh.getVertexPosition(index, vertex).toArray(values, index * 3)
  }
  return new BufferGeometry()
    .setAttribute('position', new BufferAttribute(values, 3))
    .setIndex(mesh.geometry.index)
}

async function instanceEdges(mesh: InstancedMesh, edges: BufferGeometry, signal: AbortSignal) {
  const source = edges.getAttribute('position')
  const positions = new Float32Array(source.count * mesh.count * 3)
  const matrix = new Matrix4()
  const vertex = new Vector3()
  for (let instance = 0; instance < mesh.count; instance++) {
    if (signal.aborted) { return null }
    mesh.getMatrixAt(instance, matrix)
    for (let index = 0; index < source.count; index++) {
      vertex.fromBufferAttribute(source, index).applyMatrix4(matrix).toArray(positions, (instance * source.count + index) * 3)
    }
    if (instance % 32 === 31) { await yieldEdgeWork(signal) }
  }
  return new BufferGeometry().setAttribute('position', new BufferAttribute(positions, 3))
}

export async function createEdgeOverlays(
  meshes: Mesh[],
  material: LineMaterial,
  hiddenMaterial: LineDashedMaterial,
  threshold: number,
  signal: AbortSignal,
) {
  const cache = new Map<BufferGeometry | Mesh, BufferGeometry>()
  const lineCache = new Map<BufferGeometry, LineSegmentsGeometry>()
  const geometries = new Set<BufferGeometry>()
  const overlays: EdgeOverlay[] = []
  let transferred = false
  let disposed = false
  const dispose = () => {
    if (disposed) { return }
    disposed = true
    overlays.forEach(({ line, hidden }) => { line.removeFromParent(); hidden.removeFromParent() })
    geometries.forEach(geometry => geometry.dispose())
    cache.clear()
    lineCache.clear()
    geometries.clear()
    overlays.length = 0
  }

  try {
    for (let index = 0; index < meshes.length; index++) {
      if (signal.aborted) { return null }
      const mesh = meshes[index]
      if (!mesh.geometry.getAttribute('position')) { continue }
      const deformed = isDeformed(mesh)
      const key = deformed ? mesh : mesh.geometry
      let geometry = cache.get(key)
      if (!geometry) {
        const input = deformed ? snapshotGeometry(mesh) : mesh.geometry
        try { geometry = new EdgesGeometry(input, threshold) }
        finally { if (deformed) { input.dispose() } }
        geometries.add(geometry)
        cache.set(key, geometry)
      }
      if ((mesh as InstancedMesh).isInstancedMesh) {
        const instanced = await instanceEdges(mesh as InstancedMesh, geometry, signal)
        if (!instanced) { return null }
        geometry = instanced
        geometries.add(geometry)
      }
      let lineGeometry = lineCache.get(geometry)
      if (!lineGeometry) {
        lineGeometry = new LineSegmentsGeometry().setPositions(geometry.getAttribute('position').array as Float32Array)
        lineCache.set(geometry, lineGeometry)
        geometries.add(lineGeometry)
      }
      const line = new LineSegments2(lineGeometry, material)
      line.name = `${mesh.name || 'mesh'}__isoGlowEdges`
      line.renderOrder = mesh.renderOrder + 1
      line.layers.mask = mesh.layers.mask
      line.raycast = () => {}
      const hidden = new LineSegments(geometry, hiddenMaterial)
      hidden.name = `${mesh.name || 'mesh'}__isoGlowHiddenEdges`
      if (!geometry.hasAttribute('lineDistance')) {
        hidden.computeLineDistances()
        // Imported GLBs often store centimetres under a 0.01 root scale.
        const distance = geometry.getAttribute('lineDistance')
        const scale = mesh.matrixWorld.getMaxScaleOnAxis()
        for (let vertex = 0; vertex < distance.count; vertex++) {
          distance.setX(vertex, distance.getX(vertex) * scale)
        }
      }
      hidden.renderOrder = line.renderOrder
      hidden.layers.mask = mesh.layers.mask
      hidden.raycast = () => {}
      overlays.push({ mesh, line, hidden })
      // Individual EdgesGeometry calls are synchronous; yield between mesh batches.
      if (index % 8 === 7) { await yieldEdgeWork(signal) }
    }
    if (signal.aborted) { return null }
    transferred = true
    return { overlays, dispose }
  }
  finally {
    if (!transferred) { dispose() }
  }
}
