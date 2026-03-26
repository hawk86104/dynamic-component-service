## Context

当前仓库里的动态组件遵循两条关键约束：

- 组件预览接入、默认参数和调参 schema 优先通过 `src/dcsConfig.ts` 完成。
- `src/views/previewEntry.vue` 与 `src/views/templateComponet.vue` 属于通用预览基础设施，非必要不做组件专属逻辑。

`ezTreeCom` 现在已经具备基础预览能力，但配置链路还是单向的：

- `createConfigPane.ts` 里的 `jsonText` 控件负责编辑文本并触发“应用 JSON”。
- `ezTreeCom.vue` 只监听 `jsonTextChangeNumber`，解析文本后调用 `tree.generate()`。
- 组件没有 `defineExpose`，所以外部宿主或预览页都拿不到一个稳定的实例 API。

此外，仓库已经有 `superEnergyShieldComponent.vue` 通过 `defineExpose` 对外暴露方法的先例，这说明“动态组件发布后允许宿主通过 ref 调用公开方法”是可行且符合仓库现状的。

同时，`vite.config.ts` 会把 `src/dcsConfig.ts` 暴露为 federated 的 `./config` 模块。这意味着 `dcsConfig` 不只是本地预览数据源，它还是外部宿主可读取的组件 metadata 来源。新增能力时，不能把运行时 callback 之类的非声明式对象直接塞进 `dcsConfig`，否则会影响外部读取配置的稳定性和可理解性。

## Goals / Non-Goals

**Goals:**

- 为 `ezTreeCom` 提供稳定、可增量扩展的公开实例方法，覆盖“读配置 / 应用配置 / 随机生成配置”三类核心动作
- 在通用预览层内以基础设施方式支持动作按钮，让 `ezTreeCom` 可以声明一个“随机树木配置”按钮
- 保持 `jsonText`、运行时树配置和 `tree.generate()` 的结果同步
- 继续兼容现有 `isUpdate`、`jsonText`、`jsonTextChangeNumber` props 驱动方式
- 保证 federated 发布后的外部宿主仍能安全读取 `./config` 里的组件配置 metadata

**Non-Goals:**

- 本次不直接修改外部宿主调用代码
- 本次不为 `ezTreeCom` 增加独立的下载、导出文件或额外 DOM 面板
- 本次不把通用预览页改造成组件专属逻辑容器
- 本次不引入远程配置存储、服务端接口或新的状态管理方案

## Decisions

1. 决策：`ezTreeCom` 的对外运行时能力通过组件实例 `defineExpose` 提供，而不是通过 `dcsConfig` 内联函数提供。
- Rationale: federated 发布后的真实调用方通常拿到的是组件实例 ref；而 `dcsConfig` 作为 `./config` 暴露给外部时，应继续保持声明式 metadata，便于读取和兼容。
- Alternative considered: 在 `dcsConfig` 里直接挂函数式 handler。该方案会让对外暴露的 config 元数据混入运行时 callback，不利于外部读取和长期兼容。

2. 决策：预览按钮能力以“声明式 action metadata + 通用桥接”的方式落在 `createConfigPane.ts` 与 `templateComponet.vue`，而不是写死 `ezTreeCom` 特判。
- Rationale: “配置面板按钮触发组件公开方法”本质上是预览基础设施能力，不是 ez-tree 特有逻辑。把它做成声明式 action，可以复用到后续其他需要按钮动作的组件。
- Alternative considered: 直接在 `previewEntry.vue` 或 `ezTreeCom.vue` 里硬编码一个随机按钮。该方案会污染通用层，或把预览 UI 侵入组件内部。

3. 决策：`ezTreeCom` 内部所有配置更新路径都统一走一个共享的“解析 / 应用 / generate / 回传快照”助手函数。
- Rationale: 这样可以让 props 驱动、预览按钮驱动和外部公开方法驱动三条链路最终收敛到同一个行为，避免一条路径更新了 `tree.options`，另一条路径忘记同步 `jsonText` 或忘记重新生成。
- Alternative considered: 保留现有 watcher，同时额外堆叠随机按钮和公开方法。该方案容易出现多套逻辑分叉，后期难维护。

4. 决策：配置文本解析语法与编辑器保持一致，并保留上游 `TreeOptions` 语义，而不是继续直接替换 `tree.options` 为普通对象。
- Rationale: 当前编辑器使用 `JSON5` 校验，而组件实际使用 `JSON.parse`，存在明显不一致；另外上游 `ez-tree` 已提供 `loadFromJson` / `options.copy()` 语义，继续保留 `TreeOptions` 容器更稳妥。
- Alternative considered: 继续使用 `JSON.parse` 加 `tree.options = json`。该方案短期能跑，但会放大解析不一致与类型漂移问题。

5. 决策：保持现有 props 契约完全可用，新公开方法只作为增量能力加入。
- Rationale: 用户已经明确要求兼容“组件已调试好、发布后外部读取配置仍可用”的场景，因此不能要求现有消费者立即切换到 ref 方法调用。
- Alternative considered: 把 `jsonText` 完全改成组件内部状态或强制双向绑定。该方案会破坏现有发布链路。

## Risks / Trade-offs

- [Risk] 为动作按钮扩展通用预览基础设施，会波及所有组件的 pane 创建流程。
  - Mitigation: 只做声明式扩展，保持现有 `Select / ColorPicker / Switch / Slider / jsonText` 行为不变，并在 spec 中明确兼容要求。
- [Risk] `dcsConfig` 新增动作 metadata 后，外部宿主可能读取到此前没有的字段。
  - Mitigation: 保持字段为声明式字符串 / 对象 metadata，不混入 callback，并把“外部仍可读取 config”写入需求。
- [Risk] 非法配置文本可能让树生成失败或部分更新。
  - Mitigation: 统一校验并在 apply 失败时保持上一次有效配置，不把失败状态写回为“最新有效配置”。
- [Risk] 公开方法的最终命名可能需要和外部宿主调用代码再对齐。
  - Mitigation: 先在规范中固定语义能力和兼容要求，命名在实施时可按需要加别名，但不改变读 / 写 / 随机化三类能力边界。

## Migration Plan

- 第一步：在 OpenSpec 中明确动作按钮 metadata、实例公开方法语义和兼容边界。
- 第二步：扩展 `createConfigPane.ts` 与 `templateComponet.vue`，形成通用 action button 桥接能力。
- 第三步：重构 `ezTreeCom.vue` 的配置应用链路，统一 props、按钮和公开方法入口，并增加快照读回能力。
- 第四步：在 `src/dcsConfig.ts` 为 `ezTreeCom` 声明随机配置按钮与所需 metadata。
- 第五步：执行构建 / lint 验证，并根据需要补充 README 中关于新 schema 的说明。

## Open Questions

- None. 外部宿主代码的具体接入方式会在后续讨论，但本次变更已经固定了需要提供的语义能力和兼容目标。
