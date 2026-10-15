## Context

服务使用 Vue3、Tres.js 5.2.1、Three.js 0.180 和 federation。参数控件统一由 createConfigPane 创建，发布映射由 dcsConfig 自动生成。按用户最新要求，组件直接复用现有通用预览与参数协议；模型特有的风格处理留在组件内部，不单独创建预览页。

参考 https://isoglow.dev/ 的暗色、精细工程结构线和温暖发光。示例 MRBike.glb 使用 Draco，约 125946 三角形、737 节点、330 个 mesh 定义、28 材质，贴图内嵌。HEAD 请求对测试来源 http://localhost:5173 返回了 Access-Control-Allow-Origin；这不代替实际页面来源的 CORS 验证。

## Goals / Non-Goals

**Goals:** 在线 GLB、动态 URL、三种明显不同的风格、原始材质恢复、资源所有权明确、预览与组件分离、完整参数面板和可复用宿主事件。

**Non-Goals:** GLB/配置导出、额外复制、组件内部相机/灯光/网格/Bloom/渲染器、自动播放 GLB 动画、额外参数协议、独立预览页或场景配置。

## Decisions

- 2026-10-15 重新对照参考站公开 3D 示例源码：灰色结构线与较亮外轮廓、暗色实体、局部暖光共同构成层次。组件采用相同的视觉分工，不修改共享预览的相机、背景或后处理。

- 加载工具使用 fetch 的 AbortController、GLTFLoader.parseAsync、独立 LoadingManager、项目资源路径的 Draco 及 Meshopt。外部资源路径以最终响应 URL 为基准；记录资源加载失败，避免外部贴图失败被误判为成功。错误明确提示 CORS、资源地址、HTTPS 混合内容和合法同源代理，不设置绕过 CORS 的请求头。
- 每次 URL 变更立即作废旧请求并释放旧运行时。不可中断的解码/解析完成后检查请求代数，并释放过期结果。卸载同样作废请求；不使用全局 GLTF 或解码器缓存，避免实例之间互相释放。
- Three.js 工具克隆模型节点树，保留名字、层级、几何和原始材质引用；材质与结构线属于克隆运行时。关闭 enabled 逐网格恢复原材质并隐藏结构线，不重载模型。源 GLB 不变。
- 使用 MeshStandardMaterial、EdgesGeometry、LineSegments2 和 LineSegments；颜色、透明度和发光仍由同一套普通参数控制。三种预设在 materials.ts 和 Shader 内决定绘制方式，不向参数面板写入新的值。
- ISO-GLOW 保留原材质的明暗区分，默认采用中性炭灰表面、灰色结构线与暖色发光。反面壳沿投影法线扩张约 1 CSS 像素，为圆滑曲面补充连续外轮廓。普通材质只有柔和的 Fresnel 边光，原本自发光或明确命名为灯／显示部件的材质另有局部发光；无法可靠识别未标记部件的通电语义。
- 蓝图使用表面排线与平面化着色，可见结构用实线，GreaterDepth 隐藏线层绘制低亮度虚线；不再显示原始三角网格对角线。X-Ray 使用 Fresnel 权重分布透明度，面中心几乎透明、边缘更亮，以加色混合展示内部结构，不写深度但接受宿主场景深度遮挡。
- 表面 Shader 通过 onBeforeCompile 注入，共享稳定 uniform；轮廓使用独立顶点／片元 Shader，均放在 src/shader/isoGlowModelComponent。透明／裁切材质保留纹理 alpha、跳过反面轮廓；骨骼、morph 和实例的轮廓复用对应 Mesh 类型与原几何。轮廓与 LineSegments2 自行读取当前视口，不依赖宿主传参或新的 Vue 渲染循环。
- 只在首次显示结构线或阈值变化时提取；阈值变化合并短时连续更新，按网格批次让出主线程，同几何复用提取结果，仅保留当前阈值。骨骼/形变和实例网格以加载时静态姿态提取，不自动播放动画。
- 组件 props 和 dcsConfig.default 共用 ISO_GLOW_DEFAULTS；参数面板控件恢复原实现，stylePreset 只使用普通 Select。所有风格分支在组件工具与 Shader 内执行，不向通用控件层添加预设联动协议。
- previewEntry.vue、templateComponet.vue、createConfigPane.ts 完全保持原样；只通过 dcsConfig 的既有 default/config 注册接入预览。取消本次增加的取景、事件转发、默认值复制和错误面板逻辑，不引入预览适配协议。
- loadDynamicComponent、zone3Deditor 和 gisPlaneEditor 既有路径按远程组件加普通 props 加载；组件维持单个 TresGroup 根节点以接收位置、旋转等宿主属性。所有 loading、loaded、loadError 事件均为可选，组件不依赖宿主转发事件才能工作。
- 加载错误通过组件内部的 Cientos Html 呈现，新请求清除旧提示，卸载随组件清理；不向通用说明面板注入错误。相机与取景继续由现有宿主管理，组件不改变相机、模型尺寸和原点。
- 移除额外的独立回归检查脚本；它不属于组件运行依赖或发布内容。本次收敛通过类型、lint、SFC 和引用检查验证，不增加新的测试工具。

## Risks / Trade-offs

- 单个极大网格的 EdgesGeometry 为同步计算 → 按网格批次处理、共享几何复用及阈值防抖，实际耗时留待浏览器验证。
- LineSegments2 保持 CSS 像素级前景线宽，轮廓壳用于不透明实体；蓝图隐藏线仍使用细 LineSegments。轮廓与隐藏线是额外绘制，复杂模型实际 draw call 与耗时待浏览器验证。
- 材质透明度与透明物体排序仍受 Three.js 渲染机制影响 → X-Ray 使用较低的视角加权透明度、保留外部深度测试；半透明表面关闭依赖不透明遮挡的轮廓和隐藏虚线。
- 通用预览沿用既有透视场景，Bloom 由外部场景按需提供 → 组件在宿主无 Bloom 时仍提供自发光材质和清晰结构线。
- 静态检查不能证明实际画面或 GPU 帧率 → 遵守 AGENTS.md，不启动构建/调试/截图，并在交付时明确说明。

## Validation

- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit` 通过。
- 新增组件的局部 ESLint 通过；previewEntry.vue、templateComponet.vue 和 createConfigPane.ts 均与 Git HEAD 一致。
- dcsConfig 原有 lint 问题保留；本次未修改既有配置项或通用参数控件。
- 组件 Vue SFC 编译及源码边界检查通过；额外协议、独立预览及失效引用一并清理，错误反馈无需通用预览监听。三个宿主只读核对了既有传参与生成代码，没有修改外部仓库。
- 一次性内存行为检查通过：预设 mode、轮廓／隐藏线可见性与混合深度状态不同，切换保持参数和材质／结构线缓存；关闭风格化恢复原材质。共享几何、alpha 纹理、实例／骨骼网格、阈值替换与重复释放检查通过；未新增或保留独立检查脚本。
- 检查了表面 Shader 注入位置与 Three.js 当前 chunk 兼容性；实际 GPU Shader 编译和画面差异仍需浏览器验证，CPU 检查不作为视觉验收。
- OpenSpec strict 校验、SVG XML 解析及 `git diff --check` 通过。
- 示例 MRBike 的 HTTP/CORS 响应和 GLB 元数据已检查；未在浏览器加载/渲染该 Draco 模型。本轮没有启动构建、开发/预览服务、浏览器调试或截图，实际画面、页面来源下的 CORS、GPU 帧率与发布产物仍未验证。
