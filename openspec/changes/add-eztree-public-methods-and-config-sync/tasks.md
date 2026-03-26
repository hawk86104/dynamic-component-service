## 1. OpenSpec And Contract

- [x] 1.1 明确 `ezTreeCom` 新增的公开能力边界，至少覆盖“读取当前配置、应用配置、随机生成配置”，并写明这些能力为增量 API，不替代现有 props 契约。（可验证：proposal / design / spec 中明确保留 `jsonText`、`jsonTextChangeNumber`、`isUpdate` 的兼容要求）
- [x] 1.2 明确预览层动作按钮采用声明式 metadata，而不是在 `dcsConfig` 中内联运行时 callback。（可验证：spec 中写明外部读取 `./config` 仍然是声明式、可读的）

## 2. Preview Infrastructure

- [x] 2.1 扩展 `src/views/createConfigPane.ts`，支持通用动作按钮控件，并保持现有 `Select`、`ColorPicker`、`Switch`、`Slider`、`jsonText` 控件行为不变。（可验证：新增动作按钮后，其他组件现有 pane 控件仍可正常工作）
- [x] 2.2 更新 `src/views/templateComponet.vue`，让它能拿到当前组件实例 ref，桥接动作按钮到组件公开方法，并把返回的配置快照同步回 `attrsData`。（可验证：预览层可以泛化调用组件公开方法，且 `jsonText` 等返回值可实时回写到面板状态）

## 3. ezTree Runtime Config

- [x] 3.1 重构 `src/components/ezTreeCom.vue` 的配置应用逻辑，统一 props、公开方法和随机生成入口，保证每次成功更新配置后都重新执行树生成。（可验证：无论通过文本应用、公开方法应用还是随机动作触发，树模型都会按最新配置重建）
- [x] 3.2 保持配置解析语法与编辑器一致，并保留上游 `TreeOptions` / `loadFromJson` 语义，不再直接把 `tree.options` 替换成普通对象。（可验证：面板中校验通过的配置文本在组件里也能被成功应用，且后续重复更新不因 options 类型漂移失效）
- [x] 3.3 通过 `defineExpose` 暴露可稳定读取最新配置快照的实例方法，并在随机生成或公开 apply 后更新最新快照文本。（可验证：组件 ref 在更新后能读到最新配置，而不是初始默认值）

## 4. Service Registration And Documentation

- [x] 4.1 在 `src/dcsConfig.ts` 为 `ezTreeCom` 注册随机配置按钮及所需 action metadata，保持接入方式声明式且不修改 `src/views/previewEntry.vue`。（可验证：ezTree 预览页出现随机配置按钮，且接入只通过 `dcsConfig.ts` 和通用桥接完成）
- [x] 4.2 如实现中引入新的 pane schema 字段或控件类型，补充 README 或相关文档说明其用途与约束。（可验证：仓库文档或变更文档中能查到新的 schema 用法）

## 5. Validation

- [x] 5.1 运行 `npm run build`，并视情况执行变更相关 lint / spot check，确认没有因本次改动引入新的构建错误。（可验证：验证结果被记录，且能区分本次改动问题与仓库既有问题）
