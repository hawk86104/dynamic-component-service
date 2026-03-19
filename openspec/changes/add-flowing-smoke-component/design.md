## Context

本项目的动态组件需要在 `src/components` 中以 tresjs/three 的方式实现，并通过 `src/dcsConfig.ts` 暴露默认参数与调参面板。流动性烟雾组件既要适配烟囱这类“向上持续排放”场景，也要适配汽车尾气这类“沿某个方向喷出并逐渐扩散消散”的场景，因此实现上需要同时兼顾方向性、连续流动感、透明度衰减和可调性能。

## Goals / Non-Goals

**Goals:**
- 提供一个三维流动烟雾组件，支持持续排放且可配置流动速率、密度、颜色。
- 支持通过发射方向与扩散范围参数覆盖烟囱排烟和汽车尾气两类主要场景。
- 让烟雾在流动过程中具备尺寸增长、透明度衰减和轻微扰动，避免表现过于刚性。
- 将组件、shader、默认参数和调参配置完整接入现有动态组件服务。

**Non-Goals:**
- 不在本次变更中引入真实流体模拟、体积雾或后处理体渲染。
- 不支持多发射源拼接、碰撞反馈、风场交互等复杂物理行为。
- 不修改 `src/views/previewEntry.vue` 与 `src/views/templateComponet.vue` 这类通用预览基础设施。

## Decisions

1. 决策：烟雾主体采用 `THREE.Points` + `BufferGeometry` + `ShaderMaterial` 实现，而不是 CPU 逐帧创建/销毁粒子网格。
- Rationale: `Points` 更适合大量轻量粒子表现，能够在保证流动感的同时控制性能开销，也更符合当前仓库中 shader 驱动动效的实现习惯。
- Alternative considered: 使用多个 `Sprite` 或小球 mesh 逐帧更新。该方案对象数更多，CPU 更新与 GC 压力更高。

2. 决策：每个粒子使用固定属性（seed、ageOffset、sizeFactor 等）预生成，运行时在顶点着色器中根据全局时间计算生命周期位置，而不是运行时维护显式粒子池。
- Rationale: 固定粒子池可以直接用 `density` 映射活动粒子数量或视觉权重，减少频繁重建几何数据，同时更容易保持连续喷发效果。
- Alternative considered: 在 JavaScript 中维护 spawn/despawn 队列。该方案可控性高，但实现复杂度和运行时更新成本更高。

3. 决策：流动方向由归一化方向向量控制，并在 shader 中叠加轻微横向扰动与扩散系数，以同时支持竖直排烟和水平尾气。
- Rationale: 单一方向向量能覆盖烟囱向上、尾气向后等主要业务需求；叠加扰动和扩散后，视觉上能避免“直线喷射”的生硬感。
- Alternative considered: 仅支持固定竖直上升。该方案无法满足汽车尾气等横向排放场景。

4. 决策：将 `flowRate`、`density`、`color` 设为核心显式 props，同时补充 `direction`、`spread`、`opacity`、`particleSize`、`lifeRange` 等实现烟雾观感所需的辅助 props，并在组件内做数值边界保护。
- Rationale: 用户明确要求流速、密度、颜色可调；方向、扩散和消散参数是让组件能适应不同排放场景的必要补充。边界保护可避免极端值导致画面闪烁或性能异常。
- Alternative considered: 仅暴露最少的 3 个参数。该方案适配场景受限，难以复现烟囱与尾气的明显差异。

5. 决策：顶点 shader 负责粒子路径推进、尺寸渐变和生命周期归一化，片元 shader 负责软边缘、颜色混合和透明衰减，源码存放在 `src/shader/flowingSmokeComponent/` 下拆分管理。
- Rationale: 运动和外观分别在顶点/片元阶段处理更清晰，且符合项目“shader 文件外置并拆分”的宪法规则。
- Alternative considered: 在 Vue 组件中内联 shader 字符串。该方案不利于维护和复用。

6. 决策：组件接入只通过 `src/dcsConfig.ts` 增加注册、默认参数和调参 schema，不为单个组件修改通用预览视图。
- Rationale: 组件级能力应收敛在组件自身和配置层，避免预览基础设施随组件增长而变得脆弱。
- Alternative considered: 在预览视图中硬编码组件示例分支。该方案会引入额外维护成本。

## Risks / Trade-offs

- [Risk] 高密度粒子会提升顶点处理和透明混合开销 -> Mitigation: 为 `density` 设置合理默认值和上限，并用固定粒子池控制最大数量。
- [Risk] 透明粒子叠加顺序可能在某些视角下出现层次不自然 -> Mitigation: 默认使用适合烟雾的混合模式与深度写入策略，并优先保证整体观感稳定。
- [Risk] 横向尾气在强透视角度下可能显得过薄或过散 -> Mitigation: 暴露 `spread`、`particleSize` 和 `lifeRange` 参数，允许业务按场景微调。
- [Risk] shader 中噪声或扰动过强会让流动方向感减弱 -> Mitigation: 将扰动幅度限制在较小范围，并保证主方向位移始终占主导。

## Migration Plan

- 第一步：创建 `flowingSmokeComponent` 组件骨架，建立 props、边界保护和粒子几何数据结构。
- 第二步：实现顶点/片元 shader，完成沿方向流动、扩散、尺寸变化与透明衰减。
- 第三步：通过 `src/dcsConfig.ts` 注册组件并补充默认值、配置项和预览图资源。
- 第四步：执行 lint、build，并在可用环境下验证 `dev` / `serve` 渲染表现。
- 回滚策略：先从 `src/dcsConfig.ts` 下线组件入口，再移除 `src/components/flowingSmokeComponent.vue` 与 `src/shader/flowingSmokeComponent/` 下新增文件。

## Open Questions

- `density` 更适合作为“活动粒子数量比例”还是“单个粒子的透明度增益”，是否需要两者同时参与来兼顾观感和性能？
- 是否需要为烟囱排烟提供默认轻微上升浮力，即使主方向为水平，也让尾气在生命周期后半段略微抬升？
