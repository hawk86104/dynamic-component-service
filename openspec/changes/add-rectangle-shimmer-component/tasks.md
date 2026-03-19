## 1. Geometry and Props

- [x] 1.1 在 `src/components` 创建组件骨架，完成四面墙几何与底部矩形周边路径搭建。（可验证：预览中可看到四面墙实体与底部周边跑线）
- [x] 1.2 新增 `length`、`width`、`height` props 与默认值，并将其映射到几何尺寸更新逻辑。（可验证：修改参数后模型尺寸实时变化且无报错）
- [x] 1.3 为尺寸参数增加边界保护（最小值/非法值兜底）。（可验证：传入非法值时组件仍可稳定渲染）

## 2. Wall Gradient Shader

- [x] 2.1 实现四面墙 shader 材质，按局部高度计算 bottom->top 渐变。（可验证：墙体颜色从下深上浅连续过渡）
- [x] 2.2 暴露墙体底色、顶色、底部透明度、顶部透明度参数并接入 uniforms。（可验证：调整颜色和透明度后墙体渐变与透明渐变同步变化）
- [x] 2.3 验证不同高度下渐变方向与视觉一致性。（可验证：增减高度后仍保持下深上浅方向）

## 3. Perimeter Line2 Running Effect

- [x] 3.1 基于底部矩形周边路径构建 `Line2` 跑线。（可验证：四条边形成连续周边跑线）
- [x] 3.2 接入 `lineWidth`、`lineColor`、`lineSpeed` 参数并驱动流动动画。（可验证：线宽/颜色/速度改动在画面中可见）
- [x] 3.3 实现 `gradientLength` 与 `segmentCount` 控制逻辑。（可验证：改变参数后线段长度渐变与段数明显变化）

## 4. Integration and Validation

- [x] 4.1 通过 `src/dcsConfig.ts` 接入默认参数与调参项，不修改通用预览文件 `src/views/previewEntry.vue`、`src/views/templateComponet.vue`。（可验证：预览页通过现有通用链路正常加载组件并可调参）
- [ ] 4.2 运行 lint 并修复相关问题。（可验证：lint 命令执行成功）
- [ ] 4.3 验证 dev/build/serve 三种模式下组件可正常渲染。（可验证：三种流程均无 shader/line2 运行错误）
- [x] 4.4 在实施说明中记录回滚顺序：移除示例引用 -> 回退组件与 shader/line2 文件。（可验证：文档可直接用于执行回滚）
- [x] 4.5 将 shader 代码放入 `src/shader/rectangleShimmerComponent/` 并拆分顶点、片元文件。（可验证：组件从独立 shader 文件导入并构建成功）
