import * as THREE from 'three'
import fragmentShader from '../../../shader/solarElementalCardComponent/motes.frag?raw'
import vertexShader from '../../../shader/solarElementalCardComponent/motes.vert?raw'
import { disposeGroup, seededRandom } from '../geometry'
import { createElementMaterial } from '../material'
import type { SolarCardOptions } from '../types'
import { solarBoundary } from './geometry'

export function createSolarParticles(initial: SolarCardOptions) {
  const group = new THREE.Group()
  group.name = 'solar-particles'
  const uniforms = {
    uTime: { value: 0 },
    uCardWidth: { value: initial.width },
    uRayDepth: { value: initial.rayDepth },
    uParticleSpread: { value: initial.particleSpread },
    uRingRatio: { value: initial.ringRatio },
    uParticleSize: { value: initial.particleSize },
    uPointScale: { value: 500 },
    uPerspective: { value: 1 },
    uColor: { value: new THREE.Color() },
    uCoronaColor: { value: new THREE.Color() },
    uIntensity: { value: 1 },
    uOpacity: { value: 1 },
  }
  const material = createElementMaterial(vertexShader, fragmentShader, uniforms, { blending: THREE.AdditiveBlending })
  const points = new THREE.Points(new THREE.BufferGeometry(), material)
  points.name = 'solar-rings-and-motes'
  points.frustumCulled = false
  points.raycast = () => {}
  group.add(points)
  const drawingSize = new THREE.Vector2()
  let previous: SolarCardOptions | undefined
  function configure(options: SolarCardOptions) {
    if (!previous || ['width', 'height', 'thickness', 'seed', 'particleCount'].some(key => options[key as keyof SolarCardOptions] !== previous![key as keyof SolarCardOptions])) {
      const origins: number[] = []
      const directions: number[] = []
      const seeds: number[] = []
      const random = seededRandom(options.seed + 3381)
      for (let i = 0; i < options.particleCount; i++) {
        const angle = (i + random()) / options.particleCount * Math.PI * 2
        const p = solarBoundary(angle, options.width, options.height)
        origins.push(p.x, p.y, -options.thickness * 0.15)
        directions.push(Math.cos(angle), Math.sin(angle), random() * 2 - 1)
        seeds.push(random(), random(), random(), random())
      }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(options.particleCount * 3), 3))
      geometry.setAttribute('aOrigin', new THREE.Float32BufferAttribute(origins, 3))
      geometry.setAttribute('aDirection', new THREE.Float32BufferAttribute(directions, 3))
      geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 4))
      points.geometry.dispose()
      points.geometry = geometry
    }
    uniforms.uCardWidth.value = options.width
    uniforms.uRayDepth.value = options.rayDepth
    uniforms.uParticleSpread.value = options.particleSpread
    uniforms.uRingRatio.value = options.ringRatio
    uniforms.uParticleSize.value = options.particleSize
    uniforms.uColor.value.set(options.effectColor)
    uniforms.uCoronaColor.value.set(options.coronaColor)
    uniforms.uIntensity.value = options.effectIntensity
    uniforms.uOpacity.value = options.opacity
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
