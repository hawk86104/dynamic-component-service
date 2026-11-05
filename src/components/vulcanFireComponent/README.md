# 火山火焰 / Vulcan Fire

组件类型：`vulcanFireComponent`。通过现有组件目录或 `/#/preview/vulcanFireComponent` 进入预览；注册后沿用项目的 federation 自动发布配置。

在已有 TresCanvas 的场景中挂载组件。组件本地原点位于发射口，沿局部 +Y 方向燃烧；通过父级 Object3D 调整位置、旋转和缩放。

```vue
<script setup lang="ts">
import VulcanFire from './components/vulcanFireComponent.vue'
</script>

<template>
  <TresGroup :position="[0, 0, 0]">
    <VulcanFire
      :fire-count="24"
      :smoke-enabled="true"
      :ground-visible="false"
      :light-enabled="false"
    />
  </TresGroup>
</template>
```

## 配置

组件 props、注册默认值共用 `defaults.ts`，所有公开参数都有配置面板入口。

| 分组 | 参数 | 说明 |
| --- | --- | --- |
| 播放 | `autoPlay`, `animationSpeed` | 暂停整个动画；速度为 0 同样暂停，恢复后继续 |
| 火焰 | `fireCount`, `playbackSpeed`, `sizeMin`, `sizeMax`, `riseSpeed`, `emitterRadius`, `bindStrength`, `decaySpeed` | 数量、纹理播放、粒径、上升、范围、聚拢与消散；纹理速度为 0 只冻结纹理播放 |
| 颜色 | `intensity`, `colorLow`, `colorMid`, `colorHigh`, `additiveBlending` | 亮度、外焰到焰心渐变、普通/叠加混合 |
| 烟雾 | `smokeEnabled`, `smokeCount`, `smokeOpacity`, `smokeRiseSpeed`, `smokeGrowth`, `smokeColor` | 独立的烟雾开关、数量、浓淡、上升和膨胀 |
| 火焰纹理 | `volumeSize`, `volumeFrames`, `volumeOctaves`, `volumeFrequency`, `turbulence`, `flameWidth`, `seed` | 程序火焰细节；更改后等待 150ms 合并重生成，释放旧纹理 |
| 环境点缀 | `glowEnabled`, `glowIntensity`, `groundVisible`, `groundRadius`, `lightEnabled`, `lightIntensity` | 局部柔光、深色圆形地面及可照亮周围物体的点光源 |

默认 24 个火焰粒子、40 个烟雾粒子，每层上限 64；设置数量为 0 可隐藏该层。粒径上下界写反时自动归一化。无效数字回退到默认值，越界值限制在安全范围。

使用 WebGL2 的 `Data3DTexture`，默认 `64 × 64 × 64` 单通道纹理（256 KiB 原始密度数据）。最高支持 `128 × 128 × 64`，高分辨率和多层噪声会增加重生成开销。颜色和普通运动参数更新不会重建纹理。

## 场景集成

- 火焰和烟雾是相机朝向的实例化面片，不是可穿行的实体体积；真正的 GPU 流体仿真可使用已有 `volumetricFluidFlameComponent`。
- 发射中心遵循父级完整变换；面片尺寸遵循父级 X/Y 缩放的长度。旋转会改变发射方向，面片保持朝向相机。
- 每层按相机空间深度排序，烟雾层先绘制、火焰层后绘制。与场景中其他透明物体的交错排序仍受 Three.js 透明渲染规则限制。
- 自定义材质包含对数深度与裁剪片段，保留深度测试、关闭透明层深度写入；不接管场景背景、相机或后期处理。
- 本地柔光替代原示例的全场景 Bloom，因此显示方式与原站存在差异。
- 不请求外部火焰或烟雾图片。卸载时清理所有纹理、材质、几何体和待执行的纹理更新。

## 来源与验证

见 [SOURCE_NOTES.md](./SOURCE_NOTES.md)。首页卡片使用本组件真实渲染生成的 600×400 动态 WebP：40 帧、3.333 秒、约 110 KiB。静态封面与动图首帧完全一致，指针悬停时播放、移出后恢复封面。原 SVG 示意素材保留，不再作为首页预览。

2026-11-05 按用户明确要求，复用已运行的本地预览服务录制默认参数下的火焰和烟雾，仅临时调整录制镜头、隐藏网格与调试界面。已检查首页封面加载、悬停播放及移出恢复；可使用 `$tvt-dc-preview-capture` 为单个组件重新生成预览。

依照本项目 `AGENTS.md`，未运行 build/dev/serve 或启动服务，跳过额外构建和调试验证。本次录制不代表已验证所有 GPU 驱动、GIS 场景集成或与原站的精确视觉一致性。
