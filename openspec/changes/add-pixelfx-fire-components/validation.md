# Validation

- 上游：PixelFX 0.3.0，commit `a84159688af3ca37a4be05a0d422b94451b2e24e`。30 个原始文件的 SHA-256 检查通过；新增的类型声明单独注明，无改写上游源码。
- 定向 ESLint：`src/components/pixelFx`、`src/vendor/pixelfx/core/fx.d.ts`、两份离线脚本和 `tests/pixelFx.test.mjs` 无错误、无警告。没有对原样保留的第三方 JavaScript 执行项目自动修复。
- `src/dcsConfig.ts` lint：当前与 `git show HEAD:src/dcsConfig.ts` 比较，同为 208 条既有诊断，按规则、消息、严重性和对应源码逐项比较，新增 0 条。
- `vue-tsc --noEmit --pretty false`：通过，0 条诊断。
- `node --test tests/pixelFx.test.mjs`：7/7 通过。覆盖固定版本哈希、12 项入口与默认值、真实特效动态透明 RGBA、缓冲复用、实例独立、速度为零与异常时间、单次结束清空、循环与重播、非中心锚点、旋转父级下公告牌、四种呈现状态、纹理配置、资源只销毁一次、SFC 导入类型解析及全部素材首帧一致性。
- 12 组 600×400 动态 WebP + 静态 poster；合计约 4.83 MB（含 manifest）。逐项解析动画帧，解码比较首帧与 poster，像素完全一致。相邻相同帧由 WebP 编码器合并，manifest 分开记录采样帧数、编码帧数和时长。
- 对篝火、火环、陨石的离线封面进行了本地图片检查。素材来自原始绘制代码，不含示例角色，不是 Three.js 页面截图或录屏。
- 静态审查确认加载代次守卫在卸载后失效、销毁时移除并释放实例资源；Tres `useLoop` 监听由其作用域清理机制管理。异步浏览器行为尚未实测。
- `src/views/previewEntry.vue`、`src/views/templateComponet.vue`、`vite.config.ts`、`package.json` 未修改。注册复用原有 Federation 生成方式，未执行构建或远端宿主集成。
- OpenSpec strict validation 与 `git diff --check` 通过。

按 `AGENTS.md` 跳过 build/dev/serve/preview、服务启动、浏览器调试和截图。没有验证 GPU 编译、浏览器视觉效果、宿主导出流程或实际帧率；CPU/素材检查不代表这些验证通过。
