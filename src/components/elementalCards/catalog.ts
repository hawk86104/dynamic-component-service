import type { ConfigSchema, ConfigSchemaItem } from '../../views/createConfigPane'
import {
  BLOOM_CARD_DEFAULTS,
  BLOOM_CARD_RANGES,
  BREEZE_CARD_DEFAULTS,
  BREEZE_CARD_RANGES,
  COMMON_CARD_RANGES,
  EMBER_CARD_DEFAULTS,
  EMBER_CARD_RANGES,
  SOLAR_CARD_DEFAULTS,
  SOLAR_CARD_RANGES,
} from './defaults'
import type { CardOptions, NumericRanges } from './types'

function slider(name: string, group: string, key: string, ranges: NumericRanges = COMMON_CARD_RANGES): ConfigSchemaItem {
  const [min, max, step] = ranges[key]
  return { name, group, com: 'Slider', min, max, step }
}
const color = (name: string, group = '配色'): ConfigSchemaItem => ({ name, group, com: 'ColorPicker' })
const toggle = (name: string, group: string): ConfigSchemaItem => ({ name, group, com: 'Switch' })

export const COMMON_CARD_CONFIG: Record<keyof CardOptions, ConfigSchemaItem> = {
  enabled: toggle('显示组件', '播放'),
  playing: toggle('播放动画', '播放'),
  animationSpeed: slider('动画速度', '播放', 'animationSpeed'),
  floatAmplitude: slider('漂浮幅度', '播放', 'floatAmplitude'),
  width: slider('卡片宽度', '卡片', 'width'),
  height: slider('卡片高度', '卡片', 'height'),
  thickness: slider('卡片厚度', '卡片', 'thickness'),
  showLabel: toggle('显示图标文字', '文字'),
  title: { name: '标题', group: '文字', com: 'Text' },
  subtitle: { name: '副标题', group: '文字', com: 'Text' },
  textColor: color('图标文字颜色', '文字'),
  cardColor: color('卡片主色'),
  secondaryColor: color('渐变辅助色'),
  highlightColor: color('卡片高光色'),
  effectColor: color('元素特效色'),
  surfaceShine: slider('表面高光', '外观', 'surfaceShine'),
  effectIntensity: slider('特效强度', '外观', 'effectIntensity'),
  opacity: slider('整体不透明度', '外观', 'opacity'),
  particleCount: slider('粒子数量', '粒子', 'particleCount'),
  particleSize: slider('粒子尺寸', '粒子', 'particleSize'),
  seed: slider('随机种子', '粒子', 'seed'),
  showGroundGlow: toggle('显示局部地面光晕', '地面光晕'),
  groundGlowIntensity: slider('地面光晕强度', '地面光晕', 'groundGlowIntensity'),
}

function controls(config: ConfigSchema): ConfigSchema {
  return {
    ...COMMON_CARD_CONFIG,
    ...config,
    restart: { name: '动画回到起点', group: '播放', com: 'ActionButton', action: 'restart' },
  }
}

const defaultObject3D = () => ({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: -0.12, y: 0.45, z: 0 },
  scale: { x: 1.5, y: 1.5, z: 1.5 },
})

export const ELEMENTAL_CARD_ENTRIES = [
  {
    name: '元素卡片 · 火焰 Ember',
    type: 'emberElementalCardComponent',
    comFile: './src/components/emberElementalCardComponent.vue',
    previewPath: './preview/emberElementalCardComponent.svg',
    previewTransform: true,
    description: 'Ember 单卡：上半圈白热火冠、红色卷曲火舌、沿边余烬和空心三角火星。可调焰高、焰宽、纵深、火舌数量、白热亮度及火焰速度。建议深色背景。',
    default: { ...EMBER_CARD_DEFAULTS },
    defaultObject3D: { ...defaultObject3D(), position: { x: 0, y: -0.55, z: 0 } },
    config: controls({
      flameHeight: slider('火焰高度', '火焰', 'flameHeight', EMBER_CARD_RANGES),
      flameWidth: slider('火焰宽度', '火焰', 'flameWidth', EMBER_CARD_RANGES),
      flameDepth: slider('火冠纵深', '火焰', 'flameDepth', EMBER_CARD_RANGES),
      flameSpeed: slider('火焰流速', '火焰', 'flameSpeed', EMBER_CARD_RANGES),
      tongueCount: slider('火舌数量', '火焰', 'tongueCount', EMBER_CARD_RANGES),
      coreBrightness: slider('白热根部亮度', '火焰', 'coreBrightness', EMBER_CARD_RANGES),
      triangleRatio: slider('空心三角占比', '火星', 'triangleRatio', EMBER_CARD_RANGES),
      turbulence: slider('火焰扰动', '火焰', 'turbulence', EMBER_CARD_RANGES),
      rayMarchSteps: slider('体积采样步数', '火焰', 'rayMarchSteps', EMBER_CARD_RANGES),
      coreColor: color('火焰核心颜色', '火焰'),
    }),
  },
  {
    name: '元素卡片 · 太阳 Solar',
    type: 'solarElementalCardComponent',
    comFile: './src/components/solarElementalCardComponent.vue',
    previewPath: './preview/solarElementalCardComponent.svg',
    previewTransform: true,
    description: 'Solar 单卡：连续暖白日冕、密集短光刺、分级金色长束、柔光与向外漂移的空心光环。可调日冕宽度/亮度、光束数量/纵深、柔光、独立速度与光环比例。建议深色背景。',
    default: { ...SOLAR_CARD_DEFAULTS },
    defaultObject3D: defaultObject3D(),
    config: controls({
      rayCount: slider('光束数量', '太阳光束', 'rayCount', SOLAR_CARD_RANGES),
      rayLength: slider('光束长度', '太阳光束', 'rayLength', SOLAR_CARD_RANGES),
      rayWidth: slider('光束宽度', '太阳光束', 'rayWidth', SOLAR_CARD_RANGES),
      pulseAmount: slider('脉动幅度', '太阳光束', 'pulseAmount', SOLAR_CARD_RANGES),
      coronaColor: color('日冕核心颜色', '太阳光束'),
      coronaWidth: slider('日冕宽度', '日冕', 'coronaWidth', SOLAR_CARD_RANGES),
      coronaIntensity: slider('日冕亮度', '日冕', 'coronaIntensity', SOLAR_CARD_RANGES),
      shaftOpacity: slider('光束柔光', '太阳光束', 'shaftOpacity', SOLAR_CARD_RANGES),
      rayDepth: slider('光束纵深', '太阳光束', 'rayDepth', SOLAR_CARD_RANGES),
      solarSpeed: slider('太阳特效速度', '太阳光束', 'solarSpeed', SOLAR_CARD_RANGES),
      ringRatio: slider('空心光环占比', '太阳光点', 'ringRatio', SOLAR_CARD_RANGES),
      particleSpread: slider('光点外移范围', '太阳光点', 'particleSpread', SOLAR_CARD_RANGES),
    }),
  },
  {
    name: '元素卡片 · 风流 Breeze',
    type: 'breezeElementalCardComponent',
    comFile: './src/components/breezeElementalCardComponent.vue',
    previewPath: './preview/breezeElementalCardComponent.svg',
    previewTransform: true,
    description: '独立三维风流单卡：青绿色空间流线前后环绕胶囊，沿曲带移动的高光和细粒子表现风速。可调流线数量、宽度、扩散、扰动和纵深。建议深色背景。封面为示意图。',
    default: { ...BREEZE_CARD_DEFAULTS },
    defaultObject3D: defaultObject3D(),
    config: controls({
      streamCount: slider('流线数量', '风流线', 'streamCount', BREEZE_CARD_RANGES),
      streamWidth: slider('流线宽度', '风流线', 'streamWidth', BREEZE_CARD_RANGES),
      orbitSpread: slider('环绕扩散', '风流线', 'orbitSpread', BREEZE_CARD_RANGES),
      flowTurbulence: slider('流线扰动', '风流线', 'flowTurbulence', BREEZE_CARD_RANGES),
      depthSpread: slider('环绕纵深', '风流线', 'depthSpread', BREEZE_CARD_RANGES),
    }),
  },
  {
    name: '元素卡片 · 花瓣 Bloom',
    type: 'bloomElementalCardComponent',
    comFile: './src/components/bloomElementalCardComponent.vue',
    previewPath: './preview/bloomElementalCardComponent.svg',
    previewTransform: true,
    description: '独立三维花瓣单卡：多层弯曲花瓣包围胶囊，带半透明边缘高光、细纹和缓慢摇曳。可调花瓣数量、展开、高度、透明度和配色。花瓣为实际曲面网格；建议深色背景。封面为示意图。',
    default: { ...BLOOM_CARD_DEFAULTS },
    defaultObject3D: defaultObject3D(),
    config: controls({
      petalCount: slider('花瓣数量', '花瓣', 'petalCount', BLOOM_CARD_RANGES),
      petalSpread: slider('花瓣扩展', '花瓣', 'petalSpread', BLOOM_CARD_RANGES),
      petalHeight: slider('花瓣高度', '花瓣', 'petalHeight', BLOOM_CARD_RANGES),
      bloomAmount: slider('展开程度', '花瓣', 'bloomAmount', BLOOM_CARD_RANGES),
      petalOpacity: slider('花瓣不透明度', '花瓣', 'petalOpacity', BLOOM_CARD_RANGES),
      petalColor: color('花瓣主色', '花瓣'),
      tipColor: color('花瓣边缘高光色', '花瓣'),
      swayStrength: slider('摇曳幅度', '花瓣', 'swayStrength', BLOOM_CARD_RANGES),
    }),
  },
]
