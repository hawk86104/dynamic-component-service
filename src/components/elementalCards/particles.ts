import * as THREE from 'three'
import fragmentShader from '../../shader/elementalCards/particles.frag?raw'
import vertexShader from '../../shader/elementalCards/particles.vert?raw'
import { disposeGroup, seededRandom } from './geometry'
import { createElementMaterial } from './material'
import type { CardOptions, ElementKind } from './types'

export function createElementParticles(kind: ElementKind, initial: CardOptions) {
  const group = new THREE.Group()
  group.name = `${kind}-particles`
  const uniforms = {
    uCardSize: { value: new THREE.Vector2(initial.width, initial.height) },
    uTime: { value: 0 },
    uKind: { value: ['ember', 'solar', 'breeze', 'bloom'].indexOf(kind) },
    uParticleSize: { value: initial.particleSize },
    uPointScale: { value: 500 },
    uPerspective: { value: 1 },
    uColor: { value: new THREE.Color(initial.effectColor) },
    uOpacity: { value: initial.opacity },
    uIntensity: { value: initial.effectIntensity },
  }
  const material = createElementMaterial(vertexShader, fragmentShader, uniforms, { blending: THREE.AdditiveBlending })
  const points = new THREE.Points(new THREE.BufferGeometry(), material)
  points.frustumCulled = false
  points.raycast = () => {}
  group.add(points)
  let options: CardOptions | undefined
  const drawingSize = new THREE.Vector2()

  function configure(next: CardOptions) {
    if (!options || next.particleCount !== options.particleCount || next.seed !== options.seed) {
      const random = seededRandom(next.seed + 721)
      const seeds = new Float32Array(next.particleCount * 4)
      for (let i = 0; i < seeds.length; i++) { seeds[i] = random() }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(next.particleCount * 3), 3))
      geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4))
      points.geometry.dispose()
      points.geometry = geometry
    }
    uniforms.uCardSize.value.set(next.width, next.height)
    uniforms.uColor.value.set(next.effectColor)
    uniforms.uParticleSize.value = next.particleSize
    uniforms.uOpacity.value = next.opacity
    uniforms.uIntensity.value = next.effectIntensity
    group.visible = next.particleCount > 0 && next.effectIntensity > 0
    options = next
  }
  configure(initial)
  return {
    group,
    configure,
    update(time: number, camera: THREE.Camera, renderer: Pick<THREE.WebGLRenderer, 'getDrawingBufferSize'>) {
      uniforms.uTime.value = time
      renderer.getDrawingBufferSize(drawingSize)
      uniforms.uPointScale.value = drawingSize.y * 0.5 * camera.projectionMatrix.elements[5]
      uniforms.uPerspective.value = (camera as THREE.PerspectiveCamera).isPerspectiveCamera ? 1 : 0
    },
    dispose() { disposeGroup(group) },
  }
}
