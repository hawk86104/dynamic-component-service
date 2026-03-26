## Why

当前 `ezTreeCom` 只支持通过 `jsonText` 手动编辑并点击“应用 JSON”来更新树木配置，缺少一个可以直接触发“随机生成树木配置”的入口，也没有把运行时最新配置稳定地反向同步回 `jsonText`。这会导致预览调试链路和组件发布后的外部使用链路出现能力差异：预览里只能靠手工拷贝 JSON，发布后外部宿主也拿不到一个稳定的“读配置 / 应用配置 / 随机生成配置”实例 API。

同时，当前组件内部的配置应用链路还有两个隐患：

- 预览编辑器用 `JSON5` 校验文本，但 `ezTreeCom` 用 `JSON.parse` 真正应用，存在“面板提示通过，组件实际失败”的不一致。
- 组件当前直接把 `tree.options` 替换成普通对象，绕过了上游 `ez-tree` 的 `TreeOptions` / `loadFromJson` 语义，不利于后续扩展公开方法和保持长期兼容。

这次变更需要把 `ezTreeCom` 的运行时配置能力补齐，并保证它仍然适配当前动态组件服务的预览、发布和外部读取配置场景。

## What Changes

- 为 `ezTreeCom` 增加“读取当前配置 / 应用配置 / 随机生成配置”的对外公开实例方法，并保证这些方法是增量能力，不破坏现有 props 用法。
- 为预览层增加可声明式接入的动作按钮能力，让 `src/dcsConfig.ts` 可以为 `ezTreeCom` 声明“随机树木配置”按钮，而不是把组件专属逻辑硬编码进通用预览页。
- 打通 `jsonText`、运行时树配置和 `tree.generate()` 之间的同步链路：随机生成或公开方法更新配置时，要反写最新 `jsonText`；手工应用文本配置时，要实时生成新树。
- 统一编辑器和组件内部的配置解析 / 应用行为，避免当前 `JSON5` 与 `JSON.parse` 分裂，以及直接替换 `tree.options` 带来的兼容风险。

## Capabilities

### New Capabilities

- `component-config-actions`: 动态组件预览配置面板支持声明式动作按钮，并可桥接到当前组件实例的公开方法。

### Modified Capabilities

- `eztree-runtime-config`: `ezTreeCom` 支持稳定的运行时配置读取、应用和随机化能力，并保持文本配置同步。

## Impact

- Affected code:
  - `src/components/ezTreeCom.vue`
  - `src/views/createConfigPane.ts`
  - `src/views/templateComponet.vue`
  - `src/dcsConfig.ts`
  - `README.md`（如果需要补充新的配置面板 schema 说明）
- APIs:
  - `ezTreeCom` 新增公开实例方法，用于读配置、应用配置和随机生成配置
  - `dcsConfig` / 预览层新增声明式动作按钮 metadata
- Dependencies:
  - 无新增第三方依赖，继续复用现有 Vue、tresjs、tweakpane、JSON5 和 `@dgreenheck/ez-tree`
- Systems:
  - 影响组件预览配置面板、组件实例公开 API，以及 federated 发布后的组件 ref 使用方式
  - 不修改外部宿主代码；外部调用方式会在后续单独对齐
- Rollback strategy:
  - 先移除 `src/dcsConfig.ts` 中的 ez-tree 动作按钮和相关 metadata
  - 再回退 `src/views/createConfigPane.ts` / `src/views/templateComponet.vue` 的动作桥接能力
  - 最后回退 `src/components/ezTreeCom.vue` 的公开方法与配置同步重构，恢复现有 `jsonText` 单向应用链路
