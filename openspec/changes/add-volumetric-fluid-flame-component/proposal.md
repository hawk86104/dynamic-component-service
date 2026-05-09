## Why

现有组件库缺少可直接在 TresJS 场景中使用的三维体积火焰效果，用户需要一个从原生 Three.js GPU 流体示例移植而来的动态火焰组件。该组件应复用项目已有预览、灯光、相机、参数面板和发布配置，避免引入独立 renderer、controls、DOM UI 或后期处理链。

## What Changes

- 新增 `volumetric-fluid-flame-component` 能力，提供三维流体火焰组件。
- 新增 `src/components/volumetricFluidFlameComponent.vue`，使用 TresJS/Three 在现有场景中挂载体渲染火焰。
- 新增 `src/shader/volumetricFluidFlameComponent/` 下的仿真与体渲染 shader 文件，按顶点、片元与 pass 拆分管理。
- 在 `src/dcsConfig.ts` 注册组件默认参数、默认 Object3D 和配置面板字段。
- 移除原生示例中的自建可见 scene/camera/renderer/OrbitControls、DOM 调参面板、debug wireframe 和 post-processing bloom/output pass；GPU 仿真允许使用不可见的离屏 fullscreen pass。
- 默认以更低成本的仿真分辨率、压力迭代和 ray-march 步数运行，并开放质量参数以便用户按场景调高或调低。

## Capabilities

### New Capabilities

- `volumetric-fluid-flame-component`: 在动态组件服务中提供可配置、可预览、可发布的三维 GPU 流体火焰组件。

### Modified Capabilities

- 无。

## Impact

- 影响代码：`src/components/volumetricFluidFlameComponent.vue`、`src/shader/volumetricFluidFlameComponent/*`、`src/dcsConfig.ts`。
- 影响预览：通过现有 `previewEntry.vue`、`templateComponet.vue` 自动接入，不修改通用预览文件。
- 依赖：使用已有 `three`、`@tresjs/core`，不新增 npm 依赖。
- 性能：默认降低模拟分辨率和渲染采样量，避免后期处理，并提供质量控制参数。
- 回滚策略：删除新增组件和 shader 目录，并移除 `src/dcsConfig.ts` 中对应组件注册项即可恢复到变更前行为。
