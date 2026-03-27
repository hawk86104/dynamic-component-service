## Why

当前组件库已经具备烟雾、矩形跑光、液体容器等动态效果，但还缺少一种更聚焦的“液体本体内持续冒泡”组件。像香槟、饮料发酵、化学反应液、发光药剂等场景，重点常常不是容器外壳，也不是液位波动，而是液体实体内部不断上浮的细密气泡节奏。

参考网页 `champagne-fizz.html` 的视觉核心并不在真实流体，而在于底部成核、气泡上浮、轻微摆动、尺寸缓慢变化，以及接近顶部时自然消隐。这一类效果很适合抽象成 three.js / shader 驱动的动态组件，但需要从 2D canvas 逻辑重新整理为 3D 液体体积内部的粒子循环，而不是直接套用已有 `liquidContainerComponent` 的容器化结构。

## What Changes

- 新增一个 `liquidBubbleComponent`，用于表现“独立液体体块内部的持续冒泡”效果。
- 组件仅支持两种液体形状：长方体与圆柱体，不支持容器外壳、瓶体预设或自由轮廓。
- 将参考网页中的 canvas 气泡逻辑转换为 three.js + shader 方案，保留底部成核感、上浮、轻微摆动、尺寸差异、顶部消隐与高光观感。
- 移除参考网页中的点击生成、鼠标扰动、气泡爆裂火花、表面波线与整页氛围层，保留组件化所需的核心视觉。
- 组件代码放入 `src/components/liquidBubbleComponent/`，气泡与液体材质的 shader 代码放入 `src/shader/liquidBubbleComponent/`。
- 通过 `src/dcsConfig.ts` 注册组件入口、默认参数与调参面板，不修改通用预览基础设施。
- 补充对应的 OpenSpec 变更文档，明确实现边界、参数范围、验证方式与回滚路径。

## Capabilities

### New Capabilities
- `liquid-bubble-component`: 提供一个以液体本体为主体、内部带有持续冒泡粒子效果的 3D 动态组件，支持长方体与圆柱体两种形状。

### Modified Capabilities
- None.

## Impact

- Affected code:
  - `src/components/` 下新增 `liquidBubbleComponent` 目录及组件实现。
  - `src/shader/` 下新增 `liquidBubbleComponent` 专属顶点与片元 shader 文件。
  - `src/dcsConfig.ts` 新增组件注册、默认值与配置面板项。
- APIs:
  - 新增组件 props，覆盖形状尺寸、液体颜色、透明度、气泡数量、速度、尺寸和扩散强度等核心参数。
- Dependencies:
  - 复用现有 `three`、`@tresjs/core` 与 `three-custom-shader-material` 能力，不新增额外依赖。
- Systems:
  - 影响前端 three.js 组件预览与动态组件注册，不影响服务端与通用预览页结构。
- Rollback strategy:
  - 若出现性能或视觉稳定性问题，先从 `src/dcsConfig.ts` 下线组件入口，再回退 `src/components/liquidBubbleComponent/` 与 `src/shader/liquidBubbleComponent/` 中的新增文件。
