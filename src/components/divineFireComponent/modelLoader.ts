import { LoaderUtils, LoadingManager } from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { disposeFireGLTF } from './resources'

export async function loadFireModel(value: string, signal: AbortSignal, decoderPath: string) {
  const url = new URL(value, document.baseURI)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('模型地址仅支持 HTTP/HTTPS GLB 或 glTF。')
  }
  const manager = new LoadingManager()
  const failedResources = new Set<string>()
  const blobResources = new Set<string>()
  manager.onError = resource => failedResources.add(resource)
  manager.setURLModifier((resource) => {
    if (resource.startsWith('blob:')) { blobResources.add(resource) }
    return resource
  })
  const abort = () => { manager.abort() }
  signal.addEventListener('abort', abort, { once: true })
  const draco = new DRACOLoader(manager).setDecoderPath(decoderPath)
  const loader = new GLTFLoader(manager)
    .setCrossOrigin('anonymous')
    .setWithCredentials(false)
    .setDRACOLoader(draco)
    .setMeshoptDecoder(MeshoptDecoder)

  try {
    signal.throwIfAborted()
    const response = await fetch(url, { signal, mode: 'cors', credentials: 'omit' })
    if (!response.ok) { throw new Error(`模型请求失败：HTTP ${response.status}。`) }
    const buffer = await response.arrayBuffer()
    signal.throwIfAborted()
    const isGLB = buffer.byteLength >= 20 && new DataView(buffer).getUint32(0, true) === 0x46546C67
    let data: string | ArrayBuffer = buffer
    if (!isGLB) {
      data = new TextDecoder().decode(buffer)
      const json = JSON.parse(data)
      if (!json.asset?.version?.startsWith('2.')) {
        throw new Error('响应不是 glTF 2.0 模型，请确认链接未返回 HTML 或登录页面。')
      }
    }
    const gltf = await loader.parseAsync(data, LoaderUtils.extractUrlBase(response.url || url.href))
    if (signal.aborted || failedResources.size) {
      disposeFireGLTF(gltf)
      signal.throwIfAborted()
      throw new Error(`模型依赖资源加载失败：${[...failedResources].join('、')}`)
    }
    return gltf
  }
  catch (error) {
    manager.abort()
    signal.throwIfAborted()
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${message} 请检查模型及贴图/缓冲资源是否可访问，并允许当前页面来源的 CORS；HTTPS 页面请使用 HTTPS 链接。`)
  }
  finally {
    signal.removeEventListener('abort', abort)
    draco.dispose()
    blobResources.forEach(resource => URL.revokeObjectURL(resource))
  }
}
