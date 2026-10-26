import * as THREE from 'three'
import vertexShader from '../../../shader/breezeElementalCardComponent/motes.vert?raw'
import fragmentShader from '../../../shader/breezeElementalCardComponent/motes.frag?raw'
import { disposeGroup, seededRandom } from '../geometry'
import { createElementMaterial } from '../material'
import type { BreezeCardOptions } from '../types'
import { breezeStreamPoint } from './geometry'

export function createBreezeParticles(initial: BreezeCardOptions) {
  const group = new THREE.Group()
  group.name = 'breeze-particles'
  const uniforms = {
    uTime: { value: 0 },
    uParticleSize: { value: initial.particleSize },
    uPointScale: { value: 500 },
    uPerspective: { value: 1 },
    uCurlRatio: { value: initial.curlRatio },
    uColor: { value: new THREE.Color(initial.effectColor) },
    uIntensity: { value: 1 },
    uOpacity: { value: 1 },
  }
  const points = new THREE.Points(new THREE.BufferGeometry(), createElementMaterial(vertexShader, fragmentShader, uniforms, { blending: THREE.AdditiveBlending }))
  points.name = 'breeze-curled-motes'
  points.frustumCulled = false
  points.raycast = () => {}
  group.add(points)
  const drawingSize = new THREE.Vector2()
  const p = new THREE.Vector3()
  let options = initial
  let layout: number[][] = []
  let time = 0
  function positionParticles() {
    const position = points.geometry.getAttribute('position')
    const life = points.geometry.getAttribute('aLife')
    for (let i = 0; i < layout.length; i++) {
      const [phase, lane, side, depthPhase, speed] = layout[i]
      const u = THREE.MathUtils.euclideanModulo(phase + time * speed, 1)
      breezeStreamPoint(u, options, lane, side, depthPhase, p)
      position.setXYZ(i, p.x, p.y, p.z)
      life.setX(i, u)
    }
    position.needsUpdate = true
    life.needsUpdate = true
  }
  function configure(next: BreezeCardOptions) {
    const rebuild = layout.length !== next.particleCount || next.seed !== options.seed || !points.geometry.hasAttribute('aSeed')
    options = next
    if (rebuild) {
      const random = seededRandom(next.seed + 4831)
      const seeds: number[] = []
      layout = Array.from({ length: next.particleCount }, (_, i) => {
        seeds.push(random(), random(), random(), random())
        return [random(), 0.04 + random() ** 1.8 * 0.85, i % 2 === 0 ? 1 : -1, random(), 0.075 + random() * 0.05]
      })
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(next.particleCount * 3), 3).setUsage(THREE.DynamicDrawUsage))
      geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 4))
      geometry.setAttribute('aLife', new THREE.Float32BufferAttribute(new Float32Array(next.particleCount), 1).setUsage(THREE.DynamicDrawUsage))
      points.geometry.dispose()
      points.geometry = geometry
    }
    positionParticles()
    uniforms.uParticleSize.value = next.particleSize
    uniforms.uCurlRatio.value = next.curlRatio
    uniforms.uColor.value.set(next.effectColor)
    uniforms.uIntensity.value = next.effectIntensity
    uniforms.uOpacity.value = next.opacity
    group.visible = next.particleCount > 0 && next.effectIntensity > 0
  }
  configure(initial)
  return {
    group,
    configure,
    update(nextTime: number, camera: THREE.Camera, renderer: Pick<THREE.WebGLRenderer, 'getDrawingBufferSize'>) {
      time = nextTime
      positionParticles()
      uniforms.uTime.value = time
      renderer.getDrawingBufferSize(drawingSize)
      uniforms.uPointScale.value = drawingSize.y * 0.5 * camera.projectionMatrix.elements[5]
      uniforms.uPerspective.value = (camera as THREE.PerspectiveCamera).isPerspectiveCamera ? 1 : 0
    },
    dispose() { disposeGroup(group) },
  }
}
