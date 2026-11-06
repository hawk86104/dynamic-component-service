import { defineComponent, h, shallowRef, watch } from 'vue'
import type { PropType } from 'vue'
import PixelFxPlayer from './PixelFxPlayer.vue'
import { getPixelFxDefaults, PIXEL_FX_MAX_SEED } from './defaults'
import { getPixelFxEffect } from './effects'
import type { PixelFxEffectId } from './effects'
import type { PixelFxApi, PixelFxRenderMode } from './types'

export function createPixelFxComponent(effectId: PixelFxEffectId) {
  const defaults = getPixelFxDefaults(effectId)
  return defineComponent({
    name: getPixelFxEffect(effectId).type,
    inheritAttrs: false,
    props: {
      renderMode: { type: String as PropType<PixelFxRenderMode>, default: defaults.renderMode },
      width: { type: Number, default: defaults.width },
      opacity: { type: Number, default: defaults.opacity },
      playing: { type: Boolean, default: defaults.playing },
      playbackRate: { type: Number, default: defaults.playbackRate },
      loop: { type: Boolean, default: defaults.loop },
      palette: { type: String, default: defaults.palette },
      seed: { type: Number, default: defaults.seed },
      mirror: { type: Boolean, default: defaults.mirror },
    },
    setup(props, { attrs, expose }) {
      const player = shallowRef<PixelFxApi | null>(null)
      const seed = shallowRef(props.seed)
      watch(() => props.seed, (value) => {
        seed.value = value
      })

      function newSeed() {
        const candidate = 1 + Math.floor(Math.random() * PIXEL_FX_MAX_SEED)
        seed.value = candidate === seed.value ? (candidate % PIXEL_FX_MAX_SEED) + 1 : candidate
        return { seed: seed.value }
      }

      expose({ restart: () => player.value?.restart(), newSeed })
      return () => h(PixelFxPlayer, { ...attrs, ...props, effectId, seed: seed.value, ref: player })
    },
  })
}
