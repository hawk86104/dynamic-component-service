## 背景

上游 `flow-shield-effect` 的护盾效果主要集中在 `src/components/ForceShield` 内部：一个球体 mesh、一套自定义 shader 材质、动画 uniform，以及一个用于渲染点击命中冲击波的小型命中缓冲。仓库其他部分大多是为了 demo 展示服务的，包括 React Three Fiber 包装、Leva 调参、Orbit 辅助、场景组合和可选后期处理。这意味着它非常适合做“核心能力直接迁移”，但迁移后必须符合当前仓库的实现约束：

- 使用 Vue 3 + TresJS，而不是 React Three Fiber
- 组件逻辑放在 `src/components/`
- shader 文件外置到 `src/shader/<component-name>/`
- 通过 `src/dcsConfig.ts` 完成注册和配置 schema
- 不在 `src/views/previewEntry.vue` 或 `src/views/templateComponet.vue` 里加入组件专属分支逻辑

另外，上游点击冲击波来自 mesh 上的 `onClick`，使用本地 raycast 命中点并调用 `stopPropagation()`。这种写法在独立 demo 中没问题，但如果后续要放到编辑器里做场景级点选、选中或拾取，它会有明显冲突风险。

## 目标 / 非目标

**目标：**
- 将护盾壳体效果本身迁移为一个可复用的 Vue 3 + TresJS 动态组件。
- 保留这个组件最有辨识度的视觉特征：球形护盾、六边形纹理、菲涅耳边缘、动态噪声破碎效果和命中冲击波。
- 将参数面收敛为护盾自身参数，避免配置面板变得臃肿。
- 让命中冲击波与内部 click 捕获解耦，兼容后续编辑器点选接管事件链。
- 通过 `src/dcsConfig.ts` 接入默认值和调参项，并把 shader 放到组件专属目录中。

**非目标：**
- 不迁移上游的 React Three Fiber 场景搭建、辅助器、Leva UI 或 demo 布局。
- 不迁移 transform 控制，也不把通用的 `position/rotation/scale` 作为组件自身配置契约的一部分。
- 不迁移 reveal/debug 或 gameplay 风格的状态控制，例如手动 reveal、护盾生命值、伤害值等，除非它们是护盾表面效果本身不可缺少的一部分。
- 不引入 bloom 或其他后期处理作为组件正确显示的前置条件。

## 关键决策

1. 决策：不新增 `radius` 参数，也不引入 `uRadius` uniform；保持上游“固定基准球体 + shader 材质”的思路，组件整体尺寸交给宿主场景或编辑器外部 Object3D 缩放处理。
- 理由：回查上游实现后可以确认，`ForceShield` 本身就是用固定球体和材质组合出来的：外层 `group` 通过 `scale` 控整体大小，内部 `sphereGeometry` 使用固定参数 `[1.8, 64, 64]`，[index.tsx](https://github.com/cortiz2894/flow-shield-effect/blob/main/src/components/ForceShield/index.tsx) 中也是这么接的；shader 顶点阶段直接把 `position` 写入 `vObjPos`，片元阶段又直接使用 `vObjPos.y / 1.8` 和默认命中点 `vec3(0, 1.8, 0)` 这类固定半径假设来做计算，[shaderMaterial.ts](https://raw.githubusercontent.com/cortiz2894/flow-shield-effect/main/src/components/ForceShield/shaderMaterial.ts) 里可以看到这一点。既然当前接入目标更接近“迁移材质表现”，就不应该平白扩展成一个额外的半径契约。
- 备选方案：新增 `radius` 参数并改造为 `uRadius` 驱动的自适配 shader。这个方案技术上可以做，但它已经超出“按原组件思路迁移”的边界，而且你明确说明后续尺寸会由你自己在外层调整，因此首版不应走这条路。

2. 决策：将护盾 shader 迁移为 `src/shader/superEnergyShieldComponent/` 下的外部顶点和片元文件。
- 理由：当前仓库已经要求 shader 代码按组件拆分存放。上游实现把 shader 写在 TypeScript 辅助文件里，迁移成 `.vert` 和 `.frag` 后更便于维护，也能与现有组件实现方式保持一致。
- 备选方案：继续把 shader 字符串内联在 Vue 组件里。技术上可行，但不符合仓库约定，也不利于后续调试和维护。

3. 决策：参数只保留护盾自身相关项。
- 保留参数：
  - 表面：`color`、`opacity`、`showHex`、`hexScale`、`hexOpacity`、`edgeWidth`
  - 菲涅耳：`fresnelPower`、`fresnelStrength`、`fadeStart`
  - 流动与闪烁：`flashSpeed`、`flashIntensity`、`flowScale`、`flowSpeed`、`flowIntensity`
  - 噪声边缘：`noiseScale`、`noiseEdgeColor`、`noiseEdgeWidth`、`noiseEdgeIntensity`、`noiseEdgeSmoothness`
  - 冲击波：`hitRingSpeed`、`hitRingWidth`、`hitMaxRadius`、`hitDuration`、`hitIntensity`、`hitImpactRadius`
- 不保留参数：
  - 组件级尺寸参数，例如 `radius`
  - transform 类控制
  - 外部场景、辅助器、后期处理开关
  - demo 专属的 reveal/debug 控制
  - gameplay 相关值，例如 shield life、damage
- 理由：上游 demo 暴露的参数很多，是为了实验和展示，不适合作为动态组件服务里的正式参数面。这里应该只保留真正改变护盾本体表现的配置。
- 备选方案：一比一迁移所有上游参数。这个方案会让配置面板过于嘈杂，也会把 demo 状态和可复用组件参数混在一起。

4. 决策：保留命中冲击波效果，但把“生成 impact”的逻辑抽成共享入口，而不是强绑定到永远开启的点击事件上。
- 理由：命中冲击波是护盾效果的重要组成部分，但上游 demo 的事件处理策略不适合作为长期集成契约。应通过 `registerImpact(localPoint, localNormal)` 一类统一入口来驱动固定大小的命中缓冲，这样既能支持可选的组件自点击预览模式，也能兼容未来编辑器自己的拾取逻辑。
- 集成规则：
  - 默认渲染不依赖组件内部 click 捕获
  - 可选自点击命中模式只在预览或 demo 场景下显式开启
  - 即便开启自点击命中，也不能把无条件 `stopPropagation()` 作为组件正常工作的前提
- 备选方案：彻底去掉命中冲击波。这样虽然能避开事件问题，但会丢掉上游组件最有辨识度的行为之一。

5. 决策：组件接入统一通过 `src/dcsConfig.ts` 完成，不改通用预览视图文件。
- 理由：当前仓库已经把组件默认值和配置面板集中在 `src/dcsConfig.ts` 中管理。超级能量盾也应该遵循同样路径。
- 备选方案：在通用 preview 视图里为该组件加入特判逻辑。这个方案会让公共预览层和组件能力发生耦合。

6. 决策：组件必须完全运行在 three.js canvas 渲染管线内，不依赖后期处理才能成立。
- 理由：上游效果本质上是 shader 驱动的，迁移后应当在不加 bloom 或 composer 的前提下也能保持有效表现，否则在动态组件服务中嵌入会变得不稳定。
- 备选方案：把后期处理视为组件契约的一部分。这样会增加集成复杂度，也违反你给出的迁移边界。

## 风险与权衡

- [风险] 透明护盾材质在某些场景中可能出现深度排序问题。
  - 缓解：保持适合护盾的透明材质设置，例如合理控制 depth write 和 render order。
- [风险] 上游 shader 使用了固定基准半径假设，如果后续有人改成“直接换几何体半径”而不是外部缩放，护盾表现可能失真。
  - 缓解：首版保持与上游一致的基准球体尺寸，不新增 `radius/uRadius` 契约；如果未来确实要支持几何体半径可配，再单独发起一次 shader 半径归一化改造。
- [风险] 如果直接照搬上游 `onClick`，会和未来编辑器选中逻辑冲突。
  - 缓解：将自点击命中模式设为可选，并把冲击波生成逻辑抽象为可复用入口。
- [风险] 暴露参数过多会让配置面板难以使用。
  - 缓解：首版只保留护盾自身参数，把 demo/debug/gameplay 项全部排除在外。

## 迁移计划

- 第一步：先把组件边界、参数契约和交互约束在 OpenSpec 中明确下来。
- 第二步：实现 Vue/Tres 组件和外置 shader 文件，保持与上游一致的基准球体尺寸假设，并确保外部缩放可以接管整体大小。
- 第三步：在 `src/dcsConfig.ts` 中完成组件注册、默认值和配置面板定义。
- 第四步：验证构建结果和预览表现，并单独验证“默认编辑器安全模式”和“可选自点击命中模式”。
- 回滚策略：先移除 `dcsConfig` 注册，再回退组件和 shader 文件，最后清理相关预览资源。

## 待确认问题

- 首版是否需要提供一个显式的外部触发 API 来驱动冲击波，还是先保留共享内部 helper + 可选自点击预览模式就足够？
不用。保留共享内部 helper就行，不做额外的适配。
- 是否需要在同一次实现里补齐组件预览图，还是先临时复用占位资源，等效果稳定后再截图补齐？
不用，我会自行补齐
