## 1. OpenSpec And Scope

- [x] 1.1 为箱式隔间容器建立独立变更目录并写明保留/删除的能力边界。（可验证结果：proposal/design/spec/tasks 文件齐全，且明确排除打印/export/页面逻辑）

## 2. Component Implementation

- [x] 2.1 新增主组件 `src/components/binsContainerComponent.vue`，渲染抽屉轮廓、布局后的隔间容器、尺寸标注与索引号。（可验证结果：默认参数下组件能显示抽屉和多个隔间）
- [x] 2.2 新增单箱体子组件，使用“底板 + 环形墙体”方案实现可调圆角、壁厚和开口结构。（可验证结果：调整 `radius`、`thickness` 后箱体结构稳定变化）
- [x] 2.3 新增工具文件，迁移 `Recursive` 与 `Grid` 生成算法，并在极端参数下提供边界收敛。（可验证结果：切换模式和参数后布局数量、尺寸、位置正确变化）

## 3. Dynamic Service Integration

- [x] 3.1 在 `src/dcsConfig.ts` 中注册组件默认值、配置项和默认 Object3D 位置。（可验证结果：组件出现在现有组件列表中并可通过 pane 调参）
- [x] 3.2 补一个预览占位图路径，避免组件列表卡片资源缺失。（可验证结果：组件卡片能加载到图片资源）

## 4. Validation

- [x] 4.1 运行 `npm run build` 并处理本次变更引入的错误。（可验证结果：构建成功）
- [ ] 4.2 验证 `showMeasurements` 和 `showIndexNumbers` 两个开关的显隐效果。（可验证结果：两类标签都能独立开关）
- [x] 4.3 实现完成后回写任务勾选状态。（可验证结果：已完成任务被标记为 `[x]`）
