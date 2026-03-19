## Why

当前项目组件基于 three.js/tresjs 渲染在 canvas 上，矩形跑光能力需要遵循同一三维技术路线；此前描述偏二维视觉，不足以指导三维实现。明确三维几何结构、墙体渐变与 line2 跑线参数后，能够保证实现目标一致、可复用且可调。

## What Changes

- 新增三维矩形跑光组件，支持设置 `length`、`width`、`height`：
  - `length` 与 `width` 定义底部矩形 footprint 尺寸。
  - `height` 定义矩形向上抬起后四面墙体高度。
- 不渲染独立底板，底部仅保留矩形周边 `Line2` 跑线。
- 四面墙体支持从下到上的颜色渐变与透明度渐变，基于 shader 在墙体局部坐标计算。
- 底部矩形四周新增 `Line2` 流动跑线能力，支持以下参数：
  - 线宽 (`lineWidth`)
  - 跑动速度 (`lineSpeed`)
  - 线颜色 (`lineColor`)
  - 渐变长度 (`gradientLength`)
  - 跑动线段段数 (`segmentCount`)
- 全部能力均基于 three.js 渲染链路在 canvas 展示，不使用 CSS 动画实现。

## Capabilities

### New Capabilities
- `rectangle-shimmer-component`: 提供基于 tresjs/three/shader 的三维矩形体（底板+四面墙）与四周 line2 跑线能力。

### Modified Capabilities
- None.

## Impact

- Affected code:
  - `src/components/` 新增三维组件、墙体渐变 shader、line2 跑线逻辑。
  - `src/views/` 预览入口新增参数化示例。
- APIs:
- 新增组件 props：`length`、`width`、`height`、墙体渐变色与透明度参数、line2 跑线参数。
- Dependencies:
  - 基于现有 `tresjs` + `three`，不引入 CSS 动画依赖。
- Systems:
  - 影响前端 canvas 三维渲染层，不影响后端服务。
- Rollback strategy:
  - 若出现性能或兼容问题，先移除预览入口引用，再回退新增组件与 shader/line2 实现文件，恢复到变更前状态。
