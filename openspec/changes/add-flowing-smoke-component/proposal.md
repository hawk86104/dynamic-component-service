## Why

当前组件库还缺少可直接表达“气体排放”效果的三维组件，烟囱排烟、汽车尾气这类场景只能依赖外部特效或临时实现，难以复用和统一调参。新增一个遵循 tresjs/three 渲染链路的流动性烟雾组件，可以让这类工业与交通场景快速接入，并保持与现有动态组件服务一致的配置体验。

## What Changes

- 新增一个三维流动性烟雾组件，用于展示烟囱排放气体、汽车尾气等连续排放场景。
- 组件支持控制烟雾流动速率、密度、颜色，并提供与场景适配直接相关的发射方向、扩散范围、透明度衰减等参数。
- 组件视觉效果基于 three.js / tresjs 的三维粒子或 shader 方案在 canvas 中生成，不依赖 CSS 动画。
- 按项目宪法将 shader 代码拆分存放到 `src/shader/<component-name>/`，并通过 `src/dcsConfig.ts` 接入默认值与调参面板。
- 补充对应的 OpenSpec 设计、需求和实施任务，明确实现边界、验证方式与回滚路径。

## Capabilities

### New Capabilities
- `flowing-smoke-component`: 提供可参数化的三维流动烟雾能力，覆盖排放方向、流速、密度、颜色与衰减等核心行为。

### Modified Capabilities
- None.

## Impact

- Affected code:
  - `src/components/` 新增流动烟雾组件实现。
  - `src/shader/` 新增组件专属顶点/片元 shader 文件。
  - `src/dcsConfig.ts` 新增组件注册、默认参数与调参配置。
- APIs:
  - 新增组件 props，包括 `flowRate`、`density`、`color`，以及发射方向、扩散范围、透明度衰减等参数。
- Dependencies:
  - 复用现有 `tresjs`、`three` 与仓库已有构建链路，不新增额外动画框架依赖。
- Systems:
  - 影响前端三维渲染与组件预览集成，不影响后端服务与通用预览基础设施。
- Rollback strategy:
  - 若出现性能或兼容问题，先从 `src/dcsConfig.ts` 移除组件注册，再回退新增组件与 shader 文件，恢复到变更前状态。
