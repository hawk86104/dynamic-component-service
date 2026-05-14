import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import sliceFragmentShader from '../../shader/PieChartArt/slice.frag?raw'
import sliceVertexShader from '../../shader/PieChartArt/slice.vert?raw'
import type {
  GradientDirection,
  GradientOptions,
  MaterialOptions,
  SlicePalette,
} from './types'

export type PieSliceMaterial = CustomShaderMaterial<typeof THREE.MeshStandardMaterial>

const directionToNumber: Record<GradientDirection, number> = {
  angular: 2,
  radial: 1,
  vertical: 0,
}

function safeColor(value: string, fallback: string) {
  try {
    return new THREE.Color(value)
  }
  catch {
    return new THREE.Color(fallback)
  }
}

export function createSliceMaterial(
  geometry: THREE.BufferGeometry,
  startAngle: number,
  endAngle: number,
  palette: SlicePalette,
  gradient: GradientOptions,
  materialOptions: MaterialOptions,
  radius: number,
  innerRadius: number,
): PieSliceMaterial {
  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  const minY = box?.min.y ?? 0
  const maxY = box?.max.y ?? 1

  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshStandardMaterial,
    color: 0xFFFFFF,
    envMapIntensity: materialOptions.envMapIntensity,
    fragmentShader: sliceFragmentShader,
    metalness: materialOptions.metalness,
    roughness: materialOptions.roughness,
    side: THREE.DoubleSide,
    silent: true,
    uniforms: {
      uAccentColor: { value: safeColor(palette.accent, '#ffffff') },
      uBottomColor: { value: safeColor(palette.bottom, '#1f2937') },
      uEndAngle: { value: endAngle },
      uGradientCurve: { value: gradient.curve },
      uGradientDirection: { value: directionToNumber[gradient.direction] ?? 0 },
      uGradientFromY: { value: gradient.fromY },
      uGradientToY: { value: gradient.toY },
      uInnerRadius: { value: innerRadius },
      uMaxY: { value: maxY },
      uMinY: { value: minY },
      uRadius: { value: radius },
      uStartAngle: { value: startAngle },
      uTopColor: { value: safeColor(palette.top, '#ffffff') },
    },
    vertexShader: sliceVertexShader,
  })
}
