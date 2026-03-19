## 1. Component Skeleton and Parameter Model

- [x] 1.1 在 `src/components` 创建 `flowingSmokeComponent.vue` 骨架，并搭建基于 `THREE.Points` 的粒子几何与材质装配流程。（可验证：预览中能看到默认向上流动的烟雾形态）
- [x] 1.2 新增并接入 `flowRate`、`density`、`color`、`direction`、`spread`、`opacity`、`particleSize`、`lifeRange` 等 props 与默认值。（可验证：修改参数后烟雾流动、浓淡、颜色和扩散表现发生对应变化）
- [x] 1.3 为关键数值参数增加边界保护与兜底逻辑。（可验证：传入非法值或极端值时组件仍稳定渲染且无运行时报错）

## 2. Shader-Driven Smoke Motion and Dissipation

- [x] 2.1 在 `src/shader/flowingSmokeComponent/` 新增顶点、片元 shader 文件，并从组件中按外部文件方式引入。（可验证：组件不包含内联 shader 字符串，构建可正常解析 shader 文件）
- [x] 2.2 在顶点 shader 中实现沿发射方向推进、生命周期循环、尺寸增长和轻微扰动位移。（可验证：烟雾持续流动，且支持烟囱上升与尾气横向排放两类方向）
- [x] 2.3 在片元 shader 中实现软边缘、颜色着色和透明度衰减，形成逐渐消散的烟雾观感。（可验证：粒子边缘柔和，末端不会突然硬切消失）
- [x] 2.4 将 `density` 与可见粒子数量或等效视觉密度逻辑关联，保证高低密度差异明显且性能可控。（可验证：调整密度后烟雾疏密变化清晰）

## 3. Dynamic Component Service Integration

- [x] 3.1 在 `src/dcsConfig.ts` 注册流动烟雾组件，并补充可用的默认参数。（可验证：组件在服务组件列表中可见并能通过通用链路加载）
- [x] 3.2 在 `src/dcsConfig.ts` 配置调参面板，至少暴露流速、密度、颜色、方向和扩散相关控件。（可验证：配置面板可直接调节核心参数，无需修改通用预览文件）
- [x] 3.3 补充预览缩略图资源或预览配置所需元数据，保持与现有组件接入方式一致。（可验证：组件卡片展示完整且不会破坏现有预览布局）

## 4. Validation and Rollback Readiness

- [x] 4.1 运行 lint 并修复本次变更引入的问题。（可验证：相关 lint 命令执行成功）
- [x] 4.2 运行 build，确认组件与 shader 在打包流程中通过。（可验证：构建成功且无 shader / TypeScript 错误）
- [ ] 4.3 在可用环境下验证 `dev` 或 `serve` 模式中的烟囱排烟与汽车尾气两类典型参数组合。（可验证：两种参数预设都能稳定渲染）
- [x] 4.4 在实施记录中确认回滚顺序为“移除 `dcsConfig` 注册 -> 回退组件文件 -> 回退 shader 文件”。（可验证：回滚路径清晰且可直接执行）
