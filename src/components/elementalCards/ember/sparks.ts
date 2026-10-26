import * as THREE from 'three'
import fragmentShader from '../../../shader/emberElementalCardComponent/sparks.frag?raw'
import vertexShader from '../../../shader/emberElementalCardComponent/sparks.vert?raw'
import { disposeGroup, seededRandom } from '../geometry'
import { createElementMaterial } from '../material'
import type { EmberCardOptions } from '../types'

export function createEmberParticles(initial: EmberCardOptions) {
  const group = new THREE.Group()
  group.name = 'ember-particles'
  const uniforms = {
    uCardSize: { value: new THREE.Vector2() },
    uThickness: { value: 0 },
    uTime: { value: 0 },
    uFlameHeight: { value: 1 },
    uFlameDepth: { value: 0.4 },
    uTriangleRatio: { value: 0.1 },
    uParticleSize: { value: 0.018 },
    uPointScale: { value: 500 },
    uPerspective: { value: 1 },
    uColor: { value: new THREE.Color() },
    uCoreColor: { value: new THREE.Color() },
    uOpacity: { value: 1 },
    uIntensity: { value: 1 },
  }
  const points = new THREE.Points(new THREE.BufferGeometry(), createElementMaterial(vertexShader, fragmentShader, uniforms, { blending: THREE.AdditiveBlending }))
  points.name = 'ember-crown-sparks'
  points.frustumCulled = false
  points.raycast = () => {}
  group.add(points)
  const drawingSize = new THREE.Vector2()
  let previous: EmberCardOptions | undefined
  function configure(options: EmberCardOptions) {
    if (!previous || options.particleCount !== previous.particleCount || options.seed !== previous.seed) {
      const random = seededRandom(options.seed + 1721)
      const seeds = new Float32Array(options.particleCount * 4)
      for (let i = 0; i < seeds.length; i++) { seeds[i] = random() }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(options.particleCount * 3), 3))
      geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 4))
      points.geometry.dispose()
      points.geometry = geometry
    }
    uniforms.uCardSize.value.set(options.width, options.height)
    uniforms.uThickness.value = options.thickness
    uniforms.uFlameHeight.value = options.flameHeight
    uniforms.uFlameDepth.value = options.flameDepth
    uniforms.uTriangleRatio.value = options.triangleRatio
    uniforms.uParticleSize.value = options.particleSize
    uniforms.uColor.value.set(options.effectColor)
    uniforms.uCoreColor.value.set(options.coreColor)
    uniforms.uOpacity.value = options.opacity
    uniforms.uIntensity.value = options.effectIntensity
    group.visible = options.particleCount > 0 && options.effectIntensity > 0
    previous = options
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
