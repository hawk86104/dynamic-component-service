## 1. 变更建模

- [x] 1.1 新建 OpenSpec 变更目录，明确四阶段演进模型、参数分组和排除项
- [x] 1.2 说明单 shader 驱动 + `progress` 连续函数的实现边界

## 2. 组件实现

- [x] 2.1 新增 `src/components/radiantSwirlSkillComponent.vue`，使用单平面 + `CustomShaderMaterial`
- [x] 2.2 在组件内实现 `autoAnimate` / `animationSpeed` / 外部 `progress` 的切换逻辑
- [x] 2.3 实现 `clampNumber` 与颜色容错，确保越界输入不黑屏

## 3. Shader 实现

- [x] 3.1 新增 `src/shader/radiantSwirlSkillComponent/panel.vert`
- [x] 3.2 新增 `src/shader/radiantSwirlSkillComponent/panel.frag`
- [x] 3.3 在 shader 内按 progress 叠加“螺旋光叶 + 能量环 + 核心光球 + 火花”四层，并保持色彩插值链 baseColor → glowColor → highlightColor → coreColor

## 4. 服务接入

- [x] 4.1 在 `src/dcsConfig.ts` 注册 `radiantSwirlSkillComponent`
- [x] 4.2 为组件补齐中文名、默认值、默认 Object3D 和配置面板 schema（动画节奏 / 颜色 / 形态）
- [x] 4.3 预览图先复用 `./preview/testBase.png` 占位，后续可补充独立预览资源

## 5. 验证

- [x] 5.1 检视组件代码与 shader 文件，确认动态完全来自 `panel.frag` 中对 `uTime` / `uProgress` 的计算，未引入 sprite 序列帧或贴图
- [x] 5.2 按项目规则跳过自动构建/调试运行；若需端到端构建与预览验证，请用户手动运行 `npm run build` 或 `npm run dev`
