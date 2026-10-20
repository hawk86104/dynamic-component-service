import { Color, NearestFilter, Vector4, WebGLRenderTarget } from 'three'
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three'

export function createProjectorDepthCapture() {
  let target: WebGLRenderTarget | null = null
  const viewport = new Vector4()
  const scissor = new Vector4()
  const clearColor = new Color()

  function capture(renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, resolution: number) {
    const size = Math.min(renderer.capabilities.maxTextureSize, Math.round(resolution))
    if (!target) {
      target = new WebGLRenderTarget(size, size, {
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        depthBuffer: true,
        stencilBuffer: false,
      })
    }
    else if (target.width !== size) { target.setSize(size, size) }

    const previousTarget = renderer.getRenderTarget()
    const cubeFace = renderer.getActiveCubeFace()
    const mipLevel = renderer.getActiveMipmapLevel()
    renderer.getViewport(viewport)
    renderer.getScissor(scissor)
    renderer.getClearColor(clearColor)
    const clearAlpha = renderer.getClearAlpha()
    const scissorTest = renderer.getScissorTest()
    const autoClear = renderer.autoClear
    const xrEnabled = renderer.xr.enabled
    const shadowAutoUpdate = renderer.shadowMap.autoUpdate
    try {
      renderer.xr.enabled = false
      renderer.shadowMap.autoUpdate = false
      renderer.autoClear = true
      renderer.setRenderTarget(target)
      renderer.setViewport(0, 0, size, size)
      renderer.setScissorTest(false)
      renderer.setClearColor(renderer.capabilities.reversedDepthBuffer ? 0x000000 : 0xFFFFFF, 1)
      renderer.clear(true, true, false)
      renderer.render(scene, camera)
    }
    finally {
      renderer.autoClear = autoClear
      renderer.xr.enabled = xrEnabled
      renderer.shadowMap.autoUpdate = shadowAutoUpdate
      renderer.setRenderTarget(previousTarget, cubeFace, mipLevel)
      renderer.setViewport(viewport)
      renderer.setScissor(scissor)
      renderer.setScissorTest(scissorTest)
      renderer.setClearColor(clearColor, clearAlpha)
    }
    return target.texture
  }

  return {
    capture,
    dispose: () => { target?.dispose(); target = null },
  }
}
