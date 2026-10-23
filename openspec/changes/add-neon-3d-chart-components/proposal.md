## Why

需要将两张参考图中的分段立体环形图、双序列立体面积图变成可复用的三维动态组件，并通过业务 JSON 与样式参数驱动，而不是固定截图或 DOM 图表。

## What Changes

- 新增 `neonDonutChartComponent`：不同高度的圆角玻璃环形扇区、视角相关的条形反射、细微磨砂、发光边缘、比例标签与统计信息；不生成底座或网格。
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

环图质感调整仅涉及环图组件、shader、注册项、对应预览图和文档；移除 `showBase`、`showGrid`、`baseColor`、`gridColor`，增加 `reflectionStrength` 和 `roughness`。面积图及共享底座工具保持现有行为；回滚本次环图调整可恢复上述文件的前一版本。
