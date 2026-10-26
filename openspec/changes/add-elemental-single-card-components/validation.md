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

## Breeze / Bloom 逐帧修订

- 原片检查范围：Breeze 三个连续片段 165 帧，Bloom 三个连续片段 154 帧，包含激活、稳定和切换过程。分析依据、估计比例与资料位置见 `breeze-bloom-frame-study.md`，不是组件运行截图。
- 项目 TypeScript、四个入口与共享目录/检查脚本的定向 ESLint、四组件 CPU 回归、OpenSpec strict 和 diff 检查通过。
- Breeze 路径以独立胶囊距离函数核对四种宽高比、上下分支与内外路径采样，中心线均留在实体外；左右衔接连续，沿线 X 坐标从左向右推进。宽尾迹和细线共用静态路径，运动不旋转整场。
- Breeze 检查了风速零冻结 uniform 和 CPU 粒子位置、连续调速、非形状参数保留几何、曲带数量变化保留相位、共用几何单次释放、效果归零隐藏和重播复位。
- Bloom 检查了默认及极端尺寸下 6/7/9/24 瓣曲面的有限性、索引有效性、闭合曲面位于卡片背后、开放瓣根保留遮挡，以及真实纵深。默认几何宽为卡宽的 `2.594` 倍，Y 范围为 `[-0.540, 0.640] × 卡高`，与原片估计范围一致；这不是视觉相似度测量。
- Bloom 检查了高瓣/低瓣分层展开、展开完成后保持目标开度、零时长立即展开、重播重新展开；同时核对花瓣与柔光层的排序中心、开度编辑保留几何、独立速度与粒子相位连续、数量重建及共享几何单次释放。
- Shader 静态检查新增 uniform 存在/有限值、顶点自定义属性和维数匹配，保留 log-depth/裁剪/颜色空间路径。它无法替代 GPU 编译。
- 参数默认值、runtime props、服务面板逐字段匹配；新增参数文档已同步。Breeze / Bloom 默认展示旋转归零，方便正面对照，组件仍可在宿主三维场景自由变换。
- 本轮修改前记录的 35 个 Ember/Solar 专用及共享基础、通用预览文件 SHA-256 完全一致。`types.ts`、`defaults.ts`、`catalog.ts` 仅 Breeze/Bloom 区块变化；无新增项目依赖。
- 沿用用户“暂不运行，保留代码修改”及 AGENTS.md 的要求，未运行 build/dev/serve/preview、本地服务、浏览器调试或截图。实际 GPU Shader 编译、最终还原度、交叠观感和帧率均未验收。
