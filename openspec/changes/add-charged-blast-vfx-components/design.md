## 背景

参考项目 `charged-blast-vfx` 把整套效果拆成了 `ChargeOrb`、`ChargeReadySphere`、`ChargeParticles`、`ChargeRing`、`ProjectileManager` 五块。但用户给出的保留范围更窄：

- 蓄力阶段只保留“变大的光球 + 向中心汇聚的粒子”
- 释放阶段重点保留“两道扩散圆环光 + 发射出去的炮弹”
- 其余角色、场景、后期和 ready 状态包装全部排除

这意味着不能直接照搬原项目的组合结构，而要重新按当前仓库的组件复用方式拆边界。

## 目标

- 在当前 Vue 3 + TresJS 仓库中落成 3 个可独立注册的特效组件
- 组件默认即可在预览环境中看到动态效果
- 同时保留外部驱动入口，方便后续在业务中对接

## 非目标

- 不复刻原项目的人物、键盘逻辑、状态仓库或音效
- 不引入后期处理作为组件正确显示的前置条件
- 不修改 `src/views/previewEntry.vue` 与 `src/views/templateComponet.vue`

## 组件拆分

### 1. chargeOrbGatherComponent

该组件负责蓄力核心体，只包含：

- 三层球体材质：外层 glow、中层 fresnel、本体噪声流动
- 向中心吸附的实例粒子

不包含：

- 人物挂点偏移
- ready 爆闪球
- 上升圆环
- 角色周围向上漂浮粒子

### 2. chargedBlastRingsComponent

该组件独立承担释放时的两道扩散圆环光。为了保留原效果“随炮弹方向前进并在弹体局部坐标内回扫”的感觉，组件需要同时管理：

- 整体沿发射方向前进
- 局部圆环从头部向尾部生成和扩散

新增运行参数：

- `fireDirectionX/Y/Z`
- `fireSpeed`

同时保留原圆环参数，如 `ringMaxRadius`、`ringInterval`、`ringLifetime` 等。

### 3. chargedBlastProjectileComponent

该组件承担炮弹主体与尾迹，复刻原项目的：

- 三段色带滚动
- Fresnel 边缘增强
- 尾迹的透明衰减与边缘柔化
- 本体脉冲缩放

新增运行参数：

- `fireDirectionX/Y/Z`
- `fireSpeed`

同时保留原炮弹与尾迹参数。

### 4. chargedBlastReleaseComponent

该组件是一个面向实际使用的组合层，内部组合：

- `chargedBlastRingsComponent`
- `chargedBlastProjectileComponent`

设计目标不是替代两个基础组件，而是提供一个“释放阶段开箱即用版本”：

- 两部分共享同一个触发 token，保证圆环与炮弹严格同步
- 统一公共运动参数，如方向、速度、距离、循环间隔
- 将颜色和能量参数压缩成一组更短的组合参数，避免释放阶段面板过长
- 对 `chargedBlastProjectileComponent` 和 `chargedBlastReleaseComponent` 暴露手动触发动作，方便配置面板提供“发射一次”按钮

## 运行模式设计

为了同时兼顾组件服务预览和后续业务接入，释放类组件采用双模式：

- `autoPlay = true` 时，组件内部自动循环发射，方便预览
- `autoPlay = false` 时，外部通过 `shotToken` 或 `burstToken` 变化触发一次新发射

蓄力组件采用：

- `autoAnimate = true` 时内部自动循环 charge progress
- `autoAnimate = false` 时使用外部传入的 `chargeProgress`

## 着色器布局

- `src/shader/chargeOrbGatherComponent/`
  - `base.vert`
  - `glow.frag`
  - `fresnel.frag`
  - `noise.frag`
- `src/shader/chargedBlastRingsComponent/`
  - `ring.vert`
  - `ring.frag`
- `src/shader/chargedBlastProjectileComponent/`
  - `projectile.vert`
  - `projectile.frag`
  - `trail.vert`
  - `trail.frag`

## 关键权衡

### 自动循环预览 vs 纯业务驱动

如果只做业务驱动，组件服务预览几乎无法直观看到效果；如果只做自动循环，又会降低业务可接入性。双模式可以同时满足两边需求。

### 圆环组件是否保留“随发射前进”

如果把圆环做成纯原地爆开，会更容易复用，但和原效果差异明显。用户要求重点复刻释放阶段，因此这里保留前进逻辑，并为其补充方向与速度参数。

### 是否引入原项目的枪口闪光

用户明确要求重点保留的是“两道扩散圆环光 + 炮弹”，没有要求枪口贴片闪光，因此首版不包含 muzzle flash。

## 回滚

1. 删除 `src/dcsConfig.ts` 中 3 个新组件注册
2. 删除新增组件与 shader 文件
3. 删除本次 OpenSpec 变更目录
