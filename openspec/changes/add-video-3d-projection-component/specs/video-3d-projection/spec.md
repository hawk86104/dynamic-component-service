# Spec Delta

## Purpose

在动态组件服务中提供可配置的三维视频投影能力，使同一段视频能按空间相机方向融合到墙面、地面和立体模型表面，并能随目标、投影姿态及播放状态变化而更新，供现有预览及外部场景复用。

## ADDED Requirements

### Requirement: Perspective surface projection
组件 SHALL 根据自身空间变换、水平/垂直张角、朝向、俯仰、横滚、近裁剪面和距离将视频投到三维网格表面，只显示视锥内的视频，支持镜像、视频旋转、染色、强度、透明度和边缘羽化。

#### Scenario: Surfaces at different depths
- **WHEN** 视锥内存在处于不同深度的墙面、地面及立体接收体
- **THEN** 视频按同一透视关系贴合其表面，而不是只显示在远端平面

#### Scenario: Live orientation and transform updates
- **WHEN** 用户调整朝向、张角或组件/目标的父级空间变换
- **THEN** 投影和视锥辅助线跟随新参数及世界变换更新

### Requirement: Occlusion respects the host scene
组件 SHALL 默认剔除被场景可见物体遮挡的投影；未被选中接收投影的物体仍能遮挡视频。用户 SHALL 能关闭遮挡并调整深度偏移与深度分辨率。

#### Scenario: Unselected foreground blocker
- **WHEN** 前景物体遮挡被选中的后方接收体且遮挡功能开启
- **THEN** 视频不显示在被前景物体遮住的后方区域

#### Scenario: Occlusion disabled
- **WHEN** 用户关闭遮挡剔除
- **THEN** 组件停止深度预渲染，仍按视锥范围显示选中目标上的投影

### Requirement: Dynamic target binding
组件 SHALL 支持默认场景网格接收、按网格或祖先名称/UUID 精确筛选，以及通过公开方法绑定目标子树。隐藏或移除的目标 SHALL 不保留残影；普通、骨骼和实例网格 SHALL 跟随当前姿态，组件生成的投影辅助对象 SHALL 不成为新的接收体。

#### Scenario: Delayed model and target replacement
- **WHEN** 模型在组件挂载后加入场景、替换几何、改变姿态或从场景移除
- **THEN** 下一次更新采用当前可见目标且清除失效代理

#### Scenario: Programmatic binding and reset
- **WHEN** 宿主绑定某个模型子树或清空绑定
- **THEN** 仅该子树接收投影，清空后恢复名称筛选及场景自动发现

### Requirement: Video control and resource ownership
组件 SHALL 支持运行时切换视频 URL、自动播放和循环，以及播放、暂停、停止方法。加载或播放失败 SHALL 对外报告；切换视频和卸载 SHALL 释放旧视频及组件资源，保留宿主资源和渲染状态。

#### Scenario: Playback rejected or resource fails
- **WHEN** 视频加载失败或浏览器拒绝播放
- **THEN** 组件发出错误事件且不产生未处理的 Promise 拒绝，宿主可再次调用播放

#### Scenario: Source changed and component removed
- **WHEN** 用户快速切换视频 URL 后卸载组件
- **THEN** 旧视频监听及播放任务失效，贴图、材质、辅助线、渲染目标及代理被清理，宿主网格几何和材质未被释放

### Requirement: Existing service integration
组件 SHALL 通过现有注册协议提供一致的默认参数、调参控件、播放按钮、SVG 封面及使用说明，并提供可关闭的三维演示接收体，保持既有 2D 组件及通用预览行为不变。

#### Scenario: Catalog preview and host reuse
- **WHEN** 用户打开组件目录中的三维视频投影预览或将组件接入自己的场景
- **THEN** 现有通用预览可配置和操作该组件，关闭演示接收体后可投影到宿主模型

### Requirement: Demo receivers remain fixed in the scene
演示接收体 SHALL 独立固定在场景中，拖动工具对组件及其父级的移动、旋转、缩放 SHALL 只影响投影相机、视频投射范围与视锥辅助线。关闭演示或卸载组件 SHALL 清理独立的演示对象。

#### Scenario: Transform projector without moving demo
- **WHEN** 用户通过拖动工具移动、旋转或缩放投影组件
- **THEN** 投影相机和视频投射范围改变，地面、墙面、箱体与球体的世界变换保持不变

#### Scenario: Toggle demo after moving the projector
- **WHEN** 用户移动投影器后关闭并重新打开演示接收体
- **THEN** 演示物恢复同一固定场景位置，且卸载组件后不会留下演示对象
