## Context

当前组件库首页已经支持通过 `dcsConfig.description` 展示全局富文本介绍，但单组件预览页缺少用于承载“当前组件补充说明”的通用展示层。组件说明属于组件注册元数据，而不是组件内部渲染逻辑，因此最合适的接入点仍然是 `src/dcsConfig.ts` 和通用预览页。

本次需求强调“简洁美观”，而且描述通常不会很长，所以展示形式更适合做成一个小号、固定位置的说明浮层，而不是引入新的侧边栏或详情页结构。

## Goals / Non-Goals

**Goals:**

- 让组件注册项可以声明自己的富文本 `description`
- 让单组件预览页在左下角展示当前组件描述
- 无描述组件保持当前预览体验，不出现空白占位
- 将 `ez-tree` 说明归位到“高级树组件”自身

**Non-Goals:**

- 不引入独立的描述数据源、接口或后台配置
- 不扩展组件列表页去展示组件描述摘要
- 不做复杂的富文本编辑器或运行时 sanitization 方案

## Decisions

1. 决策：组件级说明直接挂到 `src/dcsConfig.ts` 的组件注册项上，字段名沿用 `description`，格式继续使用 HTML 富文本字符串。
- Rationale: 仓库已经有全局 `description` 的先例，沿用同一数据形态最省改动，也天然支持链接。
- Alternative considered: 为组件说明单独建 markdown/JSON 文件。该方案对当前需求来说偏重。

2. 决策：单组件描述统一在 `src/views/previewEntry.vue` 中渲染，而不是让每个组件自己维护说明 UI。
- Rationale: 这是预览基础设施能力，放在入口页可以保持组件实现纯净。
- Alternative considered: 在每个组件内部自行渲染说明。该方案会污染组件逻辑，也难以保持样式一致。

3. 决策：说明浮层仅在当前组件存在 `description` 时显示，不回退到全局描述。
- Rationale: 全局描述与组件描述语义不同，回退显示会让单组件页面重新混入无关信息。
- Alternative considered: 缺失时回退到全局说明。实现更简单，但不符合“说明归组件”的目标。

4. 决策：继续复用 tweakpane 默认的右上角 wrapper，不额外维护自定义 `#pane` 容器。
- Rationale: 组件说明只需要新增一个轻量浮层，调参面板保持 tweakpane 默认行为即可，代码更少、侵入更小。
- Alternative considered: 增加显式 `#pane` 容器并在挂载后手动初始化。该方案更重，不适合这次小改动。

## Risks / Trade-offs

- [Risk] 组件描述通过 `v-html` 渲染，若未来改为外部来源，存在内容安全风险
  - Mitigation: 当前描述仍只来自仓库内的 `dcsConfig.ts`，继续按受信任配置处理
- [Risk] 左下角说明块可能遮挡部分场景
  - Mitigation: 控制说明块宽高与字号，保持为紧凑样式，并允许滚动
- [Risk] 预览基础页改动可能影响现有调参体验
  - Mitigation: 保持组件渲染链路不变，复用 tweakpane 默认面板行为，并通过构建验证回归

## Migration Plan

- 第一步：在组件注册项中引入可选 `description` 字段，并为 `ezTreeCom` 填入现有说明内容
- 第二步：从全局 `description` 中移出仅属于 `ezTreeCom` 的文案
- 第三步：在单组件预览页增加统一说明浮层，并确保无描述时自动隐藏
- 第四步：执行构建验证，确认预览页与现有组件注册链路保持可用

## Open Questions

- None.
