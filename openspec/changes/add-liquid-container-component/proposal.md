## Why

当前组件库已经具备烟雾、矩形跑光等三维动态特效能力，但还缺少一个能稳定表达“容器内流动液体”的通用组件。工业液罐、反应釜、玻璃器皿、展示型液体容器这类场景如果每次临时拼装，不仅复用性差，也难以统一控制容器形状、液体波动、颜色渐变和气泡细节。

## What Changes

- 新增一个“内部流动液体材质组件”，支持矩形容器、圆柱容器和壶形预设容器三类形状。
- 组件支持控制容器规格、液位高度、液面波动速度、振幅与频率，以及液体颜色渐变、密度成色和透明表现。
- 组件支持可选气泡系统，并暴露气泡开关、数量、大小范围、随机性和上浮速度等参数。
- 组件支持基于自身局部坐标的 `X` 与 `Z` 方向垂直裁切参数，用于调节容器外壳的可视化范围，便于展示内部液体效果。
- 组件视觉效果采用 three.js / tresjs 几何与 shader 的 canvas 渲染链路实现，不引入真实流体物理模拟。
- 组件代码按插件名拆分到 `src/components/<插件名>/` 目录下，shader 代码拆分到 `src/shader/<插件名>/` 目录下，并通过 `src/dcsConfig.ts` 统一注册默认值与调参面板。
- 补充对应的 OpenSpec 设计、需求与实施任务，明确分层结构、参数边界、验证方式与回滚路径。

## Capabilities

### New Capabilities
- `liquid-container-component`: 提供可参数化的三维容器内流动液体能力，覆盖容器形状、液位、液面波动、颜色渐变、密度表现、气泡系统和局部剖切展示。

### Modified Capabilities
- None.

## Impact

- Affected code:
  - `src/components/` 下新增按插件目录拆分的液体容器组件实现与组合逻辑。
  - `src/shader/` 下新增组件专属顶点/片元 shader 文件。
  - `src/dcsConfig.ts` 新增组件注册、默认参数与调参配置。
- APIs:
  - 新增组件 props，包括 `shapeType`、容器规格参数、`fillLevel`、液面波动参数、颜色渐变参数、密度参数、气泡参数，以及 `clipX` / `clipZ` 等局部裁切参数。
- Dependencies:
  - 复用现有 `tresjs`、`three`、`@tresjs/cientos` 与现有构建链路，不新增额外依赖。
- Systems:
  - 影响前端三维渲染、组件预览与动态组件注册，不影响后端服务与通用预览基础设施。
- Rollback strategy:
  - 若出现性能、兼容性或视觉稳定性问题，先从 `src/dcsConfig.ts` 下线组件入口，再回退新增的组件目录与 shader 目录，恢复到变更前状态。
