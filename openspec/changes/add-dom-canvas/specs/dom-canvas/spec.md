## Purpose

将展示型 HTML 内容转换为可参与三维场景遮挡的平面，保留透明外观，并使常见圆角毛玻璃面板可以模糊其后方场景，同时清晰展示文字内容和提供可维护的组件接入方式。

## ADDED Requirements

### Requirement: HTML scene plane
组件 SHALL 接收 domContent 和像素尺寸、世界宽度，将 HTML 显示为平面并响应变换与可见性。
#### Scenario: Opaque geometry crosses panel
- **WHEN** 不透明物体从面板后方移动到前方
- **THEN** 前方物体遮挡面板，后方物体不能覆盖不透明文字区域。

### Requirement: Transparency and glass
组件 SHALL 保留 HTML alpha、圆角及半透明背景，并为普通元素的 backdrop-filter blur(px) 区域提供实时场景背景模糊。
#### Scenario: Transparent rounded panel
- **WHEN** 内容有透明边缘和半透明渐变
- **THEN** 对应区域可见后方场景，不出现矩形底色。
#### Scenario: Glass region
- **WHEN** 普通圆角元素使用 backdrop-filter blur(12px) 且相机移动
- **THEN** 该区域模糊后方场景，文字清晰，非玻璃区域不被模糊。

### Requirement: Proportional canvas fit
组件 SHALL 将 HTML 按其固有布局尺寸等比缩放并居中适配目标画布，保持未覆盖区域透明，且玻璃蒙版与模糊半径同步缩放。
#### Scenario: Different canvas aspect ratio
- **WHEN** 用户将同一 HTML 的画布尺寸从横向改成竖向或正方形
- **THEN** HTML 保持原有布局和比例，完整显示，剩余区域为透明留白而非裁切或拉伸。

### Requirement: Refresh lifecycle
组件 SHALL 合并异步刷新、保留最新有效结果，在失败时报告错误，并在卸载时释放纹理及离屏节点。
#### Scenario: Rapid replacement
- **WHEN** 连续修改 domContent 或在捕获中卸载
- **THEN** 旧结果不覆盖新内容，卸载后不再更新资源。

### Requirement: Integration and boundaries
组件 SHALL 通过 dcsConfig 注册全部参数，在文档说明 CSS、跨域、交互与透明排序边界，不修改通用预览页面。
#### Scenario: Editor configuration
- **WHEN** 选择 dom-canvas
- **THEN** 可修改内容、尺寸、清晰度和玻璃采样质量，默认值与组件一致。
