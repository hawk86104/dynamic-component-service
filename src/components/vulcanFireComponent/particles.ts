import * as THREE from 'three'
import { MAX_VULCAN_PARTICLES } from './defaults'
import type { VulcanFireSettings } from './defaults'

interface Particle {
  life: number
  radius: number
  angle: number
  sizeFactor: number
  riseFactor: number
  decayFactor: number
  driftX: number
  driftZ: number
  rotation: number
  rotationSpeed: number
  frame: number
  opacity: number
  flipX: number
  flipY: number
  position: THREE.Vector3
}

function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

export function createVulcanParticleSystem(kind: 'fire' | 'smoke', material: THREE.ShaderMaterial, seed: number) {
  const isSmoke = kind === 'smoke'
  const quad = new THREE.PlaneGeometry(1, 1)
  const geometry = new THREE.InstancedBufferGeometry()
  geometry.setIndex(quad.index!.clone())
  geometry.setAttribute('position', quad.getAttribute('position').clone())
  geometry.setAttribute('uv', quad.getAttribute('uv').clone())
  quad.dispose()

  const attributes = {
    aCenter: new THREE.InstancedBufferAttribute(new Float32Array(MAX_VULCAN_PARTICLES * 3), 3),
    aData: new THREE.InstancedBufferAttribute(new Float32Array(MAX_VULCAN_PARTICLES * 4), 4),
    aFlipbook: new THREE.InstancedBufferAttribute(new Float32Array(MAX_VULCAN_PARTICLES * 3), 3),
  }
  for (const [name, attribute] of Object.entries(attributes)) {
    attribute.setUsage(THREE.DynamicDrawUsage)
    geometry.setAttribute(name, attribute)
  }
  geometry.instanceCount = 0

  const mesh = new THREE.Mesh(geometry, material)
  // Vertex attributes hold the real centers; the unit plane cannot provide a valid bound.
  mesh.frustumCulled = false
  mesh.renderOrder = isSmoke ? 1 : 2
  const particles: Particle[] = Array.from({ length: MAX_VULCAN_PARTICLES }, () => ({
    life: 0,
    radius: 0,
    angle: 0,
    sizeFactor: 0,
    riseFactor: 1,
    decayFactor: 1,
    driftX: 0,
    driftZ: 0,
    rotation: 0,
    rotationSpeed: 0,
    frame: 0,
    opacity: 1,
    flipX: 1,
    flipY: 1,
    position: new THREE.Vector3(),
  }))
  const order = Array.from({ length: MAX_VULCAN_PARTICLES }, (_, index) => index)
  const depths = new Float32Array(MAX_VULCAN_PARTICLES)
  const compareDepth = (first: number, second: number) => depths[first] - depths[second]
  let random = createRandom(seed)

  const randomize = (particle: Particle) => {
    particle.radius = Math.sqrt(random())
    particle.angle = random() * Math.PI * 2
    particle.sizeFactor = random()
    particle.riseFactor = 0.7 + random() * 0.6
    particle.decayFactor = 0.7 + random() * 0.6
    particle.driftX = (random() - 0.5) * (isSmoke ? 0.4 : 0.3)
    particle.driftZ = (random() - 0.5) * (isSmoke ? 0.4 : 0.3)
    particle.rotation = isSmoke ? random() * Math.PI * 2 : (random() - 0.5) * 0.4
    particle.rotationSpeed = (random() - 0.5) * (isSmoke ? 1.2 : 0.3)
    particle.frame = random()
    particle.opacity = (isSmoke ? 0.5 : 0.6) + random() * (isSmoke ? 0.5 : 0.4)
    particle.flipX = random() < 0.5 ? -1 : 1
    particle.flipY = isSmoke && random() < 0.5 ? -1 : 1
  }

  const reseed = (nextSeed: number) => {
    random = createRandom(nextSeed + (isSmoke ? 7919 : 0))
    for (const particle of particles) {
      randomize(particle)
      particle.life = random()
    }
  }
  reseed(seed)

  const update = (delta: number, settings: VulcanFireSettings, localToView: THREE.Matrix4) => {
    const count = isSmoke ? (settings.smokeEnabled ? settings.smokeCount : 0) : settings.fireCount
    geometry.instanceCount = count
    mesh.visible = count > 0 && (isSmoke ? settings.smokeOpacity > 0 : settings.intensity > 0)
    if (!mesh.visible) { return }

    const matrix = localToView.elements
    for (let index = 0; index < count; index++) {
      const particle = particles[index]
      const decay = particle.decayFactor * (isSmoke ? 0.25 : settings.decaySpeed)
      particle.life += delta * decay
      if (particle.life >= 1) {
        particle.life %= 1
        randomize(particle)
      }
      const rate = particle.decayFactor * (isSmoke ? 0.25 : settings.decaySpeed)
      const age = particle.life / rate
      const size = isSmoke ? 0.9 + particle.sizeFactor * 0.8 : THREE.MathUtils.lerp(settings.sizeMin, settings.sizeMax, particle.sizeFactor)
      const radius = settings.emitterRadius * particle.radius * (isSmoke ? 1.5 : 1)
      const binding = Math.exp(-settings.bindStrength * age * (1 - particle.life * 0.5))
      const startY = isSmoke ? 1 + particle.sizeFactor * 0.5 : size * 0.38
      const rise = (isSmoke ? settings.smokeRiseSpeed : settings.riseSpeed) * particle.riseFactor * age
      particle.position.set(
        (Math.cos(particle.angle) * radius + particle.driftX * age) * binding,
        startY + rise,
        (Math.sin(particle.angle) * radius + particle.driftZ * age) * binding,
      )
      depths[index] = matrix[2] * particle.position.x + matrix[6] * particle.position.y + matrix[10] * particle.position.z + matrix[14]
      order[index] = index
    }

    order.length = count
    // Camera-space z is negative in front of the camera: more negative is farther away.
    order.sort(compareDepth)
    for (let slot = 0; slot < count; slot++) {
      const particle = particles[order[slot]]
      const size = isSmoke
        ? (0.9 + particle.sizeFactor * 0.8) * (1 + particle.life * settings.smokeGrowth)
        : THREE.MathUtils.lerp(settings.sizeMin, settings.sizeMax, particle.sizeFactor)
      const age = particle.life / (particle.decayFactor * (isSmoke ? 0.25 : settings.decaySpeed))
      attributes.aCenter.setXYZ(slot, particle.position.x, particle.position.y, particle.position.z)
      attributes.aData.setXYZW(slot, size, particle.rotation + particle.rotationSpeed * age, particle.life, particle.opacity)
      attributes.aFlipbook.setXYZ(slot, particle.frame, particle.flipX, particle.flipY)
    }
    attributes.aCenter.needsUpdate = true
    attributes.aData.needsUpdate = true
    attributes.aFlipbook.needsUpdate = true
  }

  return { mesh, reseed, update, dispose: () => geometry.dispose() }
}
