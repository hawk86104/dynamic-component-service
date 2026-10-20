# Design

## Context

动机见 proposal.md。项目使用 Vue3、Tres.js 5.2.1、Three.js 0.180，配置和 federation 暴露由 `dcsConfig.ts` 统一驱动。已阅读上游 `src/three-video-projection.ts` 和两个 GLSL 文件，参考提交为 `4984b709aac73a3a6f9163c1162898d841999f94`。

## Goals / Non-Goals

**Goals:** 真正的三维表面投影、宿主资源所有权清晰、动态目标及变换、原有 2D 参数习惯、一套普通 props 接入现有预览。

**Non-Goals:** Cesium、相机标定 UI、HLS 解码、新增 Canvas/渲染器、修改通用预览、修改现有 2D 实现、自动启动构建或浏览器验证。

## Decisions

- 组件 SFC 只管理 props、Tres 生命周期和公开 API；投影工具、视频控制、默认值、演示几何分别位于组件子目录。使用项目已有 Three.js，不安装完整上游包，避免带入不需要的 Cesium/标定能力。
- 延续上游的投影相机、世界空间投影矩阵、独立 overlay 和深度代理方案，不替换宿主材质，也不改 castShadow/receiveShadow。区别于简单平面屏幕，此方案复用真实模型几何。保留上游 MIT 许可和引用信息。
- 相机局部朝向沿用 2D 组件：heading=0 朝 -Z，正 heading 向 +X，pitch 为俯仰角；新增 roll。相机挂在组件根节点，读取包含父级变换的世界矩阵。水平/垂直张角换算为相机 aspect 和 fov。
- 每次 Tres onBeforeRender 发现当前可见网格，并按 name/UUID（可匹配祖先）或公开 setTargets 绑定选择接收体；可见非目标同时作为遮挡体。代理分组带内部标记，跳过投影对象，避免多实例递归发现。
- 代理共享宿主几何、骨骼和实例数据，跟随当前 morph、材质可见性和矩阵；只释放组件创建的材质及代理。暂不接收 BatchedMesh 或任意自定义顶点位移；文档明确边界。
- 叠加材质通过 MeshBasicMaterial 的 onBeforeCompile 注入外置顶点/片元 Shader，复用 Three.js 自带的骨骼、morph、实例、alphaTest、裁剪平面和 log-depth chunks；原材质颜色不影响投影颜色，纹理 alpha 仍参与覆盖范围。
- 深度 pass 使用 RGBA 编码的透视深度，以避免宿主 logarithmicDepthBuffer 改变 depthTexture 编码后无法比较；另处理 reversedDepthBuffer 的范围和比较方向，并手动解码视频 sRGB。深度 pass 保存并在 finally 中恢复 render target、viewport、scissor、clear、XR 和 shadow auto-update 状态。
- 视频源变化时创建新 video/VideoTexture，避免复用已上传贴图的尺寸；监听器与播放 Promise 受当前实例生命周期约束。未就绪时隐藏投影，错误事件与控制方法不依赖通用预览。
- 演示地面、背景墙、箱体和球体由组件管理生命周期，但直接挂在宿主 Scene 下，固定在场景坐标；演示组使用固定偏移 `[0, 2.5, 3]`，保留默认预览原先的摆放。组件根节点仅承载投影相机，拖动工具的移动、旋转、缩放不再带动演示接收体；重新开启演示仍使用相同固定位置。通用预览和参数控件保持原样。

## Risks / Trade-offs

- 每帧深度 pass 和代理增加绘制开销 → 提供分辨率、目标筛选和遮挡开关，不声称已验证 GPU 性能。
- 自定义 Shader 位移、BatchedMesh 和透明材质的光线透射无通用等效方案 → 明确支持边界，深度代理保留常见 alphaTest 和材质可见性。
- 精度偏移过小产生自遮挡，过大导致漏光 → 提供深度偏移控件。
- 视频跨域和自动播放取决于实际宿主环境 → 采用 anonymous CORS、静音播放和可重试的错误事件。
- AGENTS.md 禁止自动构建/调试 → 仅执行静态类型、局部 lint、源码/配置检查、OpenSpec 严格校验及 diff 检查；实际 WebGL 画面留待用户授权后验证。

## Migration Plan

通过新增配置项暴露组件，无已有数据迁移。回滚删除本次新增文件和注册项即可，不涉及宿主模型或现有预览改造。

## Validation

- 全项目 `vue-tsc --noEmit` 通过；Vue SFC script/template 静态编译通过。props 使用显式接口，避免 Vue 运行时属性编译器无法解析 `typeof` 类型查询。
- 新增组件及工具文件 ESLint 通过；新增 dcsConfig 注册区无 lint 问题，配置文件既有 208 项 lint 错误与 HEAD 基线一致，未顺带修改。
- 一次性内存 CPU 检查覆盖：透视/父级变换、按祖先名称及 UUID 筛选、显式绑定/清空绑定、晚加入/移除/隐藏目标、替换几何、非目标深度代理、骨骼/实例共享、多投影器隔离、遮挡开关、Shader 注入，以及渲染失败时宿主状态恢复。
- 视频 CPU 检查覆盖：首帧就绪、播放/暂停/停止、地址替换、旧播放 Promise 失败失效、自动播放拒绝及重试、加载失败、监听和帧回调清理、重复卸载；宿主几何与材质未被释放。
- 24 个 props/default/config 字段、3 个播放按钮、唯一注册及文件引用核对通过；SVG XML 解析、OpenSpec strict 和 diff whitespace 检查通过。
- 现有 2D 组件、两个通用预览文件、package.json、yarn.lock 与 vite.config.ts 均未改动。
- 演示接收体固定位置修正：类型、局部 lint 和 CPU 世界矩阵检查通过；对预览拖动父级及投影根节点执行移动、旋转、缩放后，四个演示网格的世界矩阵均保持原样，投影相机矩阵正常变化。关闭/重新打开恢复相同场景位置，关闭和卸载清理资源；通用预览及拖动工具实现未改动。
- 按 AGENTS.md 跳过构建、开发/预览服务、浏览器调试和截图。CPU/源码检查不代表 GPU Shader 编译、实际画面、帧率、发布产物或真实页面视频 CORS 已验证。
