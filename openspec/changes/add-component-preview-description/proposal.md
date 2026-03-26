## Why

当前服务只有全局 `description`，适合描述整个组件库，但不适合承载某一个组件自己的补充说明、来源链接或使用提示。进入单个预览页后，用户只能看到场景本身和右侧调参面板，缺少“这个组件是什么、有什么新增点、相关链接在哪里”的即时上下文。

这次还存在一个明确的内容归属问题：现在全局描述中的 `ez-tree` 新增说明，实际上只属于“高级树组件”，更适合跟随该组件出现在它自己的预览页中，而不是长期停留在全局简介里。

## What Changes

- 为 `src/dcsConfig.ts` 中的单个组件注册项增加可选的富文本 `description` 字段，用于承载组件自己的说明内容。
- 在单组件演示页增加一个统一的左下角说明卡片，支持展示当前组件的富文本描述与外链。
- 将 `ezTreeCom` 的说明从全局 `description` 迁移到该组件自身的 `description` 字段。
- 保持无描述组件的预览行为不变，不显示空白占位卡片。

## Capabilities

### New Capabilities

- `component-preview-description`: 组件注册表支持单个组件的富文本描述，并在单组件预览页统一展示。

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `src/dcsConfig.ts`
  - `src/views/previewEntry.vue`
  - `src/views/templateComponet.vue`
- APIs:
  - 组件注册项新增可选字段 `description?: string`
- Dependencies:
  - 无新增依赖，继续复用现有 Vue / tresjs / tweakpane 能力
- Systems:
  - 影响组件注册元数据与单组件预览层，不影响组件实现本身
- Rollback strategy:
  - 移除组件级 `description` 字段与预览说明卡片，并将需要的文案恢复到全局 `description`
