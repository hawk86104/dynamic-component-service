import { BufferGeometry, Float32BufferAttribute } from 'three'
import type { BufferAttribute, InterleavedBufferAttribute } from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

function copyAttribute(attribute: BufferAttribute | InterleavedBufferAttribute) {
  // Read decoded components so interleaved and normalized GLTF attributes work too.
  const copy = new Float32BufferAttribute(attribute.count * attribute.itemSize, attribute.itemSize)
  for (let i = 0; i < attribute.count; i++) {
    for (let k = 0; k < attribute.itemSize; k++) {
      copy.setComponent(i, k, attribute.getComponent(i, k))
    }
  }
  return copy
}

export function createFireGeometry(source: BufferGeometry) {
  if (!source.getAttribute('position')?.count) {
    throw new Error('模型包含没有顶点的网格。')
  }
  if (Object.values(source.morphAttributes).some(attributes => attributes?.length)) {
    // Coincident base vertices can have different morph deltas. Keep their identity.
    const geometry = source.clone()
    if (!geometry.hasAttribute('normal')) { geometry.computeVertexNormals() }
    return geometry
  }

  const stripped = new BufferGeometry()
  for (const name of ['position', 'skinIndex', 'skinWeight']) {
    const attribute = source.getAttribute(name)
    if (attribute) { stripped.setAttribute(name, copyAttribute(attribute)) }
  }
  if (source.index) { stripped.setIndex(source.index.clone()) }
  stripped.setDrawRange(source.drawRange.start, source.drawRange.count)
  // Weld UV seams/hard edges so stretching a cube produces continuous flame sheets.
  const geometry = mergeVertices(stripped, 1e-4)
  stripped.dispose()
  geometry.computeVertexNormals()
  return geometry
}
