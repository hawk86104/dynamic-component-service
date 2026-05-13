import * as THREE from 'three'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import particleFragmentShader from '../../shader/modelParticleGeneratorComponent/particle.frag?raw'
import particleVertexShader from '../../shader/modelParticleGeneratorComponent/particle.vert?raw'

export type ParticleMaterial = CustomShaderMaterial<typeof THREE.PointsMaterial>

export interface ParticleUniforms {
  uTime: { value: number }
  uWindDir: { value: THREE.Vector3 }
  uParticleSpeed: { value: number }
  uTrailLength: { value: number }
  uParticleSize: { value: number }
  uTurbulence: { value: number }
  uOpacity: { value: number }
  uColorA: { value: THREE.Color }
  uColorB: { value: THREE.Color }
  uColorC: { value: THREE.Color }
  uWorldScale: { value: number }
}

export interface BuildCloudOptions {
  outlineDensity: number
  particleDensity: number
  trailDensity: number
  maxParticles?: number
  baseSampleCount?: number
  baseTrailCount?: number
}

interface SamplingMesh {
  mesh: THREE.Mesh
  area: number
}

// 从 GLB 场景里收集所有 Mesh，按 bounding box 估算相对面积
// referenceSpace: 可选的参考坐标系（通常是挂载 Points 的 rootGroup）。
// 传入时会把顶点烘到 reference 的 local 空间，避免渲染时 rootGroup 的 world
// 矩阵被应用两次——这个双重变换在带缩放的父级（例如 GIS 里的 200x scale）
// 下会把粒子推到视野外，在平移父级下会表现成「移动物体后重建粒子就产生偏移」。
export function collectSamplingMeshes(
  root: THREE.Object3D,
  referenceSpace?: THREE.Object3D | null,
): SamplingMesh[] {
  const meshes: SamplingMesh[] = []
  root.updateMatrixWorld(true)

  const referenceMatrixInverse = (() => {
    if (!referenceSpace) return null
    referenceSpace.updateWorldMatrix(true, false)
    return new THREE.Matrix4().copy(referenceSpace.matrixWorld).invert()
  })()
  const tempMatrix = new THREE.Matrix4()

  root.traverse((obj) => {
    const maybeMesh = obj as THREE.Mesh
    if (!maybeMesh.isMesh || !maybeMesh.geometry) {
      return
    }

    const cloned = maybeMesh.geometry.clone()
    if (referenceMatrixInverse) {
      tempMatrix.multiplyMatrices(referenceMatrixInverse, maybeMesh.matrixWorld)
      cloned.applyMatrix4(tempMatrix)
    }
    else {
      cloned.applyMatrix4(maybeMesh.matrixWorld)
    }
    cloned.computeBoundingBox()

    const size = new THREE.Vector3()
    cloned.boundingBox?.getSize(size)
    const surfaceEstimate = Math.max(
      0.0001,
      size.x * size.y + size.y * size.z + size.x * size.z,
    )

    meshes.push({ mesh: new THREE.Mesh(cloned), area: surfaceEstimate })
  })

  return meshes
}

export function disposeSamplingMeshes(meshes: SamplingMesh[]) {
  meshes.forEach(entry => entry.mesh.geometry.dispose())
}

export function createParticleUniforms(params: {
  windDir: THREE.Vector3
  particleSpeed: number
  trailLength: number
  particleSize: number
  turbulence: number
  opacity: number
  colorA: THREE.Color
  colorB: THREE.Color
  colorC: THREE.Color
}): ParticleUniforms {
  return {
    uTime: { value: 0 },
    uWindDir: { value: params.windDir },
    uParticleSpeed: { value: params.particleSpeed },
    uTrailLength: { value: params.trailLength },
    uParticleSize: { value: params.particleSize },
    uTurbulence: { value: params.turbulence },
    uOpacity: { value: params.opacity },
    uColorA: { value: params.colorA },
    uColorB: { value: params.colorB },
    uColorC: { value: params.colorC },
    // 根据父级 world scale 实时覆盖，小尺度默认为 1（与修改前等价）
    uWorldScale: { value: 1 },
  }
}

export interface BuiltCloud {
  geometry: THREE.BufferGeometry
  material: ParticleMaterial
  points: THREE.Points
}

export function buildParticleCloud(
  samplingMeshes: SamplingMesh[],
  uniforms: ParticleUniforms,
  options: BuildCloudOptions,
): BuiltCloud | null {
  if (samplingMeshes.length === 0) {
    return null
  }

  const MAX_PARTICLES = options.maxParticles ?? 150000
  const BASE_SAMPLE_COUNT = options.baseSampleCount ?? 4000
  const BASE_TRAIL_COUNT = options.baseTrailCount ?? 24

  let baseSampleCount = Math.max(
    64,
    Math.round(BASE_SAMPLE_COUNT * options.particleDensity * options.outlineDensity),
  )
  let trailCount = Math.max(2, Math.round(BASE_TRAIL_COUNT * options.trailDensity))
  let totalParticles = baseSampleCount * trailCount

  if (totalParticles > MAX_PARTICLES) {
    const ratio = MAX_PARTICLES / totalParticles
    baseSampleCount = Math.max(64, Math.floor(baseSampleCount * Math.sqrt(ratio)))
    trailCount = Math.max(2, Math.floor(trailCount * Math.sqrt(ratio)))
    totalParticles = baseSampleCount * trailCount
  }

  const totalAreaWeight = samplingMeshes.reduce((acc, entry) => acc + entry.area, 0)

  const positions = new Float32Array(totalParticles * 3)
  const seeds = new Float32Array(totalParticles)
  const lifeOffsets = new Float32Array(totalParticles)
  const trailOffsets = new Float32Array(totalParticles)
  const sizeFactors = new Float32Array(totalParticles)

  let writeIndex = 0
  const tempPosition = new THREE.Vector3()

  samplingMeshes.forEach((entry, idx) => {
    const portion = entry.area / totalAreaWeight
    const isLast = idx === samplingMeshes.length - 1
    const remainingSamples = Math.floor((totalParticles - writeIndex) / trailCount)
    const meshSampleCount = isLast
      ? Math.max(0, remainingSamples)
      : Math.min(remainingSamples, Math.max(1, Math.round(baseSampleCount * portion)))

    if (meshSampleCount <= 0) {
      return
    }

    const sampler = new MeshSurfaceSampler(entry.mesh).build()

    for (let s = 0; s < meshSampleCount; s += 1) {
      sampler.sample(tempPosition)
      const seed = Math.random()

      for (let t = 0; t < trailCount; t += 1) {
        if (writeIndex >= totalParticles) break
        const cursor = writeIndex * 3
        positions[cursor] = tempPosition.x
        positions[cursor + 1] = tempPosition.y
        positions[cursor + 2] = tempPosition.z
        seeds[writeIndex] = seed
        trailOffsets[writeIndex] = t / trailCount
        lifeOffsets[writeIndex] = Math.random()
        sizeFactors[writeIndex] = 0.65 + Math.random() * 0.6
        writeIndex += 1
      }
      if (writeIndex >= totalParticles) break
    }
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aLifeOffset', new THREE.BufferAttribute(lifeOffsets, 1))
  geometry.setAttribute('aTrailOffset', new THREE.BufferAttribute(trailOffsets, 1))
  geometry.setAttribute('aSizeFactor', new THREE.BufferAttribute(sizeFactors, 1))
  geometry.setDrawRange(0, writeIndex)

  const material = new CustomShaderMaterial({
    baseMaterial: THREE.PointsMaterial,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    fragmentShader: particleFragmentShader,
    silent: true,
    size: uniforms.uParticleSize.value,
    sizeAttenuation: true,
    toneMapped: false,
    transparent: true,
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    vertexShader: particleVertexShader,
  }) as ParticleMaterial

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  points.renderOrder = 8

  return { geometry, material, points }
}

export function disposeBuiltCloud(cloud: BuiltCloud | null) {
  if (!cloud) return
  cloud.points.removeFromParent()
  cloud.geometry.dispose()
  cloud.material.dispose()
}

// 递归释放加载进来的 GLB 场景资源
export function disposeLoadedScene(scene: THREE.Object3D | null) {
  if (!scene) return
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.geometry?.dispose()
    const mat = mesh.material
    if (Array.isArray(mat)) {
      mat.forEach(m => m.dispose())
    }
    else if (mat) {
      ;(mat as THREE.Material).dispose()
    }
  })
  scene.removeFromParent()
}

// 给加载进来的模型整体设置透明度 / 显示开关
export function applyModelOpacity(
  scene: THREE.Object3D | null,
  visible: boolean,
  opacity: number,
) {
  if (!scene) return
  scene.visible = visible
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const mat = mesh.material
    const applyToMat = (material: THREE.Material) => {
      if ('opacity' in material) {
        ;(material as THREE.MeshStandardMaterial).opacity = opacity
        material.transparent = opacity < 1
        material.needsUpdate = true
      }
    }
    if (Array.isArray(mat)) {
      mat.forEach(applyToMat)
    }
    else if (mat) {
      applyToMat(mat as THREE.Material)
    }
  })
}
