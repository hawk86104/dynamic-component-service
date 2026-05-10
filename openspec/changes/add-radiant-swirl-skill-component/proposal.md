## 为什么要做

当前仓库还没有一个“技能蓄力炫光”类的动态组件。用户提供的参考图是一个 4 帧演进的绿色能量技能前摇效果，参考图包含从“碎裂光叶散射 → 汇聚成新月弧 → 收束成螺旋环 → 凝聚出完整能量环加核心光球”的渐进过程。现有组件都不覆盖这种“整段旋向中心并在末帧出现完整环 + 核心光”的 VFX 语言。

用户的明确要求：

- 忽略参考图左上角文字说明
- 四帧效果必须真正由 shader 驱动，而不是帧动画拼贴
- 代码组织要清晰简单
- 对外暴露“动画速度、动画颜色”等可调参数

## 本次变更

- 新增 `radiantSwirlSkillComponent`
  - 使用单个平面 + 外置片元/顶点 shader，按 `progress ∈ [0, 1]` 从“散射光叶”平滑演进到“完整能量环 + 核心光球”
  - 粒子轨迹、螺旋半径、能量环清晰度、核心光球强度都由 shader 根据 progress 动态推导
  - 支持自动循环（`autoAnimate`）和外部驱动（手动 `progress`）双模式
- shader 拆分成 `panel.vert` 和 `panel.frag`，放在 `src/shader/radiantSwirlSkillComponent/`
- 通过 `src/dcsConfig.ts` 暴露默认值与调参面板
  - 动画节奏：`animationSpeed`、`autoAnimate`、`progress`
  - 颜色：`baseColor`、`glowColor`、`coreColor`、`highlightColor`
  - 形态：`radius`、`bladeCount`、`swirlIntensity`、`noiseScale`、`coreIntensity`、`sparkleIntensity`、`opacity`
- 参考图左上角的文字“攻击敌人”不参与复刻

## 明确排除

- 不引入后期处理
- 不引入纹理贴图，完全使用程序化 shader 生成能量叶片与核心光球
- 不修改 `src/views/previewEntry.vue` 与 `src/views/templateComponet.vue`
- 不在组件内部创建独立相机，始终由外部场景相机观察
- 不复刻参考图左上角文字

## 能力变化

### 新增能力

- `radiant-swirl-skill-component`：为动态组件服务提供一个四阶段汇聚式技能炫光特效组件

### 修改能力

- 无

## 影响范围

- `src/components/radiantSwirlSkillComponent.vue`：新增单文件组件
- `src/shader/radiantSwirlSkillComponent/`：新增 shader 文件
- `src/dcsConfig.ts`：新增组件注册、默认值和调参面板 schema
- `openspec/changes/add-radiant-swirl-skill-component/`：新增变更目录

## 回滚策略

1. 从 `src/dcsConfig.ts` 移除 `radiantSwirlSkillComponent` 注册段
2. 删除 `src/components/radiantSwirlSkillComponent.vue`
3. 删除 `src/shader/radiantSwirlSkillComponent/` 目录
4. 删除本次 OpenSpec 变更目录
