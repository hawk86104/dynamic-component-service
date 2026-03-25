## 1. Component Structure and Shape Foundation

- [x] 1.1 在 `src/components/liquidContainerComponent/` 创建组件骨架与拆分模块，提供 `index.vue` 作为入口，并整理公共类型、常量和辅助函数。（可验证：`src/dcsConfig.ts` 可指向目录内入口文件且工程可解析模块）
- [x] 1.2 建立矩形容器、圆柱容器和壶形预设容器的形状参数与边界保护逻辑。（可验证：传入不同形状类型和规格参数时可生成对应几何且非法值不会导致渲染报错）
- [x] 1.3 为壶形预设整理统一轮廓数据与按高度采样截面半径的辅助能力，供外壳、液体和液面共用。（可验证：壶形模式下外壳与内部液体截面保持匹配）

## 2. Shell and Liquid Rendering

- [x] 2.1 实现容器外壳 mesh 与材质表现，支持矩形、圆柱和壶形预设的可视外壳。（可验证：三种形状都能显示容器壳体）
- [x] 2.2 实现液体主体 shader 或等价材质逻辑，支持 `fillLevel`、颜色渐变、密度成色和透明表现。（可验证：调整液位、颜色和密度参数后液体主体观感实时变化）
- [x] 2.3 实现基于组件局部坐标的 `clipX` 与 `clipZ` 外壳裁切逻辑，用于调节外壳可视化范围。（可验证：降低两个参数时外壳沿本地 `X` / `Z` 方向逐步被裁切）

## 3. Liquid Surface and Bubble Motion

- [x] 3.1 实现独立液面层，并为矩形、圆柱和壶形容器映射正确的顶部液面几何。（可验证：三种形状下都能看到贴合容器截面的液面）
- [x] 3.2 接入液面波动参数 `waveSpeed`、`waveAmplitude`、`waveFrequency` 并驱动持续动画。（可验证：修改波动参数后液面运动速度、强度和频率明显变化）
- [x] 3.3 实现可选气泡系统，支持气泡开关、数量、大小范围、随机性和上浮速度。（可验证：开启后液体内部出现非静态气泡，关闭后气泡完全消失）

## 4. Service Integration and Validation

- [x] 4.1 将组件 shader 文件拆分放入 `src/shader/liquidContainerComponent/`，并按顶点/片元文件组织。（可验证：组件从独立 shader 文件导入且构建成功）
- [x] 4.2 通过 `src/dcsConfig.ts` 注册组件入口、默认参数、默认 Object3D 和调参面板，不修改 `src/views/previewEntry.vue` 与 `src/views/templateComponet.vue`。（可验证：组件可通过现有通用预览链路加载并完整调参）
- [x] 4.3 运行 `build` 与变更相关 lint 验证，确认没有因新增组件引入构建错误。（可验证：相关命令执行成功或仅暴露仓库既有无关问题）
- [x] 4.4 记录并核对回滚顺序：先下线 `src/dcsConfig.ts` 注册，再回退组件目录与 shader 目录。（可验证：变更文档可直接指导回滚）
