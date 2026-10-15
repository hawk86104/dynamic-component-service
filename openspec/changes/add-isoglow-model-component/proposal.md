## Why

动态组件库需要把在线 GLB 转换成精细结构线与发光表面，同时允许在已有 TvT.js 场景中复用。组件应沿用现有参数协议与通用预览，把模型风格差异保留在组件内部。

## What Changes

- 新增 IsoGlowModel 动态组件及独立 Three.js 加载、材质、结构线和资源释放工具。
- 支持 ISO-GLOW、工程蓝图和 X-Ray，参数更新复用已加载模型；关闭风格化恢复原始材质。
- ISO-GLOW 使用暗色材质层次、灰色细轮廓与局部暖光；蓝图使用表面排线和隐藏结构虚线；X-Ray 使用 Fresnel 透明壳层。绘制方式由组件内部的材质与 Shader 实现，不依赖预览环境来区分风格。
- 在 dcsConfig.ts 注册全部普通参数、统一默认值和示意封面，由现有 federation 注册机制发布；不扩展参数控件协议。
- 仅通过既有配置注册接入通用预览，通用视图与参数控件保持原样；模型错误提示在组件内处理，宿主无需新增监听或适配。
- 复用参数面板及其复制能力，不添加导出或独立渲染器。

## Capabilities

### New Capabilities

- `isoglow-model`: 在线模型的非破坏性风格化、结构线与生命周期管理。
- `isoglow-model-preview`: 通过现有配置接入参数面板与通用预览，复用复制能力，错误反馈不依赖预览改动。

### Modified Capabilities

无。

## Impact

新增 src/components/isoGlowModelComponent、src/shader/isoGlowModelComponent、封面和说明；更新 src/dcsConfig.ts。previewEntry.vue、templateComponet.vue 与参数控件文件均恢复原状；风格差异、错误提示与唯一一套默认值位于组件目录。相机、取景、灯光、背景等场景职责由已有宿主管理。loadDynamicComponent、zone3Deditor、gisPlaneEditor 无需修改。移除额外检查脚本、独立预览页及相关特殊分支，不增加场景协议。复用现有依赖，不修改 GLB、其他组件或构建配置。

回滚：移除新组件注册和新增文件即可，通用视图和外部宿主没有本次改动。遵守 AGENTS.md，本轮仅做静态验证，不启动构建、服务、浏览器或截图。
