## 为什么要做

当前仓库已经有通用的 `liquidContainerComponent`，但它更偏向“容器液体展示”。这次用户要的是一个更聚焦“液体里连续冒出细密气泡”的专用组件，视觉重心接近 [champagne-fizz.html](https://github.com/pbakaus/radiant/blob/main/static/champagne-fizz.html)：底部起泡点、非均匀气泡尺寸、上浮过程中的横向轻摆，以及靠近液面时的消隐。

参考实现是 canvas + JavaScript 逐帧更新。为了更适合当前仓库的 TresJS / three.js 组件体系，也为了让动画逻辑更稳定地复用到动态组件服务里，本次需要先把这套视觉规律转换成 shader 主导的实现思路，再以新组件的形式接入仓库。

## 本次变更

- 新增 `liquidBubbleComponent` 动态组件，用长方体或圆柱体容器承载液体与气泡效果。
- 将参考页面中的气泡生成和运动逻辑转换为“静态粒子属性 + shader 按时间求解位置/尺寸/透明度”的实现方式，避免保留 canvas 风格的逐粒子绘制流程。
- 保留参考效果里最有辨识度的部分：底部起泡带、尺寸分布差异、上浮轻摆、靠近液面消隐、液面细波纹。
- 明确删除演示性质逻辑：点击/触摸交互、按住鼠标持续喷发、气泡炸裂 sparkles、`postMessage` 参数注入、整页 vignette 背景。
- 简化为服务化友好的参数集合，只暴露容器形状、尺寸、液位、颜色、气泡密度/尺寸/上浮速度/摆动强度等核心控制项。
- 通过 `src/dcsConfig.ts` 完成默认值和调参面板接入，不修改通用预览入口页。

## 能力变化

### 新增能力

- `liquid-bubble-component`：提供一个偏“香槟气泡柱”风格的液体气泡三维组件，用于展示发酵、反应液、香槟、气泡柱等场景。

### 修改能力

- 无。

## 影响范围

- 受影响代码：
  - `src/components/`：新增 `liquidBubbleComponent/` 组件目录与辅助逻辑。
  - `src/shader/`：新增 `liquidBubbleComponent/` 顶点与片元 shader 文件。
  - `src/dcsConfig.ts`：新增组件注册、默认参数和调参 schema。
  - `public/preview/`：如需要补预览图，则增加对应资源。
- API 影响：
  - 新增一组围绕液体气泡展示的 props，不复用 `liquidContainerComponent` 那套更通用、更复杂的参数集合。
- 依赖影响：
  - 复用现有 `vue`、`three`、`@tresjs/core`、`three-custom-shader-material` 能力，不新增渲染框架依赖。
- 系统影响：
  - 仅影响前端动态组件渲染层与组件注册表，不涉及后端或通用预览基础设施改动。
- 回滚策略：
  - 先从 `src/dcsConfig.ts` 移除组件注册。
  - 再回退 `src/components/liquidBubbleComponent/` 与 `src/shader/liquidBubbleComponent/` 新增文件。
  - 最后移除新增的预览资源或文档内容。
