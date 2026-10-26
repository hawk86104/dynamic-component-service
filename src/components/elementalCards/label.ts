import * as THREE from 'three'
import type { CardOptions, ElementKind } from './types'

function drawIcon(ctx: CanvasRenderingContext2D, kind: ElementKind) {
  ctx.save()
  ctx.translate(256, 355)
  ctx.scale(1.7, 1.7)
  ctx.lineWidth = 2.8
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (kind === 'ember') {
    ctx.beginPath()
    ctx.moveTo(0, -29)
    ctx.bezierCurveTo(6, -10, 17, -8, 13, 6)
    ctx.bezierCurveTo(8, 24, -14, 22, -16, 7)
    ctx.bezierCurveTo(-19, -4, -8, -11, -8, -20)
    ctx.bezierCurveTo(-7, -10, 3, -6, 0, -29)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-20, 28)
    ctx.lineTo(20, 37)
    ctx.moveTo(20, 28)
    ctx.lineTo(-20, 37)
    ctx.stroke()
  }
  else if (kind === 'solar') {
    ctx.beginPath()
    ctx.arc(0, 0, 12, 0, Math.PI * 2)
    ctx.stroke()
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4
      ctx.beginPath()
      ctx.moveTo(Math.cos(a) * 21, Math.sin(a) * 21)
      ctx.lineTo(Math.cos(a) * 29, Math.sin(a) * 29)
      ctx.stroke()
    }
  }
  else if (kind === 'breeze') {
    for (const [y, length, bend] of [[-15, 12, -1], [0, 24, -1], [15, 8, 1]]) {
      ctx.beginPath()
      ctx.moveTo(-27, y)
      ctx.lineTo(length, y)
      ctx.bezierCurveTo(length + 16, y, length + 16, y + bend * 19, length + 4, y + bend * 16)
      ctx.stroke()
    }
  }
  else {
    for (let i = 0; i < 6; i++) {
      ctx.save()
      ctx.rotate(i * Math.PI / 3)
      ctx.beginPath()
      ctx.ellipse(0, -20, 6.5, 12, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }
    ctx.beginPath()
    ctx.arc(0, 0, 4, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

export function createCardLabel(kind: ElementKind, initial: CardOptions) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 896
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  let options = initial
  let disposed = false

  function redraw() {
    const ctx = canvas.getContext('2d')
    if (!ctx || disposed) { return }
    ctx.clearRect(0, 0, 512, 896)
    ctx.fillStyle = options.textColor
    ctx.strokeStyle = options.textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    drawIcon(ctx, kind)
    let size = 57
    const font = (value: number, weight = 500) => `${weight} ${value}px "Microsoft YaHei", "PingFang SC", Arial, sans-serif`
    ctx.font = font(size, 600)
    while (size > 14 && ctx.measureText(options.title).width > 420) { ctx.font = font(--size, 600) }
    ctx.fillText(options.title, 256, 650, 420)
    ctx.font = font(15)
    ctx.globalAlpha = 0.75
    ctx.fillText(options.subtitle, 256, 699, 415)
    ctx.globalAlpha = 0.6
    ctx.font = font(11)
    ctx.fillText('• •', 256, 120)
    ctx.globalAlpha = 1
    texture.needsUpdate = true
  }

  redraw()
  if (document.fonts) { void document.fonts.ready.then(() => redraw()) }
  return {
    texture,
    configure(next: CardOptions) {
      const dirty = next.title !== options.title || next.subtitle !== options.subtitle || next.textColor !== options.textColor
      options = next
      if (dirty) { redraw() }
    },
    dispose() {
      disposed = true
      texture.dispose()
      canvas.width = 1
      canvas.height = 1
    },
  }
}
