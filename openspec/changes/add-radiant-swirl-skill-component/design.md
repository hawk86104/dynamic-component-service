## 背景

用户提供的参考图是一张四帧并列的技能前摇效果：绿色能量从“发散的光叶碎片”逐步汇聚到“完整的旋转能量环 + 核心光球”。如果拆成独立组件或逐帧 sprite，会违反“基于 shader”和“代码逻辑清晰、简单”的约束。因此本次选择“单平面 + 程序化 shader”的方案。

## 目标

- 用一个平面 + `CustomShaderMaterial` 完成四帧演进，让 shader 内部用单一 `progress` 平滑驱动
- 对业务方和预览都能开箱即用
- 把调参分成三组语义清晰的面板：动画节奏、颜色、形态

## 非目标

- 不复刻参考图文字“攻击敌人”
- 不引入 sprite 动画、外部纹理、后期合成
- 不替换或侵入现有预览入口文件
- 不在组件里搞多 mesh/粒子系统混合，保持单 mesh 单材质

## 演进模型

在 shader 内部只保留一个 `uProgress`：

- `progress = 0`：光叶分布在外圈并向中心飘动，整体散射状
- `progress ≈ 0.33`：光叶开始沿螺旋轨迹汇聚，出现新月弧
- `progress ≈ 0.66`：螺旋收紧，出现亮边能量环雏形
- `progress = 1.0`：形成完整能量环 + 中心核心光球 + 边缘火花

这样 4 帧 → 1 个连续函数，代码自然是连续的而不是硬切。

动画模式：

- `autoAnimate = true`：组件内部用 `elapsed * animationSpeed` 循环推进 `progress`（循环时长由 `animationSpeed` 控制，用 `mod(t, 1.0)` 实现平滑 loop）
- `autoAnimate = false`：`progress` 由外部驱动，组件只做 clamp

## 渲染结构

```
<TresMesh rotation={-PI/2, 0, 0}>      // 贴在地面
  <TresPlaneGeometry args=[size, size]>
  <CustomShaderMaterial>
    - panel.vert : 平面直通，输出 vUv
    - panel.frag : 极坐标空间内叠加
        1) 螺旋光叶层 (blade)：基于 bladeCount、swirlIntensity 计算 N 条旋臂亮度
        2) 能量环层 (ring) ：基于 progress 控制环的清晰度和亮度
        3) 核心光球层 (core)：progress 接近 1 时亮起
        4) 火花点缀 (sparkle)：由 hash21 + 时间生成微亮点
        5) 颜色分层    ：baseColor ↔ glowColor ↔ highlightColor ↔ coreColor 按亮度插值
</TresMesh>
```

shader 文件组织：

- `src/shader/radiantSwirlSkillComponent/panel.vert`
- `src/shader/radiantSwirlSkillComponent/panel.frag`

## 参数拆分

按“从动起来到长什么样”分三组：

### 动画节奏

- `autoAnimate`（Switch）
- `animationSpeed`（Slider）—— 自动循环的速度倍率
- `progress`（Slider，0–1）—— 外部驱动进度，仅在 `autoAnimate=false` 生效

### 颜色

- `baseColor`：阴影/背景能量色
- `glowColor`：旋臂发光色
- `highlightColor`：边缘高光色
- `coreColor`：最终核心能量球颜色

### 形态

- `radius`：可视范围半径（mesh 尺寸等比计算）
- `bladeCount`：能量叶片条数
- `swirlIntensity`：螺旋弯曲强度
- `noiseScale`：叶片细节粒度
- `coreIntensity`：完成态核心光球强度
- `sparkleIntensity`：火花亮度
- `opacity`：整体透明度

所有数值型参数在组件内部都用 `clampNumber` 保护，防止越界导致 shader 失真或黑屏。

## 关键权衡

### 单 shader vs 多层 Mesh

多层 mesh 更灵活但会增加组件代码量和管理成本。用户明确要求“代码逻辑清晰、简单”。因此选择单 shader 内部分层叠加。

### 自动循环 vs 纯外部驱动

纯外部驱动对预览环境不友好（默认进预览看不到动），所以保留 `autoAnimate` 默认开启。

### 默认地面放置 vs 垂直面板

参考图更像屏幕/地面贴面的能量爆发。为了和现有“*Panel / *Ground”系列风格一致，默认 `rotation.x = -Math.PI / 2` 贴地放置，同时用户仍可在 object3D 调整旋转。

## 回滚

1. 删除 `src/dcsConfig.ts` 中 `radiantSwirlSkillComponent` 注册段
2. 删除 `src/components/radiantSwirlSkillComponent.vue`
3. 删除 `src/shader/radiantSwirlSkillComponent/`
4. 删除本次 OpenSpec 变更目录
