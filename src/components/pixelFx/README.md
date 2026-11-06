# PixelFX 三维像素特效

动态组件服务发布 19 类、201 个独立效果。目录按火焰、爆炸、冰霜、近战等分类，组件名和 `type` 都可用于搜索。[组件清单](./CATALOG.md)

## 参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `renderMode` | `billboard` | `billboard` 保持本地竖直，只绕 Y 轴转向相机。`sprite` 完整面向相机，跟随俯仰和滚转。`vertical` 固定在本地 XY，`ground` 固定在本地 XZ。 |
| `width` | `4` | 完整纹理的世界宽度，包含透明留白。高度沿用原图比例。 |
| `opacity` | `1` | 整体不透明度，范围 0–1。 |
| `palette` | `''` | 空值沿用效果本身的配色。下拉菜单提供上游的 27 个预设，包括 fire、lava、water、ice 和 neon。 |
| `seed` | 每项的原始种子 | 1–9999 的整数。相同配色和种子可以复现该效果。 |
| `mirror` | `false` | 在原锚点水平翻转，适用于四种呈现类型。 |
| `playing` | `true` | 暂停保留当前画面。恢复后继续播放。 |
| `playbackRate` | `1` | 范围 0–4，0 表示冻结动画。 |
| `loop` | `true` | 默认循环。显式传入 `false` 时在一轮结束后清空。 |

抬高预览相机后切换公告牌和精灵，可以看到公告牌保持直立，精灵仍以正面朝向相机。两种模式使用相同的原始像素锚点。

调整配色或种子会重播。配置面板的“新种子（New Seed）”调用 `newSeed()`，生成不同的种子并更新当前效果。它返回 `{ seed }`，宿主可以合并到配置中保存。`restart()` 使用当前参数重播。

```vue
<script setup lang="ts">
import PixelFxCampfire from './fire/pixelFxCampfireComponent.vue'
</script>

<template>
  <PixelFxCampfire render-mode="sprite" palette="water" :seed="42" mirror />
</template>
```

## 独立特效与迁移

12 项 `moves` 串联动作和 31 项依赖示例人物像素的效果已下架。29 项能独立绘制的演示动作改为只播放效果，如剑斩、护盾和冰霜新星。旧场景若引用下架的 `type`，可在清单中查询并改用单独效果。旧场景保存的 `loop: false` 仍按单次播放处理。[下架条目](./CATALOG.md#下架条目)

组件沿用原项目的 `meta.origin` 作为锚点。将效果放在场景 Group 下，可通过宿主变换控制位置、朝向和大小。UI、天气和转场使用局部纹理面板。

## 源码与预览

上游版本为 0.3.0，固定提交 `a84159688af3ca37a4be05a0d422b94451b2e24e`。原始模块、文件哈希、MIT LICENSE 和 NOTICE 位于 `src/vendor/pixelfx/`。[PixelFX](https://github.com/patch-gg/pixelfx)

201 项分别提供 600×400 循环 WebP 和同首帧封面。素材由独立效果离线绘制，`public/preview/animated/pixelFx/manifest.json` 记录来源、时长、帧数和哈希。使用 Node、TypeScript 和 FFmpeg 运行下面的命令，可转换缺失或输入已变化的预览。

```powershell
node scripts/convert-pixelfx-previews.mjs
```
