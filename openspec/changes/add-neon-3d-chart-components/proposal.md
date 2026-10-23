## Why

需要将两张参考图中的分段立体环形图、双序列立体面积图变成可复用的三维动态组件，并通过业务 JSON 与样式参数驱动，而不是固定截图或 DOM 图表。

## What Changes

- 新增 `neonDonutChartComponent`：不同高度的圆角透明环形扇区、发光边缘、圆盘底座、比例标签与统计信息。
- 新增 `ribbonAreaChartComponent`：沿 X 轴平滑变化的实体面积带，多序列沿 Z 轴错开，支持渐变顶面、发光轮廓、峰值标签和网格底座。
- 提供可校验的 JSON 契约、默认示例和参数文档；错误数据保留上一次有效图表并发出错误事件。
- 注册到现有 `dcsConfig.ts`，添加独立预览 SVG；通用预览层保持不变。

## Capabilities

### New Capabilities

- `neon-donut-chart`: 数据驱动的立体发光环形图及独立样式控制。
- `ribbon-area-chart`: 数据驱动的多序列立体面积带图及独立样式控制。

### Modified Capabilities

无。

## Impact

新增组件、共享图表工具、独立顶点/片元 shader、预览图、文档与测试，修改 `src/dcsConfig.ts`；不增加依赖，不修改既有组件或公共预览视图。回滚时删除新增文件和两个注册条目即可。遵守 `AGENTS.md`，本次执行定向 lint 与纯数据/几何测试，不自动运行构建、服务或浏览器调试。
