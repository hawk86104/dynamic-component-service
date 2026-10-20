import { LinearFilter, SRGBColorSpace, VideoTexture } from 'three'

export interface VideoReadyEvent {
  url: string
  width: number
  height: number
  duration: number
}

interface VideoSourceCallbacks {
  onTexture: (texture: VideoTexture | null) => void
  onReady: (event: VideoReadyEvent) => void
  onError: (error: Error) => void
  invalidate: () => void
}

interface VideoSession {
  video: HTMLVideoElement
  texture: VideoTexture
  cleanup: () => void
  url: string
  failed: boolean
}

export function createProjectionVideoSource(callbacks: VideoSourceCallbacks) {
  let current: VideoSession | null = null
  let disposed = false
  let playRevision = 0
  let autoplay = true
  let loop = true

  async function play() {
    const session = current
    const revision = ++playRevision
    if (!session || disposed || session.failed) { return false }
    try {
      await session.video.play()
      return !disposed && current === session && revision === playRevision
    }
    catch (error) {
      if (!disposed && current === session && revision === playRevision) {
        const reason = error instanceof Error ? error : new Error(String(error))
        if (reason.name !== 'AbortError') {
          callbacks.onError(new Error(`视频播放失败：${session.url}。${reason.message}`))
        }
      }
      return false
    }
  }

  function pause() {
    playRevision++
    current?.video.pause()
    callbacks.invalidate()
  }

  function stop() {
    pause()
    if (current && current.video.readyState >= current.video.HAVE_METADATA) {
      current.video.currentTime = 0
    }
  }

  function release() {
    playRevision++
    const previous = current
    current = null
    callbacks.onTexture(null)
    if (!previous) { return }
    previous.cleanup()
    previous.texture.dispose()
    previous.video.pause()
    previous.video.removeAttribute('src')
    previous.video.load()
  }

  function setSource(value: string) {
    if (disposed) { return }
    release()
    const url = value.trim()
    if (!url) {
      callbacks.onError(new Error('视频地址不能为空。'))
      callbacks.invalidate()
      return
    }
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.autoplay = autoplay
    video.loop = loop
    video.playsInline = true
    video.preload = 'auto'
    video.setAttribute('playsinline', '')
    const texture = new VideoTexture(video)
    texture.colorSpace = SRGBColorSpace
    texture.minFilter = LinearFilter
    texture.magFilter = LinearFilter
    texture.generateMipmaps = false
    const originalUpdate = texture.update.bind(texture)
    texture.update = () => {
      if (!video.ended && video.readyState >= video.HAVE_CURRENT_DATA) { originalUpdate() }
    }
    let frameId: number | null = null
    let reportedReady = false
    const session: VideoSession = { video, texture, url, failed: false, cleanup: () => {} }
    const active = () => !disposed && current === session
    const onFrame = () => {
      if (!active()) { return }
      callbacks.invalidate()
      frameId = video.requestVideoFrameCallback(onFrame)
    }
    const onData = () => {
      if (!active()) { return }
      callbacks.invalidate()
      if (reportedReady) { return }
      reportedReady = true
      callbacks.onReady({ url, width: video.videoWidth, height: video.videoHeight, duration: video.duration })
    }
    const onError = () => {
      if (!active()) { return }
      session.failed = true
      callbacks.invalidate()
      callbacks.onError(new Error(`视频加载失败：${url}（媒体错误 ${video.error?.code ?? 'unknown'}）。请检查地址、视频格式与跨域响应。`))
    }
    const onPlaybackChange = () => { if (active()) { callbacks.invalidate() } }
    video.addEventListener('loadeddata', onData)
    video.addEventListener('error', onError)
    const frameEvents = ['seeked', 'play', 'pause', 'ended', 'emptied'] as const
    frameEvents.forEach(event => video.addEventListener(event, onPlaybackChange))
    session.cleanup = () => {
      video.removeEventListener('loadeddata', onData)
      video.removeEventListener('error', onError)
      frameEvents.forEach(event => video.removeEventListener(event, onPlaybackChange))
      if (frameId !== null) { video.cancelVideoFrameCallback(frameId) }
    }
    current = session
    callbacks.onTexture(texture)
    if ('requestVideoFrameCallback' in video) { frameId = video.requestVideoFrameCallback(onFrame) }
    video.src = url
    video.load()
    callbacks.invalidate()
    if (autoplay) { void play() }
  }

  function configure(next: { autoplay: boolean, loop: boolean }) {
    const startPlayback = !autoplay && next.autoplay
    const stopPlayback = autoplay && !next.autoplay
    autoplay = next.autoplay
    loop = next.loop
    if (current) {
      current.video.autoplay = autoplay
      current.video.loop = loop
      if (startPlayback) { void play() }
      else if (stopPlayback) { pause() }
    }
  }

  return {
    setSource,
    configure,
    play,
    pause,
    stop,
    isReady: () => !!current && !current.failed && current.video.readyState >= current.video.HAVE_CURRENT_DATA,
    isPlaying: () => !!current && !current.failed && !current.video.paused && !current.video.ended,
    getVideoElement: () => current?.video ?? null,
    dispose: () => { if (!disposed) { disposed = true; release() } },
  }
}
