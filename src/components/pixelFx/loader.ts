import type { PixelFxModule } from '../../vendor/pixelfx/core/fx.js'
import { getPixelFxEffect } from './effects'
import type { PixelFxEffectId } from './effects'

const modules = import.meta.glob<PixelFxModule>([
  '../../vendor/pixelfx/fx/*/*.js',
  '!../../vendor/pixelfx/fx/*/_*.js',
  '!../../vendor/pixelfx/fx/{moves,status}/*.js',
  '!../../vendor/pixelfx/fx/arcane/{blink-in,blink-out}.js',
  '!../../vendor/pixelfx/fx/holy/{heal,resurrection}.js',
  '!../../vendor/pixelfx/fx/ice/freeze.js',
  '!../../vendor/pixelfx/fx/impacts/hit-flash.js',
  '!../../vendor/pixelfx/fx/lightning/{charge-up,electrified,thunderclap}.js',
  '!../../vendor/pixelfx/fx/scifi/{glitch,scanner,warp-in,warp-out}.js',
  '!../../vendor/pixelfx/fx/spawn/{disintegrate,dissolve-burn,respawn-beam,shatter-death,soul-rise}.js',
])

export async function loadPixelFxEffect(effectId: PixelFxEffectId): Promise<PixelFxModule> {
  getPixelFxEffect(effectId)
  const load = modules[`../../vendor/pixelfx/fx/${effectId}.js`]
  if (!load) {
    throw new Error(`PixelFX module is missing: ${effectId}`)
  }
  return load()
}
