## Context

现有 domPanel 基于 Html，输入为 domContent。本服务使用 TresJS 5 / Three 0.180，组件通过 dcsConfig 发布。

## Goals / Non-Goals

目标：静态 HTML 栅格化、透明及圆角、普通场景几何深度遮挡、实时场景毛玻璃；参数变更安全刷新和完整释放资源。
非目标：执行 HTML 内脚本、DOM 按钮交互、视频及 CSS 动画逐帧同步、浏览器所有 CSS 的完全复刻。

## Decisions

- HTML 使用独立的固有尺寸布局层，测量后按 contain 等比缩放到输出画布并居中；pixelWidth/pixelHeight 不再用于裁切或重排 HTML。内容及蒙版共用布局变换，shader 的模糊半径乘以该缩放倍率。
- html-to-image 使用浏览器布局及 SVG foreignObject，较手绘 Canvas 更好保留文字、渐变和圆角。离屏 Shadow DOM 隔离样式，输入仅限可信展示 HTML。
- 两张纹理：原始 RGBA 内容和 CSS blur 区域蒙版。蒙版继承布局、圆角及 overflow，背景以 blur/64 编码，删除文字、边框及阴影的色彩贡献。
- 每个毛玻璃面额外采样场景，排除 dom-canvas 面以避免反馈；裁剪面剔除面前方几何。片元按屏幕坐标模糊背景，再叠加清晰 HTML。普通透明不采样背景。
- depthTest=true、depthWrite=false，完全透明片元丢弃；透明排序沿用 Three。shader 拆分到 src/shader/domCanvasComponent。
- 异步刷新串行合并并校验版本，失败保留上一次成功纹理；卸载废弃未完成结果。

## Risks / Trade-offs

- 屏幕空间玻璃不包含其他 dom-canvas，且相交透明几何受 Three 排序限制；文档明确边界。
- blur 蒙版仅支持普通 HTML 元素的 blur(px)，复杂 filter、伪元素玻璃及嵌套重叠玻璃不承诺完全一致；发出 warning。
- 外部图片字体受 CORS/CSP 约束；捕获错误通过 error 事件报告。
- 每个玻璃面新增一次场景渲染；提供采样缩放并限制纹理尺寸。
- 按项目规则仅做 lint、静态检查和规范校验，不启动构建、调试或浏览器；视觉验收另列清单。

## Migration Plan

新增组件注册，保留 domContent，明确世界尺寸和 CSS 像素尺寸；旧 DOM transform 参数不兼容。撤销注册及新增依赖即可回滚。
