import { useLoop, useTres } from '@tresjs/core'
import { onBeforeUnmount, ref, watch } from 'vue'
import { CardClock, createCardRuntime } from './runtime'
import type { CardControlEvents, CardOptions, EffectFactory, ElementKind, NumericRanges } from './types'

export function useElementalCard<T extends CardOptions>(kind: ElementKind, props: Readonly<T>, defaults: T, ranges: NumericRanges, factory: EffectFactory<T>, emit: CardControlEvents) {
  const runtime = createCardRuntime(kind, props, defaults, ranges, factory)
  const { camera, renderer, invalidate } = useTres()
  const clock = new CardClock()
  const enabled = ref(props.enabled)
  const playing = ref(props.playing)
  let disposed = false
  watch(() => ({ ...props }), (next) => {
    runtime.configure(next)
    invalidate()
  })
  watch(() => props.enabled, (value) => { enabled.value = value })
  watch(() => props.playing, (value) => { playing.value = value })
  const { onBeforeRender } = useLoop()
  const { off } = onBeforeRender(({ delta }) => {
    if (disposed || !camera.value) { return }
    const options = runtime.getOptions()
    const advancing = playing.value && enabled.value && options.opacity > 0
    const time = clock.tick(delta, options.animationSpeed, advancing)
    runtime.update(time, camera.value, renderer, enabled.value)
    if (advancing && options.animationSpeed > 0) { invalidate() }
  })
  function setPlaying(value: boolean) {
    playing.value = value
    emit('update:playing', value)
    invalidate()
  }
  const controls = {
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    restart: () => {
      clock.restart()
      if (camera.value) { runtime.update(0, camera.value, renderer, enabled.value) }
      invalidate()
    },
    setEnabled: (value: boolean) => {
      enabled.value = !!value
      runtime.root.visible = enabled.value && runtime.getOptions().opacity > 0
      emit('update:enabled', enabled.value)
      invalidate()
    },
    getObject3D: () => runtime.root,
  }
  onBeforeUnmount(() => {
    disposed = true
    off()
    runtime.dispose()
  })
  return { root: runtime.root, controls }
}
