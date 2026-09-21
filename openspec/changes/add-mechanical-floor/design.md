## Context
源模型包含一个 Meshopt 压缩静态网格、一个金属 PBR 材质及 WebP 纹理，约 35778 三角形。模型命名及 metadata 指示 5 米模块；实际宽深约 4.996 米，保留 4 毫米拼缝。
## Goals / Non-Goals
支持静态重复拼接和材质调节；不新增动画、实时平面反射或透明透射，不更改通用预览。
## Decisions
采用项目 getResUrl 解析远程资源，GLTFLoader 配置 MeshoptDecoder。几何烘焙世界变换并居中、顶面置零。每 4×4 个模块一个 InstancedMesh，共享几何和物理材质，启用包围体裁剪；每轴限制 1–32。仅块数变化更新布局，材质变化仅更新属性，无逐帧循环。保留原始贴图和色彩乘色。reflectivity 使用 specularIntensity，IOR 独立调整；全金属时这两个非金属参数影响有限，环境反射强度可独立控制。组件卸载释放实例、几何、材质和贴图；加载晚于卸载也释放资源。
## Risks / Trade-offs
实例化降低绘制提交开销，不减少三角形；32×32 全可见仍可能受 GPU 限制。分区裁剪改善局部视角，不能承诺固定帧率。需宿主环境贴图展示环境反射。
## Validation
新增 textureContrast 通过片元着色器 uniform 调节底色采样，以白色为锚点：0 去除底色纹理明暗、1 保留原图、2 增强暗纹；保留 alpha 与法线。着色器片段独立存放于 src/shader/mechanicalFloorComponent，无自定义顶点着色器。emissiveIntensity 调节原始发光贴图强度，默认 1，范围 0–10。材质模块负责注入，仅更新 uniform，不重新编译或增加绘制提交。

按用户项目规则不运行构建、服务或浏览器。检查模型 JSON、静态源代码、局部 lint 与 diff；实际画面及帧率留待运行验证。
