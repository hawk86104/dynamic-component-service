## Context

参考网页 `champagne-fizz.html` 是一个 2D canvas 效果，完整页面包含以下几类元素：

- 底部成核点驱动的随机气泡生成
- 气泡上浮过程中的轻微左右摆动、尺寸变化与透明度变化
- 接近顶部时消失，并伴随火花式爆裂细节
- 液面波线、环境光柱、暗角和鼠标交互

这次组件化迁移只需要保留其中真正可迁移、且与你需求一致的部分：液体体积内部的持续冒泡节奏。其余与页面氛围或交互绑定的逻辑都不应进入组件首版。

仓库层面，这个组件必须遵守 `dynamic-component-service` 的约束：视觉必须运行在 tresjs/three 的 canvas 管线中，shader 必须外置到 `src/shader/<component-name>/`，组件入口与调参必须通过 `src/dcsConfig.ts` 接入。用户还额外强调了四个边界：

- 不参考已有 `liquidContainerComponent` 的容器实现路线
- 不做液体流动或液面波动
- 不做外部容器壳体
- 液体形状只需要长方体或圆柱体

## Goals / Non-Goals

**Goals:**
- 提供一个独立的 3D 液体气泡组件，视觉主体是“液体本体 + 内部气泡”，而不是“容器 + 液位”。
- 支持长方体和圆柱体两种液体体积形状，并保持统一的参数体验。
- 将参考网页中的气泡生成与上浮节奏转换为 shader 可持续循环的实现。
- 用尽量精简的参数覆盖主要观感，包括液体颜色、透明度、气泡密度、速度、尺寸和扩散。
- 以组件目录与 shader 目录分层的方式接入现有动态组件服务。

**Non-Goals:**
- 不实现真实流体模拟、表面波浪、液位守恒或容器晃动反馈。
- 不实现外部壳体、瓶身、烧杯、花瓶等容器轮廓。
- 不实现点击生成气泡、鼠标推开气泡、爆裂火花或页面级环境氛围。
- 不支持长方体、圆柱体之外的自由液体轮廓。
- 不修改 `src/views/previewEntry.vue` 与 `src/views/templateComponet.vue`。

## Decisions

1. 决策：将参考页效果抽象为“受液体体积约束的连续气泡场”，而不是迁移整套页面动画。
- Rationale: 参考页的暗角、光柱、液面波线和交互属于整页叙事，不属于通用动态组件能力。真正适合复用的是气泡生命周期与液体内部空间感。
- Alternative considered: 把整页 2D 视觉元素都搬进 three.js 场景。该方案与组件职责不匹配，且很难复用。

2. 决策：首版只使用两层视觉结构，即“液体本体 mesh”与“内部气泡粒子层”，不拆单独液面波动层。
- Rationale: 用户明确不需要液体流动和液面效果。液体顶部直接由长方体或圆柱体几何自身的顶面承担，能更自然地保持静止液体感。
- Alternative considered: 额外添加独立液面 mesh。该方案会把实现重新引向已有液位类组件的思路，不符合这次边界。

3. 决策：气泡层采用固定粒子池 + shader 生命周期循环的方式实现，而不是在 CPU 侧逐帧创建/销毁气泡对象。
- Rationale: 参考页里的 `spawnBubble` / `updateBubbles` 可以转换为“每个粒子拥有种子、寿命偏移、尺寸因子、成核点索引”的固定属性，运行时只用全局时间驱动生命周期，从底部重复上浮即可。这样更适合 three.js 组件场景，性能也更稳定。
- Alternative considered: 在 JavaScript 中维护显式气泡数组并逐帧更新。该方案更贴近原网页，但对象更新与重置成本更高。

4. 决策：保留“底部成核感”，但将其改写为几何底面上的若干簇状发射区域。
- Rationale: 参考页的视觉真实感很大一部分来自气泡并不是全底面平均生成，而是倾向从少数区域持续冒出。长方体可以在底面生成若干簇点，圆柱体则在底圆区域生成若干半径受限的簇点，这样既保留原理，又适配 3D 体积。
- Alternative considered: 所有气泡完全均匀随机分布在底部生成。该方案实现最简单，但会失去“持续冒泡源”的节奏感。

5. 决策：气泡运动由“主方向上升 + 横向摆动扩散 + 顶部淡出重生”三段组成，不实现爆裂与火花。
- Rationale: 这正对应参考页中最关键的 `rise + wobble + slightly grow + disappear` 四个阶段。去掉火花后，顶部以透明度衰减的方式结束会更干净，也更适合组件反复循环。
- Alternative considered: 保留顶部爆裂与火花粒子。该方案会增加第二套粒子系统和交互感，不符合当前需求。

6. 决策：气泡几何优先采用 `THREE.Points` + 自定义 fragment 外观，而不是 instanced sphere。
- Rationale: 参考页里的气泡本质上是带边缘、高光和柔和内部填充的“屏幕朝向圆形体”。用 `Points` 可以直接在 fragment 中画出外圈、高光弧和内部柔光，成本低，参数控制也更集中。
- Alternative considered: 使用 `InstancedMesh< SphereGeometry >`。该方案近景真实感更强，但对象开销更大，首版复杂度明显更高。

7. 决策：液体本体使用独立 shader 材质表现透明液体感，通过纵向渐变、边缘提亮和轻微内部吸收表现体积，而不是做真实折射。
- Rationale: 没有容器和波面时，液体“像不像”主要依赖颜色层次、边缘高光和厚度感。首版用稳定的伪体积材质比真实折射更适合当前仓库和交付节奏。
- Alternative considered: 使用复杂折射、环境贴图或屏幕空间效果。该方案过重，也会把组件耦合到外部场景条件。

8. 决策：参数面板刻意保持精简，只暴露以下首版核心参数：
- `shapeType`
- `width`
- `depth`
- `height`
- `radius`
- `liquidColor`
- `liquidTopColor`
- `bubbleColor`
- `opacity`
- `bubbleCount`
- `bubbleSpeed`
- `bubbleSize`
- `bubbleSpread`
- Rationale: 这些参数已经足够覆盖“大/小气泡、稀/密、快/慢、盒状/柱状、冷暖液体”等主要观感变化。成核点数量、顶部淡出区、高光权重等保留为内部实现常量，避免把调参面板做得过重。
- Alternative considered: 继续暴露成核点数、气泡脉动、边缘高光强度、顶部衰减长度等更多参数。该方案不利于首版收敛。

9. 决策：组件目录与 shader 目录完全独立，不借用 `liquidContainerComponent` 的结构或命名语义。
- Rationale: 该组件的问题空间不同，前者是容器内液位与壳体组合，这次是独立液体体积内部的气泡场。拆成新组件更清晰，也更方便后续分别演进。
- Alternative considered: 在 `liquidContainerComponent` 上删减外壳和波面。该方案会把实现与参数历史包袱混在一起。

## Risks / Trade-offs

- [Risk] `THREE.Points` 的气泡在极近距离观察时会有 billboard 感。 -> Mitigation: 首版控制气泡尺寸上限，并把环形边缘和高光做得更轻，减少贴片感；如果后续有近景硬需求，再评估 instanced sphere。
- [Risk] 没有真实折射与容器参照物时，液体本体可能显得“像发光胶体”。 -> Mitigation: 强化纵向渐变、顶部亮带与边缘 fresnel，同时让气泡进入液体内部后再承担空间深度感。
- [Risk] 气泡如果过靠近边界，点精灵边缘会略微穿出体积。 -> Mitigation: 在底部成核采样与运动幅度中预留边界安全距离，并在 fragment 中做边界淡化。
- [Risk] 过高的粒子数量和过大的尺寸会引起透明混合开销上升。 -> Mitigation: 为 `bubbleCount` 和 `bubbleSize` 设置合理上限，并通过固定粒子池避免频繁重建几何。

## Migration Plan

- 第一步：创建 `liquidBubbleComponent` 变更文档，明确 canvas 到 shader 的映射关系与首版边界。
- 第二步：实现长方体 / 圆柱体液体本体几何与对应的液体材质 shader。
- 第三步：实现固定粒子池的气泡系统，包括底部簇状生成、上浮、扩散、尺寸变化与顶部淡出循环。
- 第四步：通过 `src/dcsConfig.ts` 接入组件默认值与精简调参面板。
- 第五步：执行 `build` 与必要 lint 验证，确认不触碰通用预览基础设施。
- 回滚策略：先移除 `src/dcsConfig.ts` 中的组件入口，再回退 `src/components/liquidBubbleComponent/` 与 `src/shader/liquidBubbleComponent/` 中的新增内容。

## Open Questions

- 默认预览形状是否应优先选用更接近香槟视觉的圆柱体，还是展示结构更直观的长方体。
圆柱体
- 首版是否需要在液体顶部加入一条非常轻微的亮带，以增强“静止液面”的识别度，即使不做波动。
可以