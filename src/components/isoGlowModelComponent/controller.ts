import { Group } from 'three'
import type { Object3D } from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { describeModelError } from './modelLoader'
import type { IsoGlowStyle } from './defaults'
import { createIsoGlowRuntime } from './runtime'
import type { IsoGlowRuntime } from './runtime'
import { disposeIsoGlowGLTF } from './resources'

export interface ModelLoadingEvent {
  modelUrl: string
  stage: 'loading' | 'styling'
}

export interface ModelLoadedEvent {
  modelUrl: string
  object: Object3D
}

export type ModelErrorEvent = ReturnType<typeof describeModelError>

interface ControllerOptions {
  load: (url: string, signal: AbortSignal) => Promise<GLTF>
  invalidate?: () => void
  onLoading?: (event: ModelLoadingEvent) => void
  onLoaded?: (event: ModelLoadedEvent) => void
  onError?: (event: ModelErrorEvent) => void
}

/** Own loading generations and disposal separately from the Vue lifecycle. */
export function createIsoGlowController(options: ControllerOptions, initialStyle: Partial<IsoGlowStyle>) {
  const group = new Group()
  let style = initialStyle
  let runtime: IsoGlowRuntime | null = null
  let active: AbortController | null = null
  let activeUrl = ''
  let generation = 0
  let disposed = false

  async function setModelUrl(value: string) {
    if (disposed) { return }
    const url = value?.trim() || ''
    if (url === activeUrl && (active || runtime)) { return }
    const token = ++generation
    active?.abort()
    runtime?.dispose()
    runtime = null
    activeUrl = url
    options.invalidate?.()
    const controller = new AbortController()
    active = controller
    options.onLoading?.({ modelUrl: url, stage: 'loading' })
    let candidate: IsoGlowRuntime | null = null

    try {
      const gltf = await options.load(url, controller.signal)
      if (disposed || token !== generation) { disposeIsoGlowGLTF(gltf); return }
      options.onLoading?.({ modelUrl: url, stage: 'styling' })
      try { candidate = createIsoGlowRuntime(gltf, style, options.invalidate) }
      catch (error) { disposeIsoGlowGLTF(gltf); throw error }
      runtime = candidate
      group.add(candidate.group)
      options.invalidate?.()
      await candidate.whenEdgesReady()
      if (disposed || token !== generation) { return }
      options.onLoaded?.({ modelUrl: url, object: candidate.group })
    }
    catch (error) {
      if (!disposed && token === generation) {
        candidate?.dispose()
        runtime = null
        options.onError?.(describeModelError(error, url))
        options.invalidate?.()
      }
    }
    finally {
      if (active === controller) { active = null }
    }
  }

  function update(next: Partial<IsoGlowStyle>) {
    style = { ...next }
    const current = runtime
    current?.update(style)
    if (current) {
      void current.whenEdgesReady().catch((error: unknown) => {
        if (!disposed && runtime === current) { options.onError?.(describeModelError(error, activeUrl)) }
      })
    }
  }

  return {
    group,
    setModelUrl,
    update,
    dispose() {
      if (disposed) { return }
      disposed = true
      generation++
      active?.abort()
      active = null
      runtime?.dispose()
      runtime = null
      group.removeFromParent()
      group.clear()
    },
  }
}
