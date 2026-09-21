## Why
新增可重复拼接的机械科技地面，复用 floor.glb 并降低重复模型的绘制提交开销。
## What Changes
提供宽长块数、色调、反光性、粗糙性、金属性、IOR 和环境反射强度。通过分区 InstancedMesh 展示。
## Capabilities
### New Capabilities
- mechanical-floor: 模型实例化地面及材质配置。
## Impact
仅新增组件、组件辅助模块、预览示意图和 dcsConfig 注册；不修改通用预览。回滚时删除新增文件与注册项即可，源模型不变。
