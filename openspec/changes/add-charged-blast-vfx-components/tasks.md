## 1. 变更建模

- [x] 1.1 新建 OpenSpec 变更目录，并记录三组件拆分边界、保留范围和非目标。
- [x] 1.2 明确每个组件的运行模式与新增参数，尤其是 `chargeProgress`、`autoPlay`、`fireDirection` 和 `fireSpeed`。

## 2. 组件实现

- [x] 2.1 新增 `chargeOrbGatherComponent.vue`，实现蓄力光球三层材质与内吸粒子效果。
- [x] 2.2 新增 `chargedBlastRingsComponent.vue`，实现两道扩散圆环光的生成、扩散与沿方向前进逻辑。
- [x] 2.3 新增 `chargedBlastProjectileComponent.vue`，实现炮弹主体、尾迹和按方向前进逻辑。
- [x] 2.4 为三个组件补齐外置 shader 文件，并确保不把 shader 内联在组件里。
- [x] 2.5 新增 `chargedBlastReleaseComponent.vue`，以统一参数和共享触发 token 组合释放圆环与炮弹。

## 3. 服务接入

- [x] 3.1 在 `src/dcsConfig.ts` 中注册三个组件。
- [x] 3.2 为三个组件补齐默认值、中文名称、默认 Object3D 和配置面板 schema。
- [x] 3.3 为组合释放组件增加精简版参数面板，统一方向、速度、颜色与能量参数。
- [x] 3.4 为 `chargedBlastProjectileComponent` 和 `chargedBlastReleaseComponent` 增加配置面板动作按钮，支持手动触发一次发射。

## 4. 验证

- [ ] 4.1 运行构建验证新增组件能通过类型检查和打包。
  当前被仓库已有问题阻塞：`src/components/waterDropGlassMaterialComponent/index.vue` 无法解析 `@pmndrs/vanilla`，导致 `vue-tsc` 与 `vite build` 都在进入本次组件验证前失败。
- [x] 4.2 记录仍未补齐的非阻塞项，例如预览资源占位情况。
  当前三个新组件先复用 `./preview/testBase.png` 作为占位预览图，后续可补充独立预览资源。
