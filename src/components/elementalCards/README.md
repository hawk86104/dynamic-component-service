# 三维元素单卡

参考：[Zsolt Kacso 的元素卡片视频](https://x.com/kaolti/status/2110322552841056689/video/1)。本实现根据画面重建视觉结构，未使用原作者源码或视频贴图。

四个组件各自只显示一张卡片，可独立加入现有 TresJS 场景，不包含轮播或卡组逻辑。

| 入口 | 特效 |
| --- | --- |
| `emberElementalCardComponent.vue` | 三维噪声体积火焰、上升火星 |
| `solarElementalCardComponent.vue` | 胶囊轮廓放射光束、脉动日冕、光点 |
| `breezeElementalCardComponent.vue` | 上下分流的三维风场、宽尾迹、细白短线与弯钩粒子 |
| `bloomElementalCardComponent.vue` | 分层展开的杯状莲花、透光亮边、纵向细纹、碎瓣与空心心形 |

## 使用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import EmberCard from '../emberElementalCardComponent.vue'
import SolarCard from '../solarElementalCardComponent.vue'
import BreezeCard from '../breezeElementalCardComponent.vue'
import BloomCard from '../bloomElementalCardComponent.vue'

const playing = ref(true)
const enabled = ref(true)
const ember = ref<InstanceType<typeof EmberCard> | null>(null)
</script>

<template>
  <!-- 放在现有 TresCanvas 内。位置、旋转和缩放由宿主决定。 -->
  <EmberCard
    ref="ember"
    v-model:playing="playing"
    v-model:enabled="enabled"
    :position="[-3, 2, 0]"
    title="Ember"
    :flame-height="1"
    :ray-march-steps="48"
  />
  <SolarCard :position="[0, 2, 0]" :ray-count="128" />
  <BreezeCard :position="[3, 2, 0]" :depth-spread="0.24" :flow-speed="1" />
  <BloomCard :position="[6, 2, 0]" :bloom-amount="1" :opening-duration="0.48" />
</template>
```

上面的组件相对当前文件位于上一级目录，实际使用时按引用位置调整路径。组件远程暴露名与四个文件名一致，均由 `dcsConfig.ts` 自动纳入现有 federation 配置。

组件沿本地 XY 平面竖立，正面朝向 +Z，原点在卡片中心。所有特效和局部光晕跟随组件整体变换。建议使用深色背景；组件不修改宿主背景、灯光、相机、色调映射或后处理。

Breeze 与 Bloom 的目录展示姿态默认朝向正面，方便对照原片；在宿主场景仍可自由旋转、缩放。

## 通用参数

默认值由 `defaults.ts` 统一提供，并生成 Vue runtime props。所有数值均做有限值检查和限幅。

| 参数 | 默认值 | 范围/用途 |
| --- | --- | --- |
| `enabled` / `playing` | `true` / `true` | 显示与播放，支持 v-model |
| `width` / `height` / `thickness` | `1.45` / `2.45` / `0.14` | 世界单位；范围 0.3–8 / 0.6–12 / 0.04–0.8 |
| `title` / `subtitle` | 各元素英文标题与寄语 | 内置图标固定为对应元素；文字最多 160 字符，自动适应宽度 |
| `showLabel` / `textColor` | `true` / `#fff9f2` | 显示图标文字及其颜色 |
| `cardColor` / `secondaryColor` / `highlightColor` | 各元素配色 | 表面渐变与高光，支持三位或六位十六进制颜色 |
| `effectColor` | 各元素配色 | 外围特效、粒子和地面光晕的颜色 |
| `surfaceShine` | `0.85` | 0–2，卡片高光 |
| `effectIntensity` | `1.2` | 0–3；设为 0 隐藏外围特效、轮廓发光和粒子 |
| `animationSpeed` | `1` | 0–4；设为 0 冻结所有时间驱动动画 |
| `floatAmplitude` | `0.035` | 0–0.3，沿本地 Y 轴漂浮的幅度 |
| `particleCount` | 火 190 / 光 128 / 风 44 / 花 90 | 0–400 |
| `particleSize` | 火/风/花 0.018；光 0.016 | 0.005–0.12，世界尺寸，适配透视与正交相机 |
| `showGroundGlow` | `true` | 本地 XZ 平面的柔和光晕；不包含实时倒影 |
| `groundGlowIntensity` | `0.65` | 0–2 |
| `opacity` | `1` | 0–1，同时作用于本体与特效 |
| `seed` | `17` | 0–65535，粒子/光束/花瓣布局可复现 |

胶囊竖向布局要求宽度不超过高度的 90%，厚度不超过宽度的 45%；输入超出时会约束为有效尺寸。光晕平面位于本地 `y = -height × 0.69`，关闭后可以使用宿主的地面。默认不透明卡片写入深度；降低整体不透明度后使用常规透明排序。

## 元素参数

| 组件 | 参数 | 默认 / 范围 |
| --- | --- | --- |
| Ember | `flameHeight` / `flameWidth` | 1 / 0.2–2；1 / 0.5–1.8，相对卡宽的火冠和火舌比例 |
| Ember | `flameDepth` / `flameSpeed` | 0.42 / 0.15–0.9；1 / 0–3，空间纵深与单独火焰流速 |
| Ember | `tongueCount` / `coreBrightness` | 11 / 5–18；1.25 / 0–2.5，火舌数量与白热根部亮度 |
| Ember | `triangleRatio` | 0.1 / 0–0.35，空心三角在上方火星中的占比 |
| Ember | `turbulence` / `rayMarchSteps` | 0.8 / 0–2；48 / 16–72，采样成本随步数增加 |
| Ember | `coreColor` | `#fff1df`，暖白火焰核心；外焰默认 `effectColor: '#ff351c'` |
| Solar | `rayCount` / `rayLength` / `rayWidth` | 128 / 16–160；1.25 / 0.2–2.5；0.012 / 0.004–0.08 |
| Solar | `pulseAmount` / `coronaColor` | 0.18 / 0–0.8；`#fff8df` |
| Solar | `coronaWidth` / `coronaIntensity` | 0.014 / 0.004–0.05，日冕半径相对卡宽；1.35 / 0–3，日冕亮度 |
| Solar | `shaftOpacity` / `rayDepth` | 0.18 / 0–0.5，渐宽柔光透明度；0.22 / 0.03–0.8，光束前后纵深 |
| Solar | `solarSpeed` | 1 / 0–3，日冕、光束和光点的独立速度 |
| Solar | `ringRatio` / `particleSpread` | 0.12 / 0–0.5，空心环占比；0.55 / 0.1–1.2，沿发射方向的外移范围，相对卡宽 |
| Breeze | `streamCount` / `streamWidth` | 36 / 4–64，上下分流的曲带总数；0.009 / 0.003–0.05，细线宽度（世界单位） |
| Breeze | `orbitSpread` / `flowTurbulence` / `depthSpread` | 0.34 / 0.05–0.9，外侧路径间距；0.22 / 0–1，细微扰动；0.24 / 0.1–1.5，前后纵深 |
| Breeze | `flowSpeed` | 1 / 0–3，风线、亮边和粒子的独立速度；0 保持当前相位 |
| Breeze | `trailLength` / `trailGlow` | 0.24 / 0.08–0.75，亮线占路径的长度比例；0.24 / 0–0.8，宽柔尾迹强度 |
| Breeze | `rimIntensity` / `curlRatio` | 0.85 / 0–2.5，贴边亮流强度；0.16 / 0–0.4，弯钩粒子比例 |
| Bloom | `petalCount` / `petalSpread` / `petalHeight` | 9 / 6–24；1 / 0.4–1.8，水平扩展；1 / 0.4–1.6，高度倍率，瓣根保持锚定 |
| Bloom | `bloomAmount` / `petalOpacity` / `swayStrength` | 1 / 0–1，目标展开程度；0.64 / 0.1–1，表面透明度；0.1 / 0–0.7，轻微摇曳 |
| Bloom | `petalColor` / `tipColor` | `#e63292` / `#fff1e6`，玫红内部与暖白透光边缘 |
| Bloom | `petalCurl` / `petalDepth` | 0.35 / 0–0.8，杯状卷曲；0.32 / 0.05–0.8，瓣层前后深度，相对卡宽 |
| Bloom | `edgeBrightness` / `veinStrength` | 1.35 / 0–3，珍珠亮边及局部柔光；0.38 / 0–1，纵向细纹 |
| Bloom | `openingDuration` / `bloomSpeed` | 0.48 / 0–2，展开基础时长（秒），设 0 立即展开；1 / 0–3，花瓣/粒子独立速度 |
| Bloom | `breathAmount` / `heartRatio` | 0.025 / 0–0.15，展开后的细微呼吸；0.18 / 0–0.5，空心心形比例 |

## 公开接口

通过组件 ref 调用：

- `play()`：恢复时间推进，发出 `update:playing(true)`。
- `pause()`：暂停时间推进，发出 `update:playing(false)`。
- `restart()`：回到动画起点，保持当前播放/暂停状态；预览面板已提供按钮。
- `setEnabled(boolean)`：同步设置可见状态，发出 `update:enabled`。
- `getObject3D()`：返回该实例的根 `THREE.Group`。

参数通过 props 修改。风流线与局部柔光使用深度测试和加法混合；花瓣表面使用常规透明混合，边缘柔光为独立加法层。两者都关闭透明深度写入，不强制全场景渲染顺序；花瓣交叠处仍受 Three.js 常规透明排序约束。

Ember 的火冠根部沿上半圆和两肩发射，弯曲火舌分为前后两层，卡片四周使用单独的红色燃烧轮廓。火星分为上缘白热点、少量沿边余烬和空心三角。`flameSpeed` 只控制这些火焰部分，改变速度会连续推进相位，设为 0 保持当前形态；卡片渐变和漂浮仍受通用 `animationSpeed` 控制。

本次 Ember 调整的逐帧依据见 [frame-study.md](../../../openspec/changes/add-elemental-single-card-components/frame-study.md)。检查了原视频中三个连续片段共 165 帧，实际 GPU 观感仍未验收；用户本轮明确选择暂不运行预览。

Solar 使用独立的连续日冕，分为暖白核心、近场金色光晕和外层柔光。光束从卡心方向穿过胶囊轮廓向外发散，主体按短、中、长束分级，另外叠加 `rayCount × 2` 的近场细刺；`rayCount` 表示主体光束数。柔光沿同一条光束渐宽，光束保持固定角度并轻微闪动、伸缩。光点和空心环从轮廓向外漂移。`solarSpeed` 的修改连续推进相位，设为 0 保持当前形态；卡片漂浮仍由通用速度控制。

Solar 的逐帧依据见 [solar-frame-study.md](../../../openspec/changes/add-elemental-single-card-components/solar-frame-study.md)，共检查 180 个连续片段帧。沿用用户暂不运行的选择，本轮没有进行 GPU 视觉验收。

Breeze 的上下两组开放曲线从左向右绕过卡片，连接平缓入口、贴合上下半圆的中段和出口。宽柔尾迹形成青色场，细白短线在各自路径上前行；少量弯钩和细光点同向漂移，在路径两端淡入淡出。`streamCount` 是上下曲带总数，柔光和细线共用同一组路径，整个风场不做刚性旋转。`orbitSpread` 保留原参数名，现在控制开放路径的外扩间距。尺寸、扩散、纵深、流线数量或种子变化会重建所属曲带；线宽、扰动、尾迹长度、柔光及颜色只更新 uniform。

Bloom 默认按九个主要可见瓣尖建模：中间高瓣、左右高瓣、斜瓣、横展瓣、下方宽瓣；它不代表原作者实际网格数量。每片有独立曲面、杯状卷曲及纵深，卡片实体遮住瓣根。瓣面细纹沿长度展开，亮边使用暖白色，碎瓣与空心小心形主要从上缘缓慢漂起。默认副标题对应原片 `HEART · WARMTH`。

`bloomAmount` 指定目标展开程度；`openingDuration` 控制一次性的展开，高瓣先展开、底瓣稍后，最后一层完成约需基础时长的 1.34 倍（默认约 0.64 秒）。`restart()` 会重新展开；设 `openingDuration: 0` 则直接显示目标姿态。`bloomSpeed: 0` 保持当前花瓣与粒子相位，卡片漂浮仍由通用时钟驱动。花瓣表面参数、开合程度、时长及速度不重建几何；数量、宽高、扩展、卷曲、深度和种子会重建本实例的曲面。表面和柔光共享几何，并随展开更新各自的排序中心。

Breeze / Bloom 的逐帧依据见 [breeze-bloom-frame-study.md](../../../openspec/changes/add-elemental-single-card-components/breeze-bloom-frame-study.md)，分别检查三个连续片段的 165 / 154 帧，包含激活、稳定与切换。CPU 几何测得默认 Bloom 宽约为卡宽的 2.59 倍，最高点在 `0.64 × 卡高`、最低点在 `-0.54 × 卡高`（卡片原点为中心）；此数据不代表 GPU 视觉验收。沿用用户暂不运行的选择，没有运行构建或浏览器调试。

## 验证

`scripts/check-elemental-cards.mjs` 使用 CPU 检查参数边界、三维几何、材质/纹理所有权、运行时更新、实例独立性及释放，不创建 WebGL 上下文。运行方式：

```sh
node --experimental-vm-modules scripts/check-elemental-cards.mjs
```

类型检查、定向 lint、CPU 检查与 OpenSpec 检查无法证明 GPU 编译、最终视觉相似度或帧率。遵守项目 AGENTS.md，不自动运行构建、dev/serve/preview、本地服务或浏览器调试。目录封面是静态 SVG 示意图。
