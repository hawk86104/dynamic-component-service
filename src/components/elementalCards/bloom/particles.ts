import * as THREE from 'three'
import vertexShader from '../../../shader/bloomElementalCardComponent/motes.vert?raw'
import fragmentShader from '../../../shader/bloomElementalCardComponent/motes.frag?raw'
import { disposeGroup, seededRandom } from '../geometry'
import { createElementMaterial } from '../material'
import type { BloomCardOptions } from '../types'
import { bloomOpening } from './geometry'

export function createBloomParticles(initial: BloomCardOptions) {
  const group = new THREE.Group()
  group.name = 'bloom-particles'
  const uniforms = {
    uTime: { value: 0 },
    uWidth: { value: initial.width },
    uHeight: { value: initial.height },
    uSpread: { value: initial.petalSpread },
    uReveal: { value: 0 },
    uHeartRatio: { value: initial.heartRatio },
    uParticleSize: { value: initial.particleSize },
    uPointScale: { value: 500 },
    uPerspective: { value: 1 },
    uColor: { value: new THREE.Color(initial.effectColor) },
    uTipColor: { value: new THREE.Color(initial.tipColor) },
    uIntensity: { value: 1 },
    uOpacity: { value: 1 },
  }
  const points = new THREE.Points(new THREE.BufferGeometry(), createElementMaterial(vertexShader, fragmentShader, uniforms, { blending: THREE.AdditiveBlending }))
  points.name = 'bloom-petal-flakes-and-hearts'
  points.frustumCulled = false
  points.raycast = () => {}
  group.add(points)
  const drawingSize = new THREE.Vector2()
  let options: BloomCardOptions | undefined
  let time = 0
  function configure(next: BloomCardOptions) {
    if (!options || ['width', 'height', 'thickness', 'seed', 'particleCount'].some(key => next[key as keyof BloomCardOptions] !== options![key as keyof BloomCardOptions])) {
      const origins: number[] = []
      const seeds: number[] = []
      const regions: number[] = []
      const random = seededRandom(next.seed + 5291)
      for (let i = 0; i < next.particleCount; i++) {
        const upper = i % 5 !== 0
        const angle = random() * Math.PI
        const side = i % 2 === 0 ? -1 : 1
        origins.push(
          upper ? Math.cos(angle) * next.width * 0.51 : side * next.width * (0.62 + random() * 0.5),
          upper ? (next.height - next.width) * 0.5 + Math.sin(angle) * next.width * 0.51 : next.height * (-0.24 - random() * 0.24),
          -next.thickness * 0.2 + (random() - 0.5) * next.width * 0.32,
        )
        seeds.push(random(), random(), random(), random())
        regions.push(upper ? 1 : 0)
      }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(next.particleCount * 3), 3))
      geometry.setAttribute('aOrigin', new THREE.Float32BufferAttribute(origins, 3))
      geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 4))
      geometry.setAttribute('aUpper', new THREE.Float32BufferAttribute(regions, 1))
      points.geometry.dispose()
      points.geometry = geometry
    }
    options = next
    uniforms.uWidth.value = next.width
    uniforms.uHeight.value = next.height
    uniforms.uSpread.value = next.petalSpread
    uniforms.uReveal.value = bloomOpening(time, next, 0.2)
    uniforms.uHeartRatio.value = next.heartRatio
    uniforms.uParticleSize.value = next.particleSize
    uniforms.uColor.value.set(next.effectColor)
    uniforms.uTipColor.value.set(next.tipColor)
    uniforms.uIntensity.value = next.effectIntensity
    uniforms.uOpacity.value = next.opacity
    group.visible = next.particleCount > 0 && next.effectIntensity > 0 && next.bloomAmount > 0
  }
  configure(initial)
  return {
    group,
    configure,
    update(nextTime: number, camera: THREE.Camera, renderer: Pick<THREE.WebGLRenderer, 'getDrawingBufferSize'>) {
      time = nextTime
      uniforms.uTime.value = time
      uniforms.uReveal.value = bloomOpening(time, options!, 0.2)
      renderer.getDrawingBufferSize(drawingSize)
      uniforms.uPointScale.value = drawingSize.y * 0.5 * camera.projectionMatrix.elements[5]
      uniforms.uPerspective.value = (camera as THREE.PerspectiveCamera).isPerspectiveCamera ? 1 : 0
    },
    dispose() { disposeGroup(group) },
  }
}
