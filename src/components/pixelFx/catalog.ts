import { PAL } from '../../vendor/pixelfx/core/color.js'
import type { ConfigSchema } from '../../views/createConfigPane'
import { getPixelFxDefaults, PIXEL_FX_MAX_SEED } from './defaults'
import { PIXEL_FX_EFFECTS } from './effects'

export const PIXEL_FX_CONFIG: ConfigSchema = {
  renderMode: {
    name: '呈现类型',
    com: 'Select',
    options: [
      { label: '公告牌（保持竖直）', value: 'billboard' },
      { label: '精灵（完整面向相机）', value: 'sprite' },
      { label: '固定立面（XY）', value: 'vertical' },
      { label: '地面（XZ）', value: 'ground' },
    ],
  },
  width: { name: '纹理平面宽度', com: 'Slider', min: 0.1, max: 50, step: 0.1 },
  opacity: { name: '整体不透明度', com: 'Slider', min: 0, max: 1, step: 0.01 },
  palette: {
    name: 'Palette 配色',
    com: 'Select',
    options: [
      { label: '原始配色（its own）', value: '' },
      ...Object.keys(PAL).map(name => ({ label: name, value: name })),
    ],
  },
  seed: { name: '随机种子', com: 'Slider', min: 1, max: PIXEL_FX_MAX_SEED, step: 1 },
  newSeed: { name: '新种子（New Seed）', com: 'ActionButton', action: 'newSeed' },
  mirror: { name: '水平镜像（Mirror）', com: 'Switch' },
  playing: { name: '播放动画', com: 'Switch' },
  playbackRate: { name: '播放速度', com: 'Slider', min: 0, max: 4, step: 0.05 },
  loop: { name: '循环播放', com: 'Switch' },
  restart: { name: '重新播放', com: 'ActionButton', action: 'restart' },
}

export const PIXEL_FX_ENTRIES = PIXEL_FX_EFFECTS.map(effect => ({
  name: `PixelFX · ${effect.categoryName} · ${effect.name}`,
  type: effect.type,
  comFile: `./src/components/pixelFx/${effect.category}/${effect.type}.vue`,
  previewPath: `./preview/animated/pixelFx/${effect.type}.webp`,
  previewPosterPath: `./preview/animated/pixelFx/${effect.type}.poster.webp`,
  previewTransform: true,
  description: `${effect.description} 公告牌绕本地 Y 轴转向相机，精灵随相机俯仰。支持固定立面、地面、配色、种子和水平镜像。${effect.screenSpace ? '界面或全幅效果显示在局部纹理面板。' : ''}默认循环播放。`,
  default: getPixelFxDefaults(effect.id),
  defaultObject3D: {},
  config: { ...PIXEL_FX_CONFIG },
}))

export const PIXEL_FX_FIRE_ENTRIES = PIXEL_FX_ENTRIES.filter(effect => effect.comFile.includes('/fire/'))
