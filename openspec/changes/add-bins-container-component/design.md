## Background

参考项目 `ak-tr/bins` 的核心由三部分组成：

- 抽屉尺寸参数
- 箱体参数
- 两种隔间生成算法（Recursive / Grid）

仓库现有预览系统则有一套不同的约束：

- 组件必须是单个 Vue + TresJS 组件
- 参数通过 `src/dcsConfig.ts` 的 `default` 和 `config` 管理
- 预览相机固定在较小世界坐标范围内，不能直接以毫米尺寸 1:1 渲染，否则会超出默认视野

因此实现上需要做一次“功能保留、场景收敛”的迁移，而不是完全照搬源项目结构。

## Goals

- 在当前仓库里提供一个能稳定预览的箱式隔间容器组件
- 保留参考项目的参数含义与两种布局方式
- 支持显示容器尺寸文字和每个隔间的索引编号
- 保持与统一组件配置格式兼容

## Non-Goals

- 不实现导出功能
- 不实现打印床判定逻辑
- 不实现页面级 ConfigPanel、上下文 Provider 或相机控制
- 不修改通用预览入口

## Key Decisions

### 1. 维持“参数单位是毫米”，但内部按场景比例缩放

参考项目所有输入参数都以毫米计，但当前仓库的默认预览相机位于 `[5, 5, 5]`，如果直接按毫米尺寸渲染，组件会远超视野范围。

决策：

- 对外参数继续保持毫米语义
- 在组件内部按固定比例 `0.01` 转换到场景单位

这样可以同时保留参考项目的参数直觉和当前预览链路的可用性。

### 2. 箱体不再依赖 CSG，而使用“底板 + 挤出墙体环”的几何方案

参考项目通过 CSG 从实体圆角盒中挖出内腔。当前仓库没有现成的 CSG 依赖，也不需要承担导出打印网格的职责。

决策：

- 每个隔间由两部分组成：
  - 外部圆角底板
  - 带孔的圆角环形挤出墙体

这能保留：

- 半径参数 `radius`
- 壁厚参数 `thickness`
- 开口容器的视觉结构

同时避免新增重量级依赖。

### 3. 只保留与组件本体强相关的设置

用户明确要求只保留：

- Box Settings
- Bin Settings
- Generation Settings
- Show measurements
- Show index numbers

决策：

- `Printer Settings`、`Export`、`Vase Mode` 不进入组件 schema
- 所有参数在 `dcsConfig.ts` 中以扁平字段暴露，但名称和语义对应原功能

### 4. 生成逻辑保持与参考项目一致

决策：

- `Grid` 模式保持按行列均分，并扣除 `innerGap`
- `Recursive` 模式保持首层四分、后续对子块递归，并在奇偶块间翻转 `divideWidth/divideDepth`

这样能最大程度保留原项目的布局行为。

### 5. 文本标注使用仓库现有 `bannerLabel`

仓库内已有基于 CanvasTexture 的 `bannerLabel` 组件，适合显示：

- 外部尺寸文本
- 容器索引号

决策：

- 不引入新的字体几何依赖
- 使用 sprite 标签完成 measurements 和 index numbers 功能

## Risks And Mitigations

- 风险：极端参数下箱体宽度或深度可能被间隙吃掉，导致无效几何
  - 缓解：对数值做边界收敛，并在生成后过滤不可渲染的 bin

- 风险：壁厚过大时内部孔洞可能失效
  - 缓解：在单箱体内部对壁厚进行二次钳制，保证 hole 不会出现负尺寸

- 风险：毫米转场景单位后，标签尺寸可能过大或过小
  - 缓解：标签单独使用与模型不同的视觉缩放参数

## Validation Plan

- 运行 `npm run build`
- 确认组件在默认参数下能进入预览
- 确认切换 `generationType` 后，`iterations` 或 `rows/cols` 的变化能影响布局
- 确认开关 `showMeasurements` 和 `showIndexNumbers` 后，标签显隐正常
