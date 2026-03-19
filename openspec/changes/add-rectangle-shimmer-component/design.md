## Context

本项目组件在 `src/components` 中以 tresjs 三维模式实现，渲染目标是 canvas，而不是 DOM/CSS。该组件需要表达一个可参数化的三维矩形墙体结构：由底部矩形 footprint 定义长宽、向上抬起四面墙，并在底部周边展示可流动的 line2 跑线效果。

## Goals / Non-Goals

**Goals:**
- 提供可配置 `length`/`width`/`height` 的三维矩形体组件。
- 实现四面墙自下而上“颜色和透明度”渐变。
- 实现底部四周 line2 跑线，并支持线宽、速度、颜色、渐变长度、线段数配置。
- 保证能力全部运行在 three.js canvas 渲染链路中。

**Non-Goals:**
- 不实现基于 CSS 的替代动画方案。
- 不扩展到圆形、多边形或不规则路径跑线。
- 不在本次变更中加入后处理特效链（bloom 等）。

## Decisions

1. 决策：几何结构拆分为底部矩形 perimeter 路径 + 四个墙体面片（或等价可控几何），不再单独渲染底板面片。
- Rationale: 用户当前只需要墙体和周边跑线，去掉底板可以减少不必要的视觉元素和材质开销。
- Alternative considered: 保留底部矩形面片。该方案与当前需求不符，且会引入多余的底板颜色配置。

2. 决策：墙体渐变使用 ShaderMaterial，基于墙体局部高度坐标混合 `bottomColor` / `topColor` 和 `bottomOpacity` / `topOpacity`。
- Rationale: shader 可精确控制“由深到浅”和“由实到透”的纵向渐变，且与三维渲染路径一致。
- Alternative considered: 贴图渐变。该方案参数动态调整能力较差。

3. 决策：底部四周跑线基于 `Line2`（three fat line）实现，使用时间 uniform 或 dash offset 驱动流动。
- Rationale: `Line2` 可稳定支持可视线宽，并适合在 3D 场景下实现周边跑线。
- Alternative considered: 普通 Line。该方案在不同分辨率与视距下线宽控制不足。

4. 决策：将 `lineWidth`、`lineSpeed`、`lineColor`、`gradientLength`、`segmentCount` 以及墙体透明度参数作为显式 props，并设置默认值与边界保护。
- Rationale: 满足业务可调需求，同时避免极端参数导致闪烁或性能波动。
- Alternative considered: 只暴露少量参数。该方案无法满足明确的配置诉求。

5. 决策：预览集成优先通过 `src/dcsConfig.ts` 提供默认参数和调参项，非必要不修改 `src/views/previewEntry.vue` 与 `src/views/templateComponet.vue`。
- Rationale: 这两个文件承担的是通用预览框架职责，应保持稳定，避免组件定制逻辑侵入公共视图层。
- Alternative considered: 为单个组件在预览视图中加入特殊分支。该方案会放大公共预览层的维护成本。

6. 决策：shader 源码统一存放在 `src/shader/rectangleShimmerComponent/` 下，并拆分为顶点与片元文件。
- Rationale: 便于 shader 复用、调试和项目级统一管理，也符合后续同类组件的宪法规则。
- Alternative considered: 在 Vue 组件内内联 shader 字符串。该方案可读性和维护性较差。

## Risks / Trade-offs

- [Risk] `segmentCount` 过高导致几何与更新开销上升 → Mitigation: 设置默认值与最大建议值，并在文档中标注性能建议。
- [Risk] 线宽在不同 DPI 下观感差异 → Mitigation: 依据渲染尺寸更新 line material 分辨率参数。
- [Risk] 渐变颜色或透明度在不同背景下对比不稳定 → Mitigation: 提供默认深浅配色与透明度组合并允许业务覆盖。

## Migration Plan

- 第一步：搭建组件骨架，完成四面墙几何与底部周边路径。
- 第二步：接入墙体渐变 shader，验证颜色与透明度的纵向渐变方向正确。
- 第三步：实现底部四周 line2 跑线与参数控制。
- 第四步：接入预览页示例并执行 lint/build/serve 验证。
- 回滚策略：如出现问题，先下线示例引用，再回退新增组件与 shader/line2 文件。

## Open Questions

- `gradientLength` 的视觉定义是否采用“高亮头部到尾部的世界单位长度”作为统一口径？
- `segmentCount` 是否需要区分“同时存在的跑线段数量”与“路径离散采样段数”两个参数？
