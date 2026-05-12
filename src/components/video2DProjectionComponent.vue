<script setup lang="ts">
// 视频 2D 投射组件
// 参考 Mars3D Video2D: http://mars3d.cn/editor-vue.html?key=ex_6_12_4&id=graphic/video/video2D
// 仅投射示例视频: https://opensource.icegl.cn/plugins/visualArts/video/vlg.mp4
import * as THREE from 'three'
import { onBeforeUnmount, shallowRef, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    angle?: number
    angle2?: number
    distance?: number
    flipX?: boolean
    frustumColor?: string
    heading?: number
    loop?: boolean
    opacity?: number
    pitch?: number
    showFrustum?: boolean
    stRotationDegree?: number
    videoTint?: string
  }>(),
  {
    angle: 46,
    angle2: 25,
    distance: 6,
    flipX: false,
    frustumColor: '#00ffff',
    heading: 0,
    loop: true,
    opacity: 0.95,
    pitch: -20,
    showFrustum: true,
    stRotationDegree: 0,
    videoTint: '#ffffff',
  },
)

const VIDEO_URL = 'https://dcser.icegl.cn/video/vlg.mp4'

const clamp = (v: number | undefined, min: number, max: number, fallback: number) =>
  Number.isFinite(v) ? THREE.MathUtils.clamp(v as number, min, max) : fallback

// —— 视频元素 & 贴图 ——
const videoEl = document.createElement('video')
videoEl.crossOrigin = 'anonymous'
videoEl.loop = props.loop ?? true
videoEl.muted = true
videoEl.autoplay = true
videoEl.playsInline = true
videoEl.setAttribute('playsinline', '')
videoEl.src = VIDEO_URL

const videoTexture = new THREE.VideoTexture(videoEl)
videoTexture.colorSpace = THREE.SRGBColorSpace
videoTexture.minFilter = THREE.LinearFilter
videoTexture.magFilter = THREE.LinearFilter
videoTexture.generateMipmaps = false
videoTexture.wrapS = THREE.RepeatWrapping
videoTexture.wrapT = THREE.RepeatWrapping
videoTexture.center.set(0.5, 0.5)

// 覆写 VideoTexture.update(): 视频处于 ended 状态时跳过 texImage2D 上传，
// 避免 loop 衔接瞬间触发 "texImage2D: no video" WebGL 错误。
// 正常播放时调用原始 update() 保证每帧正常上传。
const _origUpdate = videoTexture.update.bind(videoTexture)
videoTexture.update = function () {
  if (videoEl.ended || videoEl.readyState < videoEl.HAVE_CURRENT_DATA) {
    return
  }
  _origUpdate()
}

const videoMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color(props.videoTint),
  depthWrite: false,
  map: videoTexture,
  opacity: props.opacity,
  side: THREE.DoubleSide,
  toneMapped: false,
  transparent: true,
})

const frustumLineMaterial = new THREE.LineBasicMaterial({
  color: new THREE.Color(props.frustumColor),
  depthWrite: false,
  opacity: 0.9,
  toneMapped: false,
  transparent: true,
})

// —— Three.js 场景树 ——
const rootGroup = shallowRef(new THREE.Group())
const headingGroup = new THREE.Group()
const pitchGroup = new THREE.Group()

const farPlaneMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), videoMaterial)
farPlaneMesh.renderOrder = 3

const frustumGeo = new THREE.BufferGeometry()
const frustumLines = new THREE.LineSegments(frustumGeo, frustumLineMaterial)
frustumLines.renderOrder = 4
frustumLines.frustumCulled = false

pitchGroup.add(farPlaneMesh, frustumLines)
headingGroup.add(pitchGroup)
rootGroup.value.add(headingGroup)

// —— 视锥几何重建 ——
const rebuildFrustum = () => {
  const dist = clamp(props.distance, 0.1, 500, 6)
  const halfW = dist * Math.tan(THREE.MathUtils.degToRad(clamp(props.angle, 1, 120, 46)) / 2)
  const halfH = dist * Math.tan(THREE.MathUtils.degToRad(clamp(props.angle2, 1, 120, 25)) / 2)
  const z = -dist

  const pos = new Float32Array([
    0,
    0,
    0,
    -halfW,
    -halfH,
    z,
    0,
    0,
    0,
    halfW,
    -halfH,
    z,
    0,
    0,
    0,
    halfW,
    halfH,
    z,
    0,
    0,
    0,
    -halfW,
    halfH,
    z,
    -halfW,
    -halfH,
    z,
    halfW,
    -halfH,
    z,
    halfW,
    -halfH,
    z,
    halfW,
    halfH,
    z,
    halfW,
    halfH,
    z,
    -halfW,
    halfH,
    z,
    -halfW,
    halfH,
    z,
    -halfW,
    -halfH,
    z,
  ])
  frustumGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  frustumGeo.computeBoundingSphere()

  farPlaneMesh.position.set(0, 0, z)
  farPlaneMesh.scale.set(Math.max(halfW * 2, 0.0001), Math.max(halfH * 2, 0.0001), 1)
}

// —— 朝向更新 ——
const updateOrientation = () => {
  headingGroup.rotation.y = THREE.MathUtils.degToRad(-clamp(props.heading, -360, 360, 0))
  pitchGroup.rotation.x = THREE.MathUtils.degToRad(clamp(props.pitch, -89, 89, -20))
}

// —— 贴图变换 ——
const applyTextureTransform = () => {
  videoTexture.repeat.x = props.flipX ? -1 : 1
  videoTexture.offset.x = props.flipX ? 1 : 0
  videoTexture.rotation = THREE.MathUtils.degToRad(clamp(props.stRotationDegree, 0, 360, 0))
}

// —— 播放控制 ——
const videoPlay = () => {
  const p = videoEl.play()
  if (p && typeof p.catch === 'function') {
    p.catch(() => {})
  }
}

const videoPause = () => {
  videoEl.pause()
}

const videoStop = () => {
  videoEl.pause()
  videoEl.currentTime = 0
}

// 初始化
rebuildFrustum()
updateOrientation()
applyTextureTransform()
videoPlay()

watch(
  () => [props.angle, props.angle2, props.distance],
  () => { rebuildFrustum() },
)
watch(
  () => [props.heading, props.pitch],
  () => { updateOrientation() },
)
watch(
  () => [props.flipX, props.stRotationDegree],
  () => { applyTextureTransform() },
)
watch(() => props.loop, (v) => { videoEl.loop = v ?? true })
watch(() => props.opacity, (v) => { videoMaterial.opacity = clamp(v, 0, 1, 0.95) })
watch(() => props.videoTint, (v) => { videoMaterial.color.set(v ?? '#ffffff') })
watch(() => props.frustumColor, (v) => { frustumLineMaterial.color.set(v ?? '#00ffff') })
watch(() => props.showFrustum, (v) => { frustumLines.visible = v ?? true }, { immediate: true })

onBeforeUnmount(() => {
  try {
    videoEl.pause()
    videoEl.removeAttribute('src')
    videoEl.load()
  }
  catch { /* ignore */ }
  videoTexture.dispose()
  videoMaterial.dispose()
  frustumGeo.dispose()
  frustumLineMaterial.dispose()
  farPlaneMesh.geometry.dispose()
  rootGroup.value.removeFromParent()
})

defineExpose({ videoPlay, videoPause, videoStop })
</script>

<template>
  <primitive
    v-if="rootGroup"
    :object="rootGroup"
  />
</template>
