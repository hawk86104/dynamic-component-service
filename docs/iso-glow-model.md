# IsoGlowModel 三维模型风格化

组件类型为 `isoGlowModelComponent`，源码位于 `src/components/isoGlowModelComponent/index.vue`，预览使用现有 `#/preview/isoGlowModelComponent` 路由。`dcsConfig.ts` 注册会自动接入现有 federation 的 `./isoGlowModelComponent` 暴露项，TvT.js 按既有动态组件协议加载即可。

视觉参考：[ISO-GLOW](https://isoglow.dev/)。目录封面为 SVG 风格示意，未经浏览器截图验证。

## 参数

| 参数 | 类型 / 范围 | 默认值 |
| --- | --- | --- |
| modelUrl | 必填，HTTP/HTTPS GLB；也可用同源代理路径 | 预览使用 [MRBike.glb](https://opensource.cdn.icegl.cn/model/industry4/MRBike.glb)；宿主须传入 |
| enabled | boolean | true |
| stylePreset | iso-glow / blueprint / x-ray | iso-glow |
| surfaceColor | 颜色字符串 | #1b1d20 |
| surfaceOpacity | 0–1，1 为不透明 | 1 |
| showEdges | boolean | true |
| edgeColor | 颜色字符串 | #6e7681 |
| edgeOpacity | 0–1 | 0.85 |
| edgeThreshold | 0–180 度 | 35 |
| emissiveColor | 颜色字符串 | #ff9d3c |
| emissiveIntensity | 0–10 | 1.25 |

| 预设 | 组件内部的着色方式 |
| --- | --- |
| ISO-GLOW | 暗色实体，保留原材质之间的明暗层次；细结构线与约 1 CSS 像素的反面轮廓，柔和暖色边光；原本自发光或明确命名为灯／屏幕的材质获得局部发光 |
| 工程蓝图 | 弱化实体光照，以细密排线表现表面；可见结构画实线，被实体遮挡的结构画低亮度虚线；不显示三角网格对角线 |
| X-Ray | Fresnel 视角加权的半透明壳层，中心接近透明、边缘更亮；加色混合显示内部结构，不写深度，但仍接受外部物体的深度遮挡 |

组件 props 和注册的 default 共用一套默认配置。stylePreset 是普通 Select 参数，其渲染差异全部在组件内部处理；切换它不会重写颜色、透明度或发光值。面板调参和“复制当前带参数”沿用项目原有逻辑。组件不提供额外复制、配置导出或 GLB 导出。

各预设会在所传颜色和透明度上执行自身的明暗、透明度分布与线条强度处理；X-Ray 的 surfaceOpacity 为透明壳层强度，不会在数值为 1 时变成实心。ISO-GLOW 的自发光用于边光和可识别的发光材质，避免整机被同一暖色淹没；无法从普通 GLB 自动判断未标记部件的通电语义。切换预设、颜色或发光不重新加载模型或提取结构线。已保存的参数保持原值，新默认配色只用于新建实例。

`edgeThreshold` 越低，越多相邻面夹角被识别为结构线。它控制 EdgesGeometry 几何边缘，不影响曲面外轮廓。前景结构线使用 LineSegments2，内部自动读取宿主视口以保持 CSS 像素级线宽；无需宿主传入分辨率。模型不透明时，ISO-GLOW 增加反面轮廓，蓝图增加隐藏结构虚线；半透明表面不使用这两个依赖深度遮挡的额外层。showEdges 统一控制结构线、轮廓与隐藏虚线。

## 放入已有场景

在已有 TresCanvas 内动态挂载组件，传入 `modelUrl` 和所需参数；与其他组件一样可在外层 TresGroup 上使用位置、旋转、缩放。组件不调整模型原始尺寸、原点或节点层级。

```vue
<IsoGlowModel
  :model-url="modelUrl"
  style-preset="blueprint"
  surface-color="#123454"
  :surface-opacity="1"
  edge-color="#78dfff"
  :enabled="enabled"
  :edge-threshold="35"
/>
```

以下事件可选，不接收它们也能加载、调参和显示加载错误，现有宿主无需增加事件转发或适配：

- `loading`：`{ modelUrl, stage: 'loading' | 'styling' }`。
- `loaded`：`{ modelUrl, object }`，`object` 是已挂载的模型 Object3D，可供宿主自行取景；结构线初次处理完成后触发。
- `loadError`：`{ modelUrl, message, resourceUrls }`，包含错误说明及已知失败资源地址。
- `getObject3D()`：暴露当前组件根 Group；资源由组件管理，请勿由宿主重复释放。

关闭 `enabled` 会恢复原始材质引用并隐藏结构线，保留已加载模型。颜色、透明度、预设和自发光更新复用材质；仅模型 URL 更改重新加载。结构线开关复用当前缓存；阈值变更以 120ms 合并连续调整，按网格批次重建并释放旧缓存。同一几何的普通节点共享提取结果。

支持 Draco 和 Meshopt，Draco 解码器沿用项目 `draco/gltf/` 资源与 `__REMOTE_ASSET_MAP__` 路径。风格化忽略普通颜色贴图的 RGB，裁切与透明材质保留原纹理的 alpha，发光材质保留发光贴图；关闭风格化恢复全部原始材质及贴图。骨骼、morph 和实例网格结构线使用加载时静态姿态，组件不播放动画。

## 预览场景与跨域

组件和其他动态组件共同使用现有预览路由，仅通过 `dcsConfig.ts` 注册接入。`previewEntry.vue`、`templateComponet.vue` 和 `createConfigPane.ts` 均保持原样；不新增预览页、场景配置、参数协议或事件透传要求。`loadDynamicComponent`、`zone3Deditor`、`gisPlaneEditor` 继续按既有远程组件与 props 方式加载，无需同步修改。

材质自发光、着色、结构线和模型加载错误提示由组件负责。相机、取景、灯光、背景、OrbitControls 和 Bloom 等由已有宿主场景管理，组件不创建或修改它们，也不自动缩放或居中模型。通用预览继续使用原有透视相机和环境；本次不再为 ISO-GLOW 增加特殊场景或自动取景逻辑。

资源服务器须为当前页面来源返回正确的 `Access-Control-Allow-Origin`。GLB 的外部贴图与缓冲区同样需要允许访问，组件以最终响应地址解析相对资源。HTTPS 页面引用 HTTP 模型可能被浏览器阻止。不能用前端请求头绕过 CORS；应修正资源服务器响应头，或配置有权访问资源的同源代理。

加载失败由组件使用现有 Cientos Html 在画布容器中显示错误及失败资源，包括外部依赖失败；无需宿主监听 `loadError`。新 URL 开始加载时清除上次错误，组件卸载时一并移除提示。修改 URL 时中止可取消的请求、立即释放旧模型；无法取消的解析结果会按请求代数丢弃并释放。卸载释放所有场景中的几何、材质、贴图、骨骼及该请求的解码 worker。

材质与结构线工具位于组件目录，Shader 位于 `src/shader/isoGlowModelComponent/`。轮廓复用原几何，前景线与隐藏线复用当前阈值提取结果；ISO-GLOW 增加轮廓绘制，蓝图增加隐藏线绘制，有额外 draw call 成本。透明或裁切原材质跳过反面轮廓，以免覆盖玻璃、叶片等透明轮廓。

额外的 CPU 回归检查脚本已移除。此次改进通过无输出类型检查、局部 lint 和一次性内存中的材质／生命周期检查验证；遵守 AGENTS.md，未启动构建、服务、浏览器调试或截图。Shader 的实际 GPU 编译、与参考站的画面对比、页面 CORS 和 GPU 帧率尚未验证。
