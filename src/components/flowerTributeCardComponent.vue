<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { getResUrl } from '../common/utils'
import fragmentShader from '../shader/flowerTributeCardComponent/card.frag?raw'
import vertexShader from '../shader/flowerTributeCardComponent/card.vert?raw'
import { CARD_TRAIL_DEFAULTS } from './flowerTributeCardComponent/defaults'
import { createCardParticleTrail } from './flowerTributeCardComponent/particleTrail'

const backgroundUrl = getResUrl('./image/flowerTributeCardComponent/background.png')

const props = withDefaults(defineProps<{
  particleGradient?: boolean
  particleColor?: string
  particleColorStart?: string
  particleColorMiddle?: string
  particleColorEnd?: string
  outlineDensity?: number
  particleDensity?: number
  trailDensity?: number
  particleSize?: number
  particleSizeMultiplier?: number
  particleOpacity?: number
  particleSpeed?: number
  trailLength?: number
  turbulence?: number
  trailAmplitude?: number
  cornerRadius?: number
  animationSpeed?: number
  height?: number
  line1?: string
  line2?: string
  fontSize?: number
  pitchNm?: number
  grooveAngle?: number
  gain?: number
  redFilter?: number
  stars?: boolean
}>(), {
  ...CARD_TRAIL_DEFAULTS,
  cornerRadius: 0.06,
  animationSpeed: 0.35,
  height: 6.45,
  line1: '敬献人：',
  line2: '山河铭记，浩气长存',
  fontSize: 34,
  pitchNm: 1180,
  grooveAngle: 31,
  gain: 1.2,
  redFilter: 0.82,
  stars: true,
})
const emit = defineEmits<{ error: [error: Error] }>()
const safeNumber = (value: number, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? THREE.MathUtils.clamp(value, min, max) : fallback
const height = computed(() => safeNumber(props.height, 0.5, 20, 6.45))
const canvas = document.createElement('canvas')
canvas.width = 941
canvas.height = 1672
const textTexture = new THREE.CanvasTexture(canvas)
textTexture.colorSpace = THREE.SRGBColorSpace
const placeholder = new THREE.DataTexture(new Uint8Array([115, 5, 4, 255]), 1, 1)
placeholder.colorSpace = THREE.SRGBColorSpace
placeholder.needsUpdate = true
const material = new CustomShaderMaterial({
  baseMaterial: THREE.MeshBasicMaterial,
  vertexShader,
  fragmentShader,
  side: THREE.DoubleSide,
  toneMapped: false,
  silent: true,
  uniforms: {
    uArt: { value: placeholder as THREE.Texture },
    uText: { value: textTexture },
    uPitchNm: { value: props.pitchNm },
    uGrooveAngle: { value: 0 },
    uGain: { value: props.gain },
    uRedFilter: { value: props.redFilter },
    uStars: { value: 1 },
    uCornerRadius: { value: 0.06 },
    uFlowOffset: { value: 0 },
  },
})

function redrawText() {
  const ctx = canvas.getContext('2d')
  if (!ctx) { return }
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  const font = (size: number) => `${size}px "PingFang SC", "Microsoft YaHei", sans-serif`
  for (const [index, value] of [props.line1, props.line2].entries()) {
    let text = String(value ?? '').replace(/[\r\n\t]+/g, ' ')
    let size = safeNumber(props.fontSize, 20, 46, 34)
    ctx.font = font(size)
    while (size > 20 && ctx.measureText(text).width > 630) {
      size--
      ctx.font = font(size)
    }
    if (ctx.measureText(text).width > 630) {
      const characters = Array.from(text)
      while (characters.length && ctx.measureText(`${characters.join('')}…`).width > 630) { characters.pop() }
      text = `${characters.join('')}…`
    }
    ctx.fillText(text, 155, index === 0 ? 1427 : 1505)
  }
  textTexture.needsUpdate = true
}
watch(() => [props.line1, props.line2, props.fontSize], redrawText, { immediate: true })
watch(() => [props.pitchNm, props.grooveAngle, props.gain, props.redFilter, props.stars, props.cornerRadius], () => {
  material.uniforms.uPitchNm.value = safeNumber(props.pitchNm, 600, 1800, 1180)
  material.uniforms.uGrooveAngle.value = THREE.MathUtils.degToRad(safeNumber(props.grooveAngle, 0, 180, 31))
  material.uniforms.uGain.value = safeNumber(props.gain, 0, 4, 1.2)
  material.uniforms.uRedFilter.value = safeNumber(props.redFilter, 0, 1, 0.82)
  material.uniforms.uStars.value = props.stars ? 1 : 0
  material.uniforms.uCornerRadius.value = safeNumber(props.cornerRadius, 0, 0.3, 0.06)
}, { immediate: true })
const rootGroup = shallowRef<THREE.Group | null>(null)
const particleTrail = createCardParticleTrail()
watch(() => [
  props.particleGradient,
  props.particleColor,
  props.particleColorStart,
  props.particleColorMiddle,
  props.particleColorEnd,
  props.outlineDensity,
  props.particleDensity,
  props.trailDensity,
  props.particleSize,
  props.particleSizeMultiplier,
  props.particleOpacity,
  props.particleSpeed,
  props.trailLength,
  props.turbulence,
  props.trailAmplitude,
], () => particleTrail.configure(props), { immediate: true })
watch(() => [height.value, props.cornerRadius, props.outlineDensity, props.particleDensity, props.trailDensity], () => {
  particleTrail.configure(props)
  particleTrail.rebuild(height.value, safeNumber(props.cornerRadius, 0, 0.3, 0.06))
}, { immediate: true })
const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  if (rootGroup.value) {
    particleTrail.update(rootGroup.value, delta)
  }
  // Integrating speed keeps the current pattern position when speed changes or pauses.
  material.uniforms.uFlowOffset.value += delta * safeNumber(props.animationSpeed, 0, 3, 0.35)
})
let disposed = false
let artTexture: THREE.Texture | undefined
onMounted(() => {
  artTexture = new THREE.TextureLoader().load(backgroundUrl, (texture) => {
    if (disposed) {
      texture.dispose()
      return
    }
    texture.colorSpace = THREE.SRGBColorSpace
    material.uniforms.uArt.value = texture
  }, undefined, () => {
    if (!disposed) { emit('error', new Error('献花卡片背景图加载失败')) }
  })
  void document.fonts.ready.then(() => {
    if (!disposed) { redrawText() }
  })
})
onBeforeUnmount(() => {
  disposed = true
  particleTrail.dispose()
  artTexture?.dispose()
  placeholder.dispose()
  textTexture.dispose()
  material.dispose()
})
</script>

<template>
  <TresGroup ref="rootGroup">
    <TresMesh>
      <TresPlaneGeometry :args="[height * 941 / 1672, height]" />
      <primitive :object="material" attach="material" />
    </TresMesh>
    <primitive :object="particleTrail.points" />
  </TresGroup>
</template>
