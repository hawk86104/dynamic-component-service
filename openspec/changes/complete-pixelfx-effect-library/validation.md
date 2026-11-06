# Validation

## 完成范围

- 固定来源：PixelFX 0.3.0 / `a84159688af3ca37a4be05a0d422b94451b2e24e`。
- 完整清单：244 项 / 21 类，新增 232 个独立 Vue 入口，保留原 Fire 12 项的 type 和文件路径。
- 全部 281 个上游文件 SHA-256 一致；所有分类及跨分类相对依赖可在本地解析。未复制全效果静态 index 或 Gallery 字体，原 LICENSE/NOTICE 保留。
- 新增 72 项角色效果采用原生 action 播放；Fire 第一批继续展示纯特效。UI、转场和全幅天气仍是局部三维纹理面板。
- 参数保持原六项、四种呈现类型和 restart。所有条目的 props/default/config、唯一 type/comFile 与分类名称检查通过。

## 执行结果

- 定向 ESLint：组件目录、两份本地类型声明、离线脚本及 CPU 测试通过，无新增错误或警告。第三方 JavaScript 原样保留，没有执行项目格式修复。
- `src/dcsConfig.ts`：与 HEAD 比较均为 208 条既有 lint 诊断；按规则、消息、严重性和源码逐项比较，新增 0 条。
- `vue-tsc --noEmit --pretty false`：通过，无类型诊断。
- `node --test tests/pixelFx.test.mjs`：9/9 通过，约 39.4 秒。
  - 固定源码哈希、244 项注册及原生默认循环一致。
  - 244 项完整时间线逐项产生可见变化，缓冲复用，单次播放全部能结束并清空。
  - 分类源文件集合、全部相对依赖与懒加载入口完整，无遗漏或 eager index。
  - 对 fireball-throw、sword-slash、burning、glitch、disintegrate 逐帧对照原 `createAct`；包含预备、姿态、命中停顿、原生循环、画面抖动和动作 bounds，像素一致。
  - 独立实例、速度为零、异常时间、重复播放、暂停与重播回归通过。
  - 非中心锚点、旋转父级下公告牌、Sprite/立面/地面状态检查通过。
  - Canvas/ImageData/纹理复用，材质和纹理配置、资源只销毁一次检查通过。
  - 共享 Vue SFC 导入类型静态解析通过。
  - 全部 244 组动画/封面逐项校验尺寸、帧数、时长、播放方式、角色模式、输入签名与文件 SHA-256；首帧解码后的 RGBA 与 poster 完全相同。
- 全库预览转换：232 项新转换、12 项保留。再次执行转换得到 `0 converted, 244 retained`，验证续跑及角色元数据保留。
- 最终资产：244 个动画、244 个封面，共 9,276 个编码帧；动画 81,397,152 字节、封面 3,356,408 字节（合计约 84.75 MB，不含 manifest）。大多数效果为 12 fps，短于一秒的原生效果按其 fps 采样，完整保留周期。
- 对弓箭射击、燃烧状态、力场、圆形光圈转场、倒计时、蝴蝶的离线封面进行了本地图片检查，未打开项目页面。
- OpenSpec strict validation 和 `git diff --check` 通过。通用预览、目录 UI、Vite 配置和依赖文件与 HEAD 一致。

## 验证边界

遵守 `AGENTS.md`，没有执行 build/dev/serve/preview、服务启动、浏览器调试或截图。没有验证 WebGL/GPU 显示、真实页面 FPS、移动端、远端 Federation 宿主或插件源码导出流程。上述动图是原生像素绘制的离线转换，CPU 和素材检查不代表浏览器视觉验收。
