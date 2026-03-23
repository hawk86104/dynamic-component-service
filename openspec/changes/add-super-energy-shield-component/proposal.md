## 为什么要做

当前组件服务里还没有一个可直接放入场景、可预览、可发布的球形能量盾组件。参考的开源项目 `flow-shield-effect` 已经说明了这个效果的核心其实是自包含的：一个球体 mesh、一套自定义 shield shader，以及一个基于射线命中点触发的可选冲击波效果。要把这个能力接入当前仓库，需要把它从 React Three Fiber 迁移到 Vue 3 + TresJS，并且把范围严格收敛到“组件本体”。

## 本次变更

- 新增一个 `superEnergyShieldComponent` 动态组件，只迁移 `src/components/ForceShield` 的盾体本体效果到当前仓库的 Vue 3 + TresJS 技术栈。
- 明确迁移边界，只保留以下内容：
  - 球形护盾外壳
  - 流动六边形纹理
  - 菲涅耳边缘
  - 噪声破碎边缘
  - 可选的命中冲击波逻辑
- 明确不迁移以下内容：
  - transform 控件
  - 外部场景搭建
  - 相机和 demo 辅助逻辑
  - Leva 调参面板
  - reveal/debug 一类演示控制
  - 任何后期处理链路
- 通过 `src/dcsConfig.ts` 仅暴露护盾自身参数，包括表面外观、菲涅耳、噪声、流动和冲击波相关配置；组件尺寸不新增独立参数，后续由宿主场景或编辑器外部缩放处理。
- 为后续编辑器点选兼容性预留空间：命中冲击波的设计不能依赖组件内部强绑定的 click 捕获逻辑，可选自点击命中行为必须能关闭。
- shader 源码放到 `src/shader/superEnergyShieldComponent/` 下，并通过 `src/dcsConfig.ts` 接入，不修改通用预览入口视图，除非后面发现真实的基础设施问题。

## 能力变化

### 新增能力
- `super-energy-shield-component`：在当前基于 TresJS 的动态组件服务中提供一个可配置的球形能量盾效果组件。

### 修改能力
- 无。

## 影响范围

- 影响代码：
  - `src/components/`：新增 Vue/Tres 组件实现
  - `src/shader/`：新增组件专属 shader 文件
  - `src/dcsConfig.ts`：新增组件注册、默认参数和配置面板 schema
  - `public/preview/`：如果补充独立预览图，会增加对应资源
- API 影响：
  - 新增一组用于控制护盾外观、运动和冲击波的组件 props，不新增组件级尺寸参数
- 依赖影响：
  - 复用现有 `vue`、`three`、`@tresjs/core` 以及仓库现有 shader 加载能力，不新增渲染框架或后期处理依赖
- 系统影响：
  - 只影响前端三维渲染层和组件注册表，不涉及后端改动
- 回滚策略：
  - 先从 `src/dcsConfig.ts` 移除组件注册
  - 再回退组件和 shader 文件
  - 最后回退新增的预览资源或元数据
