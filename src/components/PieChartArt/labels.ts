import * as THREE from 'three'
import type { ChartBuildOptions, PieChartData, SliceLayout } from './types'

interface LabelLayout {
  labelAngle: number
  labelRadius: number
  labelY: number
  pushed: boolean
}

export function createLabelSprite(
  layout: SliceLayout,
  chartData: PieChartData,
  opacity = 1,
  labelSize = 2.05,
) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 220
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return new THREE.Sprite()
  }

  const total = chartData.slices.reduce((sum, datum) => sum + datum.value, 0)
  const pct = total > 0 ? `${((layout.value / total) * 100).toFixed(1)}%` : '0.0%'
  const safeLabelSize = THREE.MathUtils.clamp(labelSize, 0.8, 4)

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(255, 255, 255, 0.35)'
  ctx.shadowBlur = 2
  ctx.font = '700 58px Inter, Arial, sans-serif'
  ctx.fillStyle = '#050505'
  ctx.fillText(layout.datum.label, 256, 78, 460)

  ctx.font = '700 44px Inter, Arial, sans-serif'
  ctx.fillText(pct, 256, 148, 420)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true

  const material = new THREE.SpriteMaterial({
    depthTest: false,
    depthWrite: false,
    map: texture,
    opacity,
    transparent: true,
  })
  const sprite = new THREE.Sprite(material)
  const width = safeLabelSize
  sprite.scale.set(width, width * (canvas.height / canvas.width), 1)
  sprite.renderOrder = 20
  sprite.userData.texture = texture

  return sprite
}

export function createLeaderLine(
  from: THREE.Vector3,
  to: THREE.Vector3,
  opacity = 0.68,
) {
  const group = new THREE.Group()
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to])
  const color = 0x111111
  const material = new THREE.LineBasicMaterial({
    color,
    depthTest: false,
    depthWrite: false,
    opacity,
    transparent: true,
  })
  const line = new THREE.Line(geometry, material)
  line.renderOrder = 18
  group.add(line)

  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 10, 10),
    new THREE.MeshBasicMaterial({
      color,
      depthTest: false,
      depthWrite: false,
      opacity,
      transparent: true,
    }),
  )
  dot.position.copy(from)
  dot.renderOrder = 19
  group.add(dot)

  return group
}

export function resolveLabelLayouts(
  layouts: SliceLayout[],
  chart: ChartBuildOptions,
) {
  const thresholdAngle = THREE.MathUtils.degToRad(30)
  const outerRadius = chart.radius + 2.35
  const resolved = layouts.map((layout) => {
    const sliceAngle = layout.endAngle - layout.startAngle
    const pushed = sliceAngle < thresholdAngle

    return {
      labelAngle: layout.midAngle,
      labelRadius: pushed
        ? outerRadius
        : chart.radius * 0.58 + chart.innerRadius * 0.42,
      labelY: layout.height + chart.bevel + (pushed ? 1.34 : 0.62),
      pushed,
    } satisfies LabelLayout
  })

  const pushed = resolved
    .map((layout, index) => ({ ...layout, index }))
    .filter(layout => layout.pushed)

  if (pushed.length <= 1) {
    return resolved
  }

  const minSeparation = Math.min(0.5, (Math.PI * 2 / pushed.length) * 0.85)

  for (let iteration = 0; iteration < 36; iteration++) {
    let moved = false

    for (let i = 0; i < pushed.length; i++) {
      for (let j = i + 1; j < pushed.length; j++) {
        let diff = pushed[j].labelAngle - pushed[i].labelAngle

        while (diff < 0) {
          diff += Math.PI * 2
        }
        while (diff > Math.PI * 2) {
          diff -= Math.PI * 2
        }

        const distance = Math.min(diff, Math.PI * 2 - diff)

        if (distance >= minSeparation) {
          continue
        }

        const push = (minSeparation - distance) * 0.28

        if (diff <= Math.PI) {
          pushed[i].labelAngle -= push
          pushed[j].labelAngle += push
        }
        else {
          pushed[i].labelAngle += push
          pushed[j].labelAngle -= push
        }

        moved = true
      }

      const sourceAngle = layouts[pushed[i].index].midAngle
      let drift = pushed[i].labelAngle - sourceAngle

      while (drift > Math.PI) {
        drift -= Math.PI * 2
      }
      while (drift < -Math.PI) {
        drift += Math.PI * 2
      }

      pushed[i].labelAngle -= drift * 0.04
    }

    if (!moved) {
      break
    }
  }

  pushed.forEach((layout) => {
    resolved[layout.index].labelAngle = layout.labelAngle
  })

  return resolved
}
