/*
 * @Description: 
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2026-05-11 18:38:50
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2026-05-18 08:23:38
 */
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

// three 官方推荐的 DRACO 解码器静态资源（与 three 版本保持一致以避免 wasm 不兼容）
const DRACO_DECODER_PATH = './draco/'

let cachedLoader: GLTFLoader | null = null
let cachedDraco: DRACOLoader | null = null

function getDracoLoader(): DRACOLoader {
  if (!cachedDraco) {
    cachedDraco = new DRACOLoader()
    cachedDraco.setDecoderPath(DRACO_DECODER_PATH)
    cachedDraco.setDecoderConfig({ type: 'js' })
  }
  return cachedDraco
}

export function getGLTFLoader(): GLTFLoader {
  if (!cachedLoader) {
    cachedLoader = new GLTFLoader()
    cachedLoader.setDRACOLoader(getDracoLoader())
  }
  return cachedLoader
}

export function loadGLTFFromUrl(url: string): Promise<GLTF> {
  return getGLTFLoader().loadAsync(url)
}

// 组件卸载时调用，释放 DRACO worker
export function disposeLoaderCache() {
  cachedDraco?.dispose()
  cachedDraco = null
  cachedLoader = null
}
