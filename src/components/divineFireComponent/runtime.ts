import {
  AdditiveBlending,
  AnimationMixer,
  Box3,
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix3,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  ShaderMaterial,
  SkinnedMesh,
  Uniform,
  Vector3,
} from 'three'
import type { AnimationClip, Camera, Light, Material, Object3D } from 'three'
import type { DivineFireSettings } from './defaults'
import { createFireGeometry } from './geometry'
import { disposeSubjects } from './resources'
import vertexShader from '../../shader/divineFireComponent/fire.vert?raw'
import fragmentShader from '../../shader/divineFireComponent/fire.frag?raw'
import noiseShader from '../../shader/divineFireComponent/noise.glsl?raw'

const NUMERIC_UNIFORMS = {
  height: 'uHeight',
  inflate: 'uInflate',
  tongueScale: 'uTongueScale',
  tongueSpeed: 'uTongueSpeed',
  tongueVariation: 'uTongueVariation',
  erosion: 'uErosion',
  softness: 'uSoftness',
  fresnelPower: 'uFresnelPower',
  textureScale: 'uTextureScale',
  scrollSpeed: 'uScrollSpeed',
  distortion: 'uDistortion',
  distortionSpeed: 'uDistortionSpeed',
  brightness: 'uBrightness',
} as const

export function createCubeSubject() {
  const geometry = new BoxGeometry(1, 1, 1, 10, 10, 10)
  const material = new MeshStandardMaterial({
    color: '#2b231e',
    roughness: 0.85,
    metalness: 0.05,
    emissive: '#2b231e',
    emissiveIntensity: 0.15,
  })
  const mesh = new Mesh(geometry, material)
  mesh.name = 'DivineFireCube'
  return mesh
}

export function createFireSubject(
  model: Object3D,
  animations: AnimationClip[],
  initial: DivineFireSettings,
  disposeSource: () => void = () => disposeSubjects([model]),
) {
  model.updateMatrixWorld(true)
  // Imported punctual lights must not illuminate the editor's surrounding scene.
  const auxiliary: Object3D[] = []
  model.traverse((node) => {
    if ((node as Light).isLight || (node as Camera).isCamera) { auxiliary.push(node) }
  })
  auxiliary.forEach((node) => {
    const parent = node.parent
    if (parent) { [...node.children].forEach(child => parent.attach(child)) }
    node.removeFromParent()
  })

  const sources: Mesh[] = []
  model.traverse((node) => {
    if ((node as Mesh).isMesh && (node as Mesh).geometry.getAttribute('position')?.count) {
      sources.push(node as Mesh)
    }
  })
  if (!sources.length) { throw new Error('模型中没有可附着火焰的 Mesh 网格。') }
  const bounds = new Box3().setFromObject(model)
  const size = bounds.getSize(new Vector3())
  const longest = Math.max(size.x, size.y, size.z)
  if (!Number.isFinite(longest) || longest <= 1e-8) { throw new Error('模型包围盒无效或尺寸为零。') }
  const center = bounds.getCenter(new Vector3())
  const group = new Group()
  group.name = 'DivineFireSubject'
  const fit = new Group()
  const offset = new Group()
  offset.position.set(-center.x, -bounds.min.y, -center.z)
  offset.add(model)
  fit.add(offset)
  group.add(fit)

  const uniforms = {
    uTime: new Uniform(0),
    uIntensity: new Uniform(0),
    uHeight: new Uniform(initial.height),
    uInflate: new Uniform(initial.inflate),
    uTongueScale: new Uniform(initial.tongueScale),
    uTongueSpeed: new Uniform(initial.tongueSpeed),
    uTongueVariation: new Uniform(initial.tongueVariation),
    uErosion: new Uniform(initial.erosion),
    uSoftness: new Uniform(initial.softness),
    uFresnelPower: new Uniform(initial.fresnelPower),
    uTextureScale: new Uniform(initial.textureScale),
    uScrollSpeed: new Uniform(initial.scrollSpeed),
    uDistortion: new Uniform(initial.distortion),
    uDistortionSpeed: new Uniform(initial.distortionSpeed),
    uBrightness: new Uniform(initial.brightness),
    uColorCore: new Uniform(new Color(initial.colorCore)),
    uColorMid: new Uniform(new Color(initial.colorMid)),
    uColorDeep: new Uniform(new Color(initial.colorDeep)),
  }
  const sourceVisibility = new Map<Material, boolean>()
  sources.forEach((mesh) => {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach(material => sourceVisibility.set(material, material.visible))
  })
  const overlays: Mesh[] = []
  const inverseRoot = new Matrix4()

  function disposeOverlays() {
    overlays.forEach((overlay) => {
      overlay.removeFromParent()
      overlay.geometry.dispose()
      ;(overlay.material as ShaderMaterial).dispose()
      if ((overlay as InstancedMesh).isInstancedMesh) {
        // The original subject owns any shared instanced morph texture.
        ;(overlay as InstancedMesh).morphTexture = null
        ;(overlay as InstancedMesh).dispose()
      }
    })
    overlays.length = 0
    sourceVisibility.forEach((visible, material) => { material.visible = visible })
  }

  try {
    sources.forEach((source) => {
      const geometry = createFireGeometry(source.geometry)
      const material = new ShaderMaterial({
        vertexShader: `${noiseShader}\n${vertexShader}`,
        fragmentShader: `${noiseShader}\n${fragmentShader}`,
        uniforms: {
          ...uniforms,
          uMeshToRoot: new Uniform(new Matrix4()),
          uRootToView: new Uniform(new Matrix4()),
          uMeshNormalToRoot: new Uniform(new Matrix3()),
          uRootNormalToView: new Uniform(new Matrix3()),
        },
        transparent: true,
        depthTest: true,
        depthWrite: false,
        toneMapped: false,
        side: DoubleSide,
        forceSinglePass: true,
        blending: AdditiveBlending,
        clipping: true,
      })
      let overlay: Mesh
      if ((source as SkinnedMesh).isSkinnedMesh) {
        const skinned = source as SkinnedMesh
        const shell = new SkinnedMesh(geometry, material)
        shell.bindMode = skinned.bindMode
        shell.bind(skinned.skeleton, skinned.bindMatrix)
        overlay = shell
      }
      else if ((source as InstancedMesh).isInstancedMesh) {
        const instanced = source as InstancedMesh
        const shell = new InstancedMesh(geometry, material, instanced.count)
        shell.instanceMatrix = instanced.instanceMatrix
        shell.morphTexture = instanced.morphTexture
        overlay = shell
      }
      else {
        overlay = new Mesh(geometry, material)
      }
      overlay.morphTargetInfluences = source.morphTargetInfluences
      overlay.morphTargetDictionary = source.morphTargetDictionary
      overlay.name = `${source.name || 'mesh'}__divineFire`
      overlay.userData.isDivineFireOverlay = true
      overlay.frustumCulled = false
      overlay.renderOrder = source.renderOrder + 1
      overlay.raycast = () => {}
      overlay.onBeforeRender = (_renderer, _scene, camera) => {
        inverseRoot.copy(group.matrixWorld).invert()
        const local = material.uniforms.uMeshToRoot.value as Matrix4
        const view = material.uniforms.uRootToView.value as Matrix4
        local.multiplyMatrices(inverseRoot, overlay.matrixWorld)
        view.multiplyMatrices(camera.matrixWorldInverse, group.matrixWorld)
        material.uniforms.uMeshNormalToRoot.value.getNormalMatrix(local)
        material.uniforms.uRootNormalToView.value.getNormalMatrix(view)
        overlay.morphTargetInfluences = source.morphTargetInfluences
        if ((source as InstancedMesh).isInstancedMesh) {
          const shell = overlay as InstancedMesh
          const instanced = source as InstancedMesh
          shell.count = instanced.count
          shell.instanceMatrix = instanced.instanceMatrix
          shell.morphTexture = instanced.morphTexture
        }
      }
      source.add(overlay)
      overlays.push(overlay)
    })
  }
  catch (error) {
    disposeOverlays()
    throw error
  }

  const mixer = animations.length ? new AnimationMixer(model) : null
  if (mixer) { mixer.clipAction(animations[0]).play() }
  let disposed = false
  function update(settings: DivineFireSettings) {
    fit.scale.setScalar(settings.modelSize / longest)
    sourceVisibility.forEach((visible, material) => { material.visible = settings.showSource && visible })
    for (const key of Object.keys(NUMERIC_UNIFORMS) as Array<keyof typeof NUMERIC_UNIFORMS>) {
      uniforms[NUMERIC_UNIFORMS[key]].value = settings[key]
    }
    uniforms.uColorCore.value.set(settings.colorCore)
    uniforms.uColorMid.value.set(settings.colorMid)
    uniforms.uColorDeep.value.set(settings.colorDeep)
  }
  update(initial)

  return {
    group,
    update,
    tick(delta: number, time: number, intensity: number) {
      if (disposed) { return }
      mixer?.update(delta)
      uniforms.uTime.value = time
      uniforms.uIntensity.value = intensity
      overlays.forEach((overlay) => { overlay.visible = intensity > 0.0001 })
    },
    dispose() {
      if (disposed) { return }
      disposed = true
      mixer?.stopAllAction()
      mixer?.uncacheRoot(model)
      group.removeFromParent()
      disposeOverlays()
      disposeSource()
      group.clear()
    },
  }
}

export type FireSubject = ReturnType<typeof createFireSubject>
