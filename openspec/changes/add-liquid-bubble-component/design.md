## Context

用户给出的参考页面 [champagne-fizz.html](https://github.com/pbakaus/radiant/blob/main/static/champagne-fizz.html) 本质上不是流体模拟，而是一套“看起来像香槟持续起泡”的视觉规律组合：

1. 底部存在若干固定起泡点，气泡更容易从这些位置生成。
2. 气泡尺寸并不平均，绝大多数较小，少量中大尺寸穿插其中。
3. 气泡持续上浮，但会带有轻微左右摆动和少量速度差。
4. 越接近液面，气泡越容易消失；原实现还附带了破裂 sparkles。
5. 液面本身有一条轻微波动的表面线。

这些规律都适合转成当前仓库更熟悉的三维分层方案，而不需要照搬参考页里的整页 2D 画布渲染方式。

## Goals / Non-Goals

**Goals**

- 新增一个专用的 `liquidBubbleComponent`，而不是继续往 `liquidContainerComponent` 里叠加更多专用行为。
- 将核心动画逻辑转成 shader 主导方案：粒子初始化在 CPU，逐帧位置/尺寸/透明度变化尽量由 shader 根据时间计算。
- 只支持 `rectTank` 和 `cylinderTank` 两类容器，减少首版复杂度。
- 保留液体主体、液面与气泡层的分层表现，让组件在当前动态组件服务中可配置、可预览、可发布。
- 保持参数数量克制，避免把参考页里的所有演示控制都暴露成组件 API。

**Non-Goals**

- 不做真实流体模拟、体积折射、表面张力、泡沫堆积等高复杂度物理效果。
- 不支持花瓶或任意自定义轮廓容器，首版只做长方体与圆柱体。
- 不迁移鼠标/触摸交互、按住喷发、气泡破裂 sparkles、整页 vignette 与背景氛围层。
- 不改动 `src/views/previewEntry.vue` 或 `src/views/templateComponet.vue` 这类通用预览基础设施。

## Canvas To Shader Mapping

### 1. 气泡生成

参考页里 `spawnBubble()` 的核心不是“随机出现在任何地方”，而是“70% 概率来自底部固定 nucleation sites，30% 完全随机”。迁移到组件后，不再每帧创建 JavaScript 对象，而是：

- 初始化一个固定大小的粒子池。
- 为每个粒子写入静态 attribute：
  - 所属起泡点索引
  - 起始相位
  - 尺寸种子
  - 速度因子
  - 摆动因子
  - 随机偏移
- 起泡点坐标在组件重建时按容器底部几何生成。
- “更偏向固定起泡点” 通过 attribute 分配策略体现，而不是运行时频繁 push / splice 对象。

### 2. 上浮与横向摆动

参考页里的 `updateBubbles()` 在 CPU 上逐个更新 `x/y/radius`。迁移后改为：

- `riseProgress = fract(aPhase + uTime * uRiseSpeed * aSpeedFactor)`。
- `y` 根据 `riseProgress` 在容器内部高度范围内插值。
- `x/z` 由底部起泡点位置加上横向正弦摆动与少量径向漂移得到。
- 气泡接近液面时不再触发 sparkles，而是通过透明度衰减直接淡出并进入下一轮循环。
- 气泡尺寸轻微脉动与“越高略微变大”的规律也在顶点 shader 中完成。

这样可以把逐帧的粒子运动从 JavaScript 循环里拿掉，只保留 `uTime`、液位与容器尺寸等 uniform 更新。

### 3. 气泡外观

参考页 `drawBubble()` 的视觉重点是：薄边缘、微弱主体、高光与折射感。迁移到 `THREE.Points` 后：

- 顶点 shader 负责计算 `gl_PointSize`。
- 片元 shader 根据 `gl_PointCoord` 画出：
  - 外环 rim
  - 内部微弱 core
  - 左上高光
  - 底部轻微折射点
- 维持“多数气泡很透明，少数更亮”的整体气质，但不再做 2D canvas 的径向渐变 API 调用。

### 4. 液面与液体主体

参考页的 `drawSurface()` 是一条 2D 波线。迁移到三维组件后：

- 液体主体继续采用独立 mesh + shader，负责纵向颜色渐变和轻微体积感。
- 液面采用独立顶部 surface mesh：
  - 长方体使用平面
  - 圆柱体使用圆形截面的平面
- 顶点 shader 叠加 2 至 3 组正弦波，保留“香槟液面轻抖动”而不是强烈水波。
- 靠近液面的 bubbles 可以与 surface 高度联动淡出，避免穿出液面。

### 5. 被删除的参考逻辑

以下逻辑明确不迁移：

- 鼠标悬停推开气泡
- 按住鼠标在光标处持续生成气泡
- 触摸事件逻辑
- `spawnSparkle()` 及其星芒爆点效果
- `window.postMessage` 动态调参
- 整页背景、标签、vignette 与画布级氛围层

## Component Architecture

### 决策 1：新建专用组件目录，而不是继续扩展现有 liquidContainer

- 决策：新增 `src/components/liquidBubbleComponent/` 与 `src/shader/liquidBubbleComponent/`。
- Rationale：现有 `liquidContainerComponent` 偏“通用容器液体展示”，本次则是偏“气泡柱风格表现”。拆成新组件可以避免为现有通用组件引入一组过度专用的参数与行为。
- Alternative considered：直接在 `liquidContainerComponent` 上加一个 “fizz mode”。该方案会让现有参数模型继续膨胀，不利于服务化使用。

### 决策 2：沿用四层结构，但把 bubble motion 改成 shader-first

- 决策：组件继续由“壳体 + 液体主体 + 液面 + 气泡层”四层组成。
- Rationale：这是当前仓库已经验证过的结构，适合和 `dcsConfig`、预览系统、透明层排序一起工作。变化点不在层次结构，而在气泡层的时间驱动方式。
- Alternative considered：把液体、液面、气泡全塞进单一 shader。该方案理论上更集中，但调试和维护成本太高。

### 决策 3：容器形状只做长方体与圆柱体

- 决策：首版只支持 `rectTank` 与 `cylinderTank`。
- Rationale：用户已明确收敛形状范围，这让几何生成、起泡点布置和液面约束都简单很多。
- Alternative considered：继续支持 `vaseTank`。这会重新引入截面半径采样与特殊约束，超出本次重点。

### 决策 4：参数收敛到“视觉意图”级别

- 决策：优先暴露下列参数，而不是参考页中的大量实现细节：
  - `shapeType`
  - `length` / `width` / `height` 或 `radius`
  - `fillLevel`
  - `liquidColor`
  - `surfaceColor`
  - `bubbleColor`
  - `shellColor`
  - `shellOpacity`
  - `bubbleDensity`
  - `bubbleSize`
  - `bubbleVariation`
  - `bubbleRiseSpeed`
  - `bubbleSway`
  - `nucleationBias`
- Rationale：这些参数更贴近“想看到什么效果”，而不是“内部如何实现”。
- Alternative considered：暴露 `siteCount`、`pulseRate`、`surfaceFadeBand`、`spawnPhase` 等实现细节参数。这样会增加调参成本，也不适合业务侧使用。

### 决策 5：CPU 只在重建时处理静态数据

- 决策：CPU 负责容器几何、起泡点位置和粒子 attribute 的初始化；动画时仅更新 uniform，不再逐粒子改写 position buffer。
- Rationale：这更符合“先转换成 shader 逻辑”的要求，也能降低运行时 CPU 压力。
- Alternative considered：继续沿用当前 `liquidContainerComponent` 那种 CPU 更新粒子位置的方式。该方案可复用更多现成代码，但不符合本次“shader 化”的核心目标。

## Risks / Trade-offs

- [Risk] `THREE.Points` 在半透明容器内部叠加时，可能出现局部排序不自然。
  - Mitigation：优先保证液体主体和壳体层次稳定，必要时通过 `depthWrite`、`renderOrder` 与 alpha 上限控制视觉噪声。
- [Risk] 起泡点过于规律会让效果看起来像“喷泉阵列”。
  - Mitigation：给每个 site 加小幅随机横向扩散，并保留一部分非 site 来源的粒子分配。
- [Risk] bubble motion 全进 shader 后，调试难度会高于 CPU 版。
  - Mitigation：先保留清晰的 attribute 命名和注释，并在首版只做有限几条运动公式，避免一开始就叠太多 noise。
- [Risk] 如果液位接近顶部且摆动过强，气泡可能明显穿出液面。
  - Mitigation：在 shader 中增加液面上方的 fade band，并对 `bubbleSway`、`waveAmplitude` 做安全钳制。

## Migration Plan

1. 创建 `liquidBubbleComponent` 的 OpenSpec artifacts，明确边界、非目标与验证方式。
2. 复制并收敛现有液体容器组件里可复用的几何和分层经验，但避免直接耦合现有组件实现。
3. 先落壳体、液体主体和液面三层，保证容器与液位表现成立。
4. 再实现基于起泡点 attribute 的 shader-driven bubble layer。
5. 最后接入 `src/dcsConfig.ts`、默认值、调参面板与预览资源，并完成 build / lint 验证。

## Open Questions

- 首版是否需要在液体主体里加入非常轻的竖向亮带，去呼应参考页 `drawAmbientStreams()` 的“液体柱感”，还是先只做纯净液体底色？
先只做纯净液体底色
- 如果预览图需要更接近香槟观感，默认颜色是偏金色透明液体，还是保持更通用的浅蓝色科技液体？
浅蓝色科技液体
- `nucleationBias` 是否要直接暴露给用户，还是先固定在一个合理默认值，只暴露 `bubbleDensity` 与 `bubbleSway`？
固定在一个合理默认值，只暴露 `bubbleDensity` 与 `bubbleSway`