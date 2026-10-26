import * as THREE from 'three'
import { createCardBody } from './body'
import { sanitizeCardOptions } from './defaults'
import { createElementParticles } from './particles'
import type { CardOptions, EffectFactory, ElementKind, NumericRanges } from './types'

export class CardClock {
  time = 0
  tick(delta: number, speed: number, playing: boolean) {
    if (playing && Number.isFinite(delta) && delta > 0) {
      this.time += Math.min(delta, 0.05) * speed
    }
    return this.time
  }

  restart() { this.time = 0 }
}

export function createCardRuntime<T extends CardOptions>(kind: ElementKind, input: Readonly<T>, defaults: T, ranges: NumericRanges, factory: EffectFactory<T>) {
  let options = sanitizeCardOptions(input, defaults, ranges)
  const root = new THREE.Group()
  root.name = `${kind}-elemental-card`
  const floating = new THREE.Group()
  const body = createCardBody(kind, options, !factory.ownsRim)
  const particles = factory.createParticles?.(options) ?? createElementParticles(kind, options)
  let effect = factory.create(options)
  floating.add(body.group, particles.group, effect.group)
  root.add(floating, body.ground)
  root.visible = options.enabled && options.opacity > 0
  let disposed = false
  let lastTime = 0
  let effectTime = 0
  return {
    root,
    configure(input: Readonly<T>) {
      if (disposed) { return }
      const next = sanitizeCardOptions(input, defaults, ranges)
      if (factory.geometryKeys.some(key => next[key] !== options[key])) {
        effect.dispose()
        effect = factory.create(next)
        floating.add(effect.group)
      }
      else { effect.configure(next) }
      body.configure(next)
      particles.configure(next)
      options = next
      root.visible = options.enabled && options.opacity > 0
    },
    update(time: number, camera: THREE.Camera, renderer: Pick<THREE.WebGLRenderer, 'getDrawingBufferSize'>, enabled = options.enabled) {
      if (disposed) { return }
      root.visible = enabled && options.opacity > 0
      if (!root.visible) { return }
      floating.position.y = Math.sin(time * 1.1) * options.floatAmplitude
      body.update(time)
      if (time < lastTime) { effectTime = 0 }
      else { effectTime += (time - lastTime) * (factory.timeScale?.(options) ?? 1) }
      lastTime = time
      const localTime = factory.timeScale ? effectTime : time
      particles.update(localTime, camera, renderer)
      effect.update(localTime, camera)
    },
    getOptions: () => ({ ...options }),
    dispose() {
      if (disposed) { return }
      disposed = true
      effect.dispose()
      particles.dispose()
      body.dispose()
      root.removeFromParent()
      floating.clear()
      root.clear()
    },
  }
}
