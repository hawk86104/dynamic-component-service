# Proposal

## Why

现有 `video2DProjectionComponent` 只在视锥末端平面显示视频，无法把画面贴合到场景模型表面。参考 `hh-hang/vid3d-projection` 的 Three.js 实现，新增可复用的三维视频投影组件。

## What Changes

- 新增 `video3DProjectionComponent`，以透视相机、投影 Shader 和深度遮挡实现真正的三维视频融合。
- 沿用现有 2D 组件的水平/垂直张角、朝向、镜像、视频旋转、视锥辅助线及播放控制。
- 支持视频 URL、目标名称筛选、程序化绑定、遮挡开关、投影强度、边缘羽化和可关闭的演示接收体。
- 注册默认参数、调参面板、预览封面和组件使用说明；保留上游 MIT 声明。

## Capabilities

### New Capabilities

- `video-3d-projection`: 将视频按投影相机映射到宿主场景的三维网格，管理遮挡、动态参数、目标和资源生命周期。

### Modified Capabilities

无。

## Impact

仅新增组件内部工具、`src/shader/video3DProjectionComponent/`、组件文档、SVG 封面和 OpenSpec 文件，并在 `src/dcsConfig.ts` 增加注册。不修改现有 2D 组件或通用预览，不新增依赖或独立渲染器。

回滚时删除新增组件及其配套文件，移除本次注册即可；宿主网格的几何、材质及阴影设置保持原样。
