## 1. Implementation

- [x] 1.1 新增 DOM 栅格化与蒙版模块，通过静态审查确认 alpha、隔离和异常释放路径。
- [x] 1.2 新增场景采样与独立 shader，通过静态审查确认深度、状态还原与透明合成。
- [x] 1.3 接入 Vue 生命周期及 dcsConfig，通过参数对照和 lint 确认一致性。

## 2. Verification and documentation

- [x] 2.1 编写迁移、边界和人工验收文档，明确尚未执行视觉验证。
- [x] 2.2 完成定向 lint 与 OpenSpec 校验、diff 审查，按项目要求跳过构建和调试。

## 3. Proportional fit follow-up

- [x] 3.1 分离 HTML 原始布局和输出画布，加入等比缩放居中；内容与玻璃蒙版共用变换。
- [x] 3.2 同步 shader 模糊半径、参数名称及文档，静态核对尺寸语义。
- [x] 3.3 验证横向、竖向、放大和缩小的适配计算，运行定向 lint 与规范校验；按项目要求跳过构建和浏览器调试。

本次适配验证：4 组比例计算断言通过，新增及相关 Vue/TS 定向 lint 通过，OpenSpec strict 与 diff 检查通过；浏览器视觉验收未执行。

验证记录：新增 Vue/TS 文件定向 lint 通过；Vue SFC 脚本与相关 TypeScript 内存静态检查 0 diagnostics；OpenSpec strict 校验通过；git diff --check 通过。dcsConfig 的 208 条 lint 错误与 HEAD 基线逐条一致，新增配置块无错误。未执行构建、服务器、浏览器、GPU shader 或视觉验收。
