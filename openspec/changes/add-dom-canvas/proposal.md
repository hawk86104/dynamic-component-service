## Why

现有 domPanel 使用 HTML 叠加层，无法参与场景深度遮挡。新增 HTML → Canvas → Three.js 平面组件，保留透明背景并为毛玻璃提供实时场景背景。

## What Changes

- 新增 dom-canvas 组件，接收 domContent，支持尺寸、清晰度、透明度及刷新。
- 分离 DOM 栅格化、毛玻璃蒙版、场景采样和 shader；注册编辑器参数。
- 给出支持范围、迁移方法和人工验收步骤。

## Capabilities

### New Capabilities
- `dom-canvas`: HTML 纹理平面、深度遮挡、透明与场景毛玻璃。

### Modified Capabilities
无。

## Impact

新增组件目录和独立 shader，修改 dcsConfig、package.json、yarn.lock，增加 html-to-image。通用预览文件及外部项目 domPanel 不变。回滚删除新增文件并撤销注册及依赖即可。
