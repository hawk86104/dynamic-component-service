## ADDED Requirements
### Requirement: 模型重复地面
组件 SHALL 使用 public/model/floor.glb，以 5 米为间距沿 X/Z 方向居中拼接，宽长块数独立配置，范围 1–32。
#### Scenario: 修改块数
- **WHEN** 用户设置宽 3、长 2
- **THEN** 展示 6 个完整模型模块，顶面 Y=0，原有纹理保留
### Requirement: 材质配置
组件 SHALL 暴露整体色调、非金属反光性、粗糙性、金属性、IOR 和环境反射强度。
#### Scenario: 调整材质
- **WHEN** 用户更改颜色或材质参数
- **THEN** 原地更新共享材质，不重新加载模型或重建实例
### Requirement: 实例化与清理
组件 SHALL 使用分区 InstancedMesh 和静态矩阵，共享几何与材质，并在卸载时释放资源。
#### Scenario: 大面积地面
- **WHEN** 拼接数量超过 4×4
- **THEN** 按最多 4×4 个模块划分批次，分别计算包围体供视锥裁剪
#### Scenario: 加载过程中卸载
- **WHEN** 模型返回时组件已经卸载
- **THEN** 释放返回模型的资源，不再挂载场景
