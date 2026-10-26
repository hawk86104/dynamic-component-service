# 验证记录

日期：2026-10-26。

## 已通过

- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit`：项目类型检查通过。
- 对四个 Vue 入口、`src/components/elementalCards/` 和 CPU 检查脚本运行定向 ESLint：通过。
- `node --experimental-vm-modules scripts/check-elemental-cards.mjs`：四种组件的 CPU 检查通过；未创建 WebGL 上下文。
  - 参数默认值、非法数值回退、数值范围、运行时 props 与参数面板字段一致。
  - 胶囊轮廓连续、带厚度和倒角；几何属性及索引为有限有效数据。
  - 多实例独立持有几何、材质和文字纹理；颜色/文字更新保留几何和纹理。
  - 尺寸变化释放替换资源；重复 dispose 不重复释放；宿主其他对象保持存在。
  - 时钟暂停、速度零、恢复与重置行为；透视和正交相机更新路径。
  - 自定义 Shader include 已展开，Three.js 的 log-depth、裁剪 chunks 可解析。
  - 异步字体完成回调不会在释放后重绘。
- 四张 SVG 封面的 XML 解析通过。
- `openspec validate add-elemental-single-card-components --strict`：通过。
- `git diff --check`：通过；通用预览视图、依赖与已有组件未修改。

## 已有 lint 问题

`src/dcsConfig.ts` 存在 208 条既有格式诊断。使用 ESLint API 分别检查 `git show HEAD:src/dcsConfig.ts` 和修改后文件，错误数量均为 208，诊断规则、文本和列号一致，新增行无诊断。本次对该文件仅新增一条导入和一条组件数组展开，未扩展格式清理范围。

## 未执行

遵守项目 AGENTS.md，未运行 build/dev/serve/preview、未启动本地服务、未进行浏览器调试或截图。尚未验证真实 GPU Shader 编译、最终视觉相似度、透明物体交叠表现、宿主地图 log-depth 实际效果或帧率。

目录封面为静态 SVG 示意图，不是运行截图。局部地面光晕不包含实时镜面反射。

## Ember 逐帧修订

- 检查原片三个连续片段共 165 帧，依据见 `frame-study.md`。
- 修改后 TypeScript、定向 ESLint 与四组件 CPU 检查通过。
- 新增 CPU 检查：火舌根部符合上半圆、双层纵深、浅体积火冠覆盖上缘、火焰速度零冻结而不复位、连续调速、重建火舌时保留相位、重播归零。
- 未改动 Solar、Breeze、Bloom 的入口、独立实现、Shader 和封面；共享工厂的新能力为可选项，三者仍使用默认路径。
- 用户明确选择“暂不运行，保留代码修改”。未运行预览、截图或浏览器调试；未确认高还原度和真实 GPU 性能。

## Solar 逐帧修订

- 连续检查三个原片片段共 180 帧，观察与实现依据见 `solar-frame-study.md`。
- TypeScript、变更文件定向 ESLint、四组件 CPU 检查、OpenSpec strict 与 diff 检查通过。
- 新增 CPU 检查：不同胶囊比例下交点精度、束根在轮廓上、方向从卡心径向向外、短中长束和实际纵深、日冕与柔光共享几何的单次释放、样式参数不重建几何、独立速度零冻结、连续调速、光束数量变化保留相位、重播归零。
- 24 个 Ember/Breeze/Bloom 专用文件 SHA-256 与本轮修改前一致。共享 `body.ts`、`runtime.ts`、`particles.ts` 源码不变；`types.ts`、`defaults.ts`、`catalog.ts` 除 Solar 区块外内容一致。
- 沿用用户暂不运行的选择及 AGENTS.md：未执行构建、预览、服务或浏览器调试/截图，实际 GPU 编译、视觉相似度及帧率仍未验收。
