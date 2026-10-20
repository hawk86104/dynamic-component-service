# 三维视频投影

`video3DProjectionComponent` 将视频按透视相机投到真实模型表面，参考 [vid3d-projection 的 Three.js 实现](https://github.com/hh-hang/vid3d-projection)。与现有 2D 组件的远端平面视频不同，它可以跨墙面、地面、箱体及曲面连续投影，并用场景深度阻止穿透遮挡物。

组件已注册到 `dcsConfig.ts`，目录中的“三维视频投影”直接使用现有通用预览，远程组件名称为 `video3DProjectionComponent`。默认展示可关闭的地面、墙面、箱体和球体；封面 SVG 是示意图。

演示接收体固定在场景中，拖动工具只移动、旋转或缩放投影相机和视频投射范围，地面、墙面、箱体和球体保持原位。关闭后重新打开演示也会使用同一固定位置；组件卸载时会一并清理演示对象。

## 接入自己的场景

```vue
<script setup lang="ts">
import { ref } from 'vue'
import Video3DProjectionComponent from './components/video3DProjectionComponent.vue'

const projector = ref<InstanceType<typeof Video3DProjectionComponent> | null>(null)
// 模型加载完成后，也可以调用 projector.value?.setTargets(model.scene)
</script>

<template>
  <!-- 放在已有 TresCanvas 内；位置是投影镜头原点 -->
  <Video3DProjectionComponent
    ref="projector"
    :position="[0, 3, 5]"
    video-url="https://dcser.icegl.cn/video/vlg.mp4"
    :show-demo-receivers="false"
    target-names="BuildingA"
    :angle="64"
    :angle2="40"
    :pitch="-20"
    :distance="15"
    @error="console.warn"
  />
</template>
```

`targetNames` 留空时，当前场景所有可见网格都接收投影。填写 mesh 或任意祖先的 **name/UUID** 可选择整个模型；多个名称以逗号、分号或换行分隔，精确匹配、区分大小写。晚于组件加载的模型会自动发现。不可见父级、隐藏材质、已移除目标和组件内部代理均不会保留投影。

位置、旋转、缩放按现有 Tres/Object3D 属性传递，投影相机跟随组件的父级变换。`heading=0` 朝本地 **-Z**，正 heading 转向 **+X**；正 pitch 向上，负 pitch 向下。角度都以度为单位，正 roll 绕相机本地 +Z 旋转。视频宽高比由水平/垂直张角共同决定，不会在读取视频尺寸后自动覆盖。

## 参数

| 参数 | 默认值 | 含义 |
| --- | --- | --- |
| `enabled` | `true` | 显示投影与辅助线；关闭后停止深度 pass，视频播放状态独立保留 |
| `videoUrl` | `https://dcser.icegl.cn/video/vlg.mp4` | 可动态切换的视频地址；跨域资源需允许当前页面来源 |
| `autoplay` / `loop` | `true` / `true` | 静音自动播放及循环；自动播放关闭时仍可手动播放 |
| `angle` / `angle2` | `64` / `40` | 水平/垂直视角，单位度 |
| `heading` / `pitch` / `roll` | `0` / `-20` / `0` | 局部朝向、俯仰、横滚 |
| `distance` / `near` | `8` / `0.1` | 投影远/近裁剪面；near 自动限制在 distance 内 |
| `flipX` / `stRotationDegree` | `false` / `0` | 水平镜像及围绕视频中心旋转；旋转后的越界部分裁掉 |
| `opacity` / `intensity` | `0.95` / `1` | 视频融合透明度及线性颜色强度 |
| `videoTint` | `#ffffff` | 视频染色 |
| `edgeFeather` | `0.035` | 视频边缘羽化宽度，按归一化 UV 计；0 为硬边 |
| `enableOcclusion` | `true` | 开启投影相机的场景深度遮挡；关闭后视频可透过前景物体 |
| `depthBias` | `0.001` | 归一化透视深度比较偏移；过小会自遮挡，过大会漏光 |
| `depthResolution` | `1024` | 深度图边长；面板可选 256/512/1024/2048/4096，受 GPU 上限限制 |
| `showFrustum` / `frustumColor` | `true` / `#00e5ff` | 视锥辅助线及其颜色 |
| `targetNames` | 空字符串 | 可选的接收目标名称/UUID 筛选 |
| `showDemoReceivers` | `true` | 内置三维演示接收体；接入业务模型时关闭 |

## 公开方法与事件

| 方法 | 行为 |
| --- | --- |
| `videoPlay(): Promise<boolean>` | 播放/继续；成功返回 true，失败发出 error 并返回 false |
| `videoPause()` | 暂停并保留当前画面 |
| `videoStop()` | 暂停并回到首帧 |
| `setTargets(root / roots / null)` | 绑定 Object3D 子树或数组，优先于 targetNames；null 恢复自动筛选，空数组禁止所有接收体 |
| `getTargets()` | 返回最近一次更新发现的实际接收网格数组 |
| `getObject3D()` | 获取组件根 Group，用于位置、旋转等宿主控制 |
| `getProjectorCamera()` | 获取当前投影相机供宿主读取 |
| `getVideoElement()` | 获取当前视频元素或 null；切换地址后元素会变化 |

`ready` 事件携带 `{ url, width, height, duration }`，在当前视频首帧可用后触发；`error` 携带 Error，同时在控制台报告加载或播放失败，避免无声失败。播放被浏览器拒绝后，可由用户点击播放按钮重试。

## 实现与适用范围

- 只使用宿主的 Three.js 渲染器和 Tres 渲染循环，不创建额外 Canvas、独立渲染器或服务。宿主的几何、材质及阴影设置保持原样，卸载只清理本组件持有的资源。
- 使用独立 overlay 和深度代理，共享几何、骨骼和实例数据，支持 Mesh、SkinnedMesh、InstancedMesh 的矩阵及 morph 更新。材质数组、visible、opacity、常见 map/alphaMap/alphaTest 和裁剪平面同步到代理。
- 遮挡由场景中所有可见网格参与；非接收体也能挡住视频。完全透明材质被跳过，半透明表面按实体遮挡，不模拟透射率。
- BatchedMesh、自定义 Shader 顶点位移、材质 displacementMap、自定义深度材质和非网格渲染对象不在通用代理的支持范围。原材质的额外光学效果不会复制到投影层。
- 接入 Three.js 标准骨骼/形变/实例 Shader 和 log-depth chunks；深度图使用 RGBA 编码的透视深度，视频采样显式解码 sRGB，最终由宿主输出颜色空间处理。
- 每帧动态发现模型；开启遮挡会额外绘制一次场景深度及接收体投影层。复杂场景可降低深度分辨率、收窄接收目标或关闭遮挡；实际 GPU 开销需在目标场景验证。
- 本次按 AGENTS.md 仅做静态检查及 CPU 行为检查，未启动构建、开发/预览服务、浏览器调试或截图，实际 WebGL 画面和页面来源下的视频跨域尚未验证。

上游许可和参考版本见 [THIRD_PARTY_NOTICE.md](./THIRD_PARTY_NOTICE.md)。
