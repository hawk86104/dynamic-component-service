import { LoaderUtils, LoadingManager } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { disposeIsoGlowGLTF } from './resources'

const RESOURCE_HINT = '请检查 GLB 地址、HTTP 状态和外部贴图/缓冲资源。资源服务器须允许当前页面来源的 CORS 响应头；也可使用有权访问资源的同源代理。HTTPS 页面请使用 HTTPS 资源，前端请求头无法绕过 CORS。'

export class IsoGlowLoadError extends Error {
  constructor(message: string, readonly modelUrl: string, readonly resourceUrls: string[] = []) {
    super(message)
    this.name = 'IsoGlowLoadError'
  }
}

export function normalizeModelUrl(value: string, baseUrl?: string) {
  if (!value?.trim()) { throw new Error('modelUrl 为必填参数，请输入可访问的 GLB URL。') }
  const url = new URL(value.trim(), baseUrl)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('模型地址仅支持 HTTP/HTTPS，也可使用当前站点的同源代理路径。')
  }
  return url.href
}

export function describeModelError(error: unknown, modelUrl: string) {
  const detail = error instanceof Error ? error.message : String(error)
  return {
    modelUrl,
    message: `${detail}\n${RESOURCE_HINT}`,
    resourceUrls: error instanceof IsoGlowLoadError ? error.resourceUrls : [],
  }
}

export async function loadIsoGlowGLTF(
  modelUrl: string,
  signal: AbortSignal,
  decoderPath: string,
  baseUrl?: string,
) {
  const url = normalizeModelUrl(modelUrl, baseUrl)
  const manager = new LoadingManager()
  const failedResources = new Set<string>()
  const blobResources = new Set<string>()
  manager.onError = resourceUrl => failedResources.add(resourceUrl)
  manager.setURLModifier((resourceUrl) => {
    if (resourceUrl.startsWith('blob:')) { blobResources.add(resourceUrl) }
    return resourceUrl
  })
  const abortResources = () => { manager.abort() }
  signal.addEventListener('abort', abortResources, { once: true })
  const draco = new DRACOLoader(manager).setDecoderPath(decoderPath)
  const loader = new GLTFLoader(manager)
    .setCrossOrigin('anonymous')
    .setWithCredentials(false)
    .setDRACOLoader(draco)
    .setMeshoptDecoder(MeshoptDecoder)

  try {
    signal.throwIfAborted()
    const response = await fetch(url, { signal, mode: 'cors', credentials: 'omit' })
    if (!response.ok) { throw new IsoGlowLoadError(`GLB 请求失败：HTTP ${response.status}。`, url, [url]) }
    const buffer = await response.arrayBuffer()
    signal.throwIfAborted()
    if (buffer.byteLength < 20 || new DataView(buffer).getUint32(0, true) !== 0x46546C67) {
      throw new IsoGlowLoadError('服务器响应不是有效的 GLB 文件，请确认地址未返回 HTML 或登录页面。', url, [url])
    }
    // Redirects can change where relative image/buffer resources are resolved.
    const gltf = await loader.parseAsync(buffer, LoaderUtils.extractUrlBase(response.url || url))
    if (signal.aborted || failedResources.size) {
      disposeIsoGlowGLTF(gltf)
      signal.throwIfAborted()
      throw new IsoGlowLoadError('模型的贴图、缓冲区或解码资源加载失败。', url, [...failedResources])
    }
    return gltf
  }
  catch (error) {
    manager.abort()
    signal.throwIfAborted()
    if (error instanceof IsoGlowLoadError) { throw error }
    const detail = error instanceof Error ? error.message : String(error)
    throw new IsoGlowLoadError(`GLB 加载失败：${detail}`, url, failedResources.size ? [...failedResources] : [url])
  }
  finally {
    signal.removeEventListener('abort', abortResources)
    // A decoder belongs to one request; another component cannot tear it down.
    draco.dispose()
    blobResources.forEach(resourceUrl => URL.revokeObjectURL(resourceUrl))
  }
}
