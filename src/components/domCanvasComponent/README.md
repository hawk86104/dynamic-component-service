# dom-canvas

入口为 `src/components/domCanvasComponent.vue`，服务类型为 `domCanvasComponent`，编辑器名称为 **dom-canvas**。
HTML 经浏览器布局栅格化为 CanvasTexture，最终显示为 XY 平面，中心为原点，正面朝 +Z；支持双面显示（背面文字镜像）。

```vue
<DomCanvasComponent
  :dom-content="html"
  :pixel-width="512"
  :pixel-height="256"
  :width="4"
  :position="[0, 2, 0]"
  :rotation="[0, 0.2, 0]"
  @error="console.error"
  @warning="console.warn"
/>
```

在 TresCanvas 内使用，组件导入方式同本服务其他动态组件。支持常规 Object3D 的 position、rotation、scale、visible，父组隐藏也会停止毛玻璃采样。

## 参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| domContent | 内置圆角玻璃示例 | 可信 HTML 字符串，内联 CSS 或随 HTML 附带的 style |
| pixelWidth / pixelHeight | 512 / 256 | 输出画布像素尺寸，16～2048；HTML 按原始比例完整适配并居中，剩余区域透明 |
| width | 4 | 世界宽度；高度自动按像素宽高比计算 |
| pixelRatio | 2 | 栅格化倍率，0.5～4，单边纹理限制 4096 |
| opacity | 1 | 整体不透明度，0～1 |
| glass | true | 是否启用场景背景模糊；关闭后保留原始 HTML 透明底色 |
| captureScale | 0.5 | 场景采样分辨率倍率，0.1～1，采样单边最大 2048 |
| refreshKey | 0 | 改变值重新截图；也可以通过组件 ref 调用 refresh() |

`ready` 表示最新纹理准备好；`error` 表示捕获失败并保留上次成功结果；`warning` 报告不支持的背景滤镜。
HTML 先按自身尺寸布局，再整体缩放到画布内（contain），不随画布宽高重新排版或拉伸。没有明确宽度时按内容固有宽度布局；需要固定换行位置时，在 HTML 最外层设置设计宽度，例如 `style="width:512px"`。HTML 自身设置的 overflow 裁切仍然有效；盒阴影等超出布局边界的绘制效果不参与自动尺寸测量。
首次失败时面板不显示。内容和像素尺寸变化自动刷新；异步刷新串行合并，旧结果不会覆盖新内容。纹理不是逐帧 DOM 截图。

## 透明和毛玻璃

- HTML 的 RGBA 背景、透明图片、文字、圆角保留 alpha；完全透明片元丢弃。平面 depthTest 开启、depthWrite 关闭，前方不透明物体能遮住面板。
- 普通 HTML 元素的 `backdrop-filter: blur(12px)` 或 `-webkit-backdrop-filter` 会生成布局一致的玻璃蒙版；半透明底色、边框和文字仍在清晰内容纹理内。
- blur 半径最大 64 CSS px，依据平面投影尺寸转换到屏幕；模糊是近似高斯效果，不承诺逐像素等同浏览器。
- 采样阶段隐藏所有 dom-canvas，并以当前面的世界平面裁掉前方几何，最终叠加清晰内容。每个可见玻璃面增加一次场景渲染；不含玻璃的 HTML 无此额外渲染。

## 从 domPanel 迁移

复制旧组件 `domContent`，在 HTML 最外层保留原 DOM 的设计宽度，再设置输出画布尺寸及期望世界宽度。原来的 `center/transform/sprite/distanceFactor/domID` 属于 DOM 叠加层参数，不是本组件参数；用 Object3D 变换定位。
Shadow DOM 隔离意味着宿主的 UnoCSS、全局 class 不自动继承：旧内容中的 `text-white`、`left-20` 等需改为内联 CSS，或在 domContent 中提供对应 style。
未改动 `D:/code/tvt-js-plugins/src/plugins/UIdemo/components/domPanel.vue`。

## 支持边界

- 使用 WebGLRenderer、普通单视口相机；不支持 WebGPU/XR、分屏视口、递归反射摄像机或多摄像机同帧共享该材质。玻璃背景为原始场景，不含后期特效及网页 DOM 背景。
- 相交的半透明几何仍受 Three.js 按对象排序限制；多个 dom-canvas 毛玻璃不会互相折射/模糊。自定义 ShaderMaterial 必须支持 Three 的裁剪 chunks，否则其前景可能进入玻璃采样。
- 玻璃支持普通元素单独的 blur(px)；伪元素玻璃、嵌套/交叠玻璃、混合模式及组合滤镜不保证正确。DOM 内相互覆盖的内容不会被当作独立玻璃背板重新模糊。复杂 CSS mask/clip-path/3D transform 以浏览器 foreignObject 栅格化能力为限。
- 展示型快照，不执行脚本、DOM 点击或输入；不实时同步视频、Canvas、CSS 动画。动态数据请更新 domContent 后刷新。HTML 内图片与字体须同源、内嵌或允许 CORS；页面 CSP 需允许 data SVG/image 资源。字体快照取决于 html-to-image 对字体规则的读取能力，建议系统字体。
- 只接收可信 HTML；移除常见脚本/嵌入节点及事件属性仅为避免意外执行，不是完整安全净化器。不要直接展示未净化的用户输入。

## 文件职责

- `defaults.ts`：默认值、参数类型及数值限制。
- `rasterize.ts`：离屏布局、内容截图、玻璃蒙版和离屏节点释放。
- `fitContent.ts`：测量内容范围、等比缩放及透明留白定位。
- `captureScene.ts`：背景采样、前方裁剪、渲染状态保护。
- `../domCanvasComponent.vue`：刷新调度、纹理生命周期、场景接入。
- `../../shader/domCanvasComponent/`：独立顶点和片元 shader。

## 人工验收清单（尚未执行）

按项目规则没有运行构建、启动服务器或浏览器调试。以下需要后续实际场景验收，不能视作已通过：

1. 在面板前后放置不透明方块，移动相机，确认前景遮挡、后景透过透明边缘。
2. 使用透明 PNG、半透明渐变、圆角和 `opacity:0.5`，检查无黑色矩形、无重复透明度叠加。
3. 圆角元素添加 `backdrop-filter:blur(12px)`，后方放棋盘或条纹；移动相机及背景，确认背景实时模糊、文字清晰、面外不模糊。
4. 改变 DPR、面板旋转和缩放；观察玻璃蒙版贴合及采样位置。检查对数深度场景。
5. 连续修改内容、触发图片加载错误、在捕获中卸载，确认错误事件、旧结果保护以及离屏节点释放。
6. 多实例、父组隐藏/恢复及切换 glass，检查场景可见性和渲染状态没有被采样污染。
7. 将同一 HTML 的画布切换为横向、正方形及竖向，确认文字和圆角等比缩放、内容完整居中、留白透明，玻璃区域与模糊半径同步缩放。

实现参考：[html-to-image](https://github.com/bubkoo/html-to-image)、[Three Material](https://threejs.org/docs/pages/Material.html)。
