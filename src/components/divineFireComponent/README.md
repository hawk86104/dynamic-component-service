# 模型附着火焰 / Divine Fire

组件类型：`divineFireComponent`。注册后可从组件目录进入 `/#/preview/divineFireComponent`，沿用现有 federation 暴露方式。

默认在一个细分正方体表面燃烧。填写 `modelUrl` 后加载在线 GLB/glTF，并将火焰附着到其中的 Mesh；清空地址恢复正方体。组件原点位于模型底面中心，火焰沿组件局部 +Y 延伸。通过父级 Object3D 控制整体位置、旋转和缩放。

```vue
<script setup lang="ts">
import DivineFire from './components/divineFireComponent.vue'
</script>

<template>
  <TresGroup :position="[0, 0, 0]">
    <DivineFire
      model-url="https://your-assets.example.com/model.glb"
      :model-size="1.6"
      :height="0.55"
      :burning="true"
    />
  </TresGroup>
</template>
```

模型地址为占位示例，替换为实际可访问的资源；省略 `model-url` 即可使用正方体。

## 调参

| 分组 | 参数 | 作用 |
| --- | --- | --- |
| 绑定模型 | `modelUrl`, `modelSize`, `showSource` | 在线模型、适配后的最大边长、是否显示模型原材质 |
| 燃烧控制 | `burning`, `leadIn`, `leadOut` | 点燃/熄灭及过渡秒数；时长为 0 时立即切换 |
| 播放 | `autoPlay`, `animationSpeed` | 暂停/调速火焰运动与模型内第一段动画；点燃/熄灭过渡仍可执行 |
| 火舌形态 | `height`, `inflate`, `tongueScale`, `tongueSpeed`, `tongueVariation`, `erosion`, `softness`, `fresnelPower` | 拉伸高度、表面外扩、火舌密度/速度/随机性、侵蚀、柔边与视角衰减 |
| 火焰纹理 | `textureScale`, `scrollSpeed`, `distortion`, `distortionSpeed` | 程序噪声纹理的密度、上升与扭曲 |
| 火焰颜色 | `brightness`, `colorCore`, `colorMid`, `colorDeep` | 亮度与焰心、焰身、焰边三段颜色 |

`modelSize` 调整本体尺寸，`height` 和 `inflate` 使用组件局部单位；父级缩放同时作用于模型与火焰。参数默认值统一定义在 `defaults.ts`，数字越界时限制到面板范围，非有限数字回退到默认值。修改火焰参数不重新请求模型。

`showSource=false` 仅隐藏模型材质，保留火焰子网格；模型原本隐藏的材质不会被强制打开。

## 在线模型与事件

- 支持 glTF 2.0 的 GLB/glTF，包含 Draco 和 Meshopt 压缩网格；Draco 解码器通过现有 `getResUrl('draco/gltf/')` 定位。
- 模型及其外部贴图、缓冲资源必须允许当前页面来源的 CORS。HTTPS 页面使用 HTTPS 模型链接。独立 glTF 的相对依赖基于最终响应 URL 解析。
- 保留原始模型材质、层级、蒙皮、形变目标和实例变换；自动播放第一段内置动画。模型嵌入的相机和灯光不接入宿主场景。
- 地址输入合并等待 400ms 后加载，初始地址直接加载。新请求会取消旧请求；迟到结果会释放；新模型成功准备后才替换当前对象。加载失败时保留原对象。
- 发出 `loading({modelUrl})`、`loaded({modelUrl, source})`、`loadError({modelUrl, message})`。错误同时写入控制台，宿主可按自己的界面展示。
- 对外暴露 `getObject3D()`、`getModelStatus()`、`ignite(duration?)`、`extinguish(duration?)`。后两个方法立即开始对应过渡，并返回 `{burning: true/false}`，供编辑器同步保存；也可直接响应式修改 `burning` prop。

## 场景接入与效果范围

组件只拥有模型与火焰网格，不创建 TresCanvas、相机、轨道控制器、灯光、地面、环境或后期处理，不修改渲染器或宿主场景设置。面板不提供参考示例的 Scene、火光、Bloom、线框或法线调试设置。

效果是沿几何体表面拉伸的透明火焰壳层，采用程序噪声侵蚀和叠加混合，保留深度测试并关闭深度写入。火焰材质不依赖场景灯光；模型本体按原材质接受宿主灯光。原站的 Bloom 光晕由宿主自行配置。

默认正方体每个方向细分 10 段。外部模型不自动细分，火舌细节受原始网格顶点密度影响。静态和蒙皮网格在火焰副本中焊接硬边/UV 接缝；含形变目标的网格保留原顶点，避免合并不同形变。透明层与其他透明物体的排序遵循 Three.js 的常规限制。

火焰在组件坐标内计算，使用 CPU 组合后的局部/视图矩阵，避免将大型 GIS 世界坐标直接输入噪声；自定义着色器包含对数深度和裁剪片段。模型替换和卸载时释放所有自有几何体、材质、纹理、骨骼、动画与解码器，取消计时器和请求。

## 来源与验证

参考 Jaime Torrealba 的 [Divine Fire 展示](https://lab.jaimetorrealba.com/divinefire)及其 [视图源码](https://github.com/JaimeTorrealba/creative-lab/blob/main/src/views/D-G/DivineFireView.vue)。实际算法位于 [divine-fire 组件目录](https://github.com/JaimeTorrealba/creative-lab/tree/main/src/components/demos/d-g/divine-fire)：借鉴其表面焊接、法线遮罩、火舌拉伸、双平面噪声侵蚀与默认火焰配色，按本服务的 TypeScript、参数体系和资源生命周期重新组织。不引入原项目的 GSAP、独立 Pane 或后期处理依赖。

共享 simplex 噪声来自 Ashima Arts / Stefan Gustavson 的 [webgl-noise](https://github.com/ashima/webgl-noise)，许可随 `src/shader/divineFireComponent/NOISE_LICENSE.txt` 保留。

目录预览使用真实组件录制的 `public/preview/animated/divineFireComponent.webp`，配套 `.poster.webp` 与动图首帧完全一致。首页默认显示封面，鼠标移入后播放，移出恢复封面。动图为 600×400、32 帧、约 2.67 秒，固定镜头展示默认正方体的自然燃烧动画。

初次实现按项目 `AGENTS.md` 跳过 build/dev/serve、浏览器调试和截图，静态检查结果见本次 OpenSpec 变更的 `validation.md`。2026-11-05 根据用户明确要求，复用已启动的服务完成默认正方体的实际渲染录制；未运行构建或启动新服务。在线模型加载、外部编辑器/GIS 集成和全面 GPU 兼容性仍未验证。
