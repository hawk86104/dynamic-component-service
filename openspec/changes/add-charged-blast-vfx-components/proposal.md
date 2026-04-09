## 为什么要做

当前仓库里还没有一个可以直接复用的“蓄力光球 + 释放圆环 + 发射炮弹”特效组合。参考项目 `charged-blast-vfx` 已经验证了这一类效果的视觉结构，但原实现和当前仓库的接入方式并不一致：

- 原项目使用 React Three Fiber、Leva、人物模型、场景和后期包装
- 当前仓库要求使用 Vue 3 + TresJS 单组件接入
- 当前仓库通过 `src/dcsConfig.ts` 统一暴露默认值和调参配置

本次变更要把核心特效拆成可复用的三个动态组件，只保留用户明确要求的特效主体，去除人物、后期、场景包装和不需要的 ready 阶段效果。

## 本次变更

- 新增 `chargeOrbGatherComponent`
  - 只保留蓄力阶段的变大光球与持续向中心汇聚的粒子
  - 不保留人物闪烁、角色挂点偏移、ready sphere、上升环和人物周围飘散粒子
- 新增 `chargedBlastRingsComponent`
  - 重点复刻松开空格后的两道扩散圆环光
  - 保留原始圆环参数，并新增发射方向与发射速度
- 新增 `chargedBlastProjectileComponent`
  - 重点复刻松开空格后的炮弹主体与尾迹
  - 保留原始炮弹与尾迹参数，并新增发射方向与发射速度
- 新增 `chargedBlastReleaseComponent`
  - 将释放圆环与炮弹按参考项目的协同关系组合在一起
  - 统一释放阶段的公共参数，提供更精简的调参入口
- 通过 `src/dcsConfig.ts` 注册三个组件的默认值与配置面板
- shader 源码拆到 `src/shader/<component-name>/` 目录，不改动通用预览入口

## 明确排除

- 后期效果
- 人物模型、人物动作和人物闪烁
- ready sphere 爆闪
- 蓄满力后的上升光圈
- 人物周围向上漂浮的 ready 粒子
- 原项目的键盘输入、状态仓库和场景包装
- 原项目的普通射击模式与枪口闪光

## 能力变化

### 新增能力

- `charged-blast-vfx-components`：为当前动态组件服务提供三个可独立复用的充能爆裂特效组件

### 修改能力

- 无

## 影响范围

- `src/components/`：新增三个 Vue/Tres 组件
- `src/shader/`：新增三个组件对应的 shader 文件
- `src/dcsConfig.ts`：新增组件注册、默认值和配置 schema
- `openspec/changes/`：记录本次拆分方案与实现任务

## 回滚策略

1. 从 `src/dcsConfig.ts` 移除三个组件注册
2. 回退 `src/components/` 和 `src/shader/` 中新增文件
3. 回退本次 OpenSpec 变更目录
