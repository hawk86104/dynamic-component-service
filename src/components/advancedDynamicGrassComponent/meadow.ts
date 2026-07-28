import * as THREE from 'three'
import { GrassLayer } from './grassLayer'
import { createTerrain, type TerrainRuntime } from './terrain'
import type { GrassAppearanceOptions, MeadowOptions } from './types'
import { Wildflowers } from './wildflowers'

export interface MeadowRuntime {
  group: THREE.Group
  bladeCount: number
  flowerCount: number
  update: (timeSeconds: number) => void
  setAppearance: (appearance: GrassAppearanceOptions) => void
  setGroundColor: (color: THREE.ColorRepresentation) => void
  dispose: () => void
}

export function createMeadow(options: MeadowOptions): MeadowRuntime {
  const group = new THREE.Group()
  let terrain!: TerrainRuntime
  let grass!: GrassLayer
  let wildflowers: Wildflowers | undefined
  let disposed = false

  try {
    terrain = createTerrain(options.terrain)
    grass = new GrassLayer({
      ...options.grass,
      surface: terrain.grassSurface,
    })

    if (options.wildflowers.enabled) {
      wildflowers = new Wildflowers({
        ...options.wildflowers,
        surface: terrain.grassSurface,
      })
    }

    group.add(terrain.ground, grass)
    if (wildflowers) {
      group.add(wildflowers)
    }
  }
  catch (error) {
    wildflowers?.dispose()
    grass?.dispose()
    terrain?.dispose()
    throw error
  }

  return {
    group,
    bladeCount: grass.bladeCount,
    flowerCount: wildflowers?.flowerCount ?? 0,
    update: (timeSeconds) => {
      if (disposed) {
        return
      }

      grass.update(timeSeconds)
      wildflowers?.update(timeSeconds)
    },
    setAppearance: (appearance) => {
      if (disposed) {
        return
      }

      grass.setAppearance(appearance)
      wildflowers?.setWind(appearance.wind)
    },
    setGroundColor: (color) => {
      if (!disposed) {
        terrain.setGroundColor(color)
      }
    },
    dispose: () => {
      if (disposed) {
        return
      }

      disposed = true
      group.clear()
      wildflowers?.dispose()
      grass.dispose()
      terrain.dispose()
      wildflowers = undefined
    },
  }
}
