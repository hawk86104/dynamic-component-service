import { PIXEL_FX_ADDITIONAL_EFFECTS } from './library'

const FIRE_EFFECTS = [
  { id: 'fire/brazier', type: 'pixelFxBrazierComponent', name: '像素火盆', seed: 8, description: '铁制三脚火盆、炽热煤炭、上升火星与地面暖光。' },
  { id: 'fire/campfire', type: 'pixelFxCampfireComponent', name: '像素篝火', seed: 3, description: '交叉木柴上的跳跃火焰、余烬、卷烟和暖色光晕。' },
  { id: 'fire/candle', type: 'pixelFxCandleComponent', name: '像素蜡烛', seed: 2, description: '黄铜烛盘、蜡滴、蓝色焰根与轻摆烛火。' },
  { id: 'fire/fire-breath', type: 'pixelFxFireBreathComponent', name: '像素火焰吐息', seed: 6, description: '从锚点向右喷出的锥形火焰、烟雾和火星。' },
  { id: 'fire/fire-ring', type: 'pixelFxFireRingComponent', name: '像素火环', seed: 6, description: '由脚下闪光向外扩散的燃烧火环，最后留下冷却焦痕。' },
  { id: 'fire/fire-tornado', type: 'pixelFxFireTornadoComponent', name: '像素火龙卷', seed: 4, description: '螺旋火带、旋转火焰底环和绕行余烬。' },
  { id: 'fire/fireball', type: 'pixelFxFireballComponent', name: '像素火球', seed: 5, description: '朝右的白热火球与向左延伸的撕裂火尾、烟雾。' },
  { id: 'fire/flame-pillar', type: 'pixelFxFlamePillarComponent', name: '像素火柱', seed: 5, description: '地面预兆、冲天火柱、喷溅余烬与散去的烟雾。' },
  { id: 'fire/flamethrower', type: 'pixelFxFlamethrowerComponent', name: '像素喷火器', seed: 3, description: '蓝色喷口、向右的高压火流与下落燃烧液滴。' },
  { id: 'fire/meteor', type: 'pixelFxMeteorComponent', name: '像素陨石', seed: 9, description: '燃烧陨石从左上方落下，撞击后飞散碎石并留下余火。' },
  { id: 'fire/spirit-flame', type: 'pixelFxSpiritFlameComponent', name: '像素幽灵火焰', seed: 7, description: '蓝绿色空心幽灵火焰、细长火尾和上升冷色火星。' },
  { id: 'fire/torch', type: 'pixelFxTorchComponent', name: '像素火把', seed: 4, description: '铁支架上的木制火把，带烟雾、火星和闪动光晕。' },
] as const

export const PIXEL_FX_FIRE_EFFECTS = FIRE_EFFECTS.map(effect => ({
  ...effect,
  category: 'fire' as const,
  categoryName: '火焰',
  screenSpace: false,
}))

export const PIXEL_FX_EFFECTS = [...PIXEL_FX_FIRE_EFFECTS, ...PIXEL_FX_ADDITIONAL_EFFECTS] as const

export type PixelFxEffectId = typeof PIXEL_FX_EFFECTS[number]['id']

export function getPixelFxEffect(effectId: PixelFxEffectId) {
  const effect = PIXEL_FX_EFFECTS.find(item => item.id === effectId)
  if (!effect) {
    throw new Error(`Unknown PixelFX effect: ${effectId}`)
  }
  return effect
}
