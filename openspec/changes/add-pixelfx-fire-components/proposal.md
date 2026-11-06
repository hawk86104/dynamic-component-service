## Why

按用户要求逐批移植 PixelFX，第一批先完成 Fire 分类的 12 个效果。每个效果作为独立动态组件出现，保留原始像素动画与可选择的三维呈现方式，控制第一版参数数量。

## What Changes

- 固定 PixelFX 上游提交 `a84159688af3ca37a4be05a0d422b94451b2e24e`，本地保留 core、Fire 源码、LICENSE 和 NOTICE。
- 注册火盆、篝火、蜡烛、火焰吐息、火环、火龙卷、火球、火柱、喷火器、陨石、幽灵火焰、火把 12 个独立组件入口，共用播放器和生命周期管理。
- 每个组件提供公告牌、精灵、固定立面、地面四种呈现类型，以及尺寸、透明度、播放、速度、循环和重新播放等基本控制。
- 将原项目 Gallery 的效果绘制转换为当前目录所用的 600×400 动态 WebP 与同首帧封面，预览不加入示例角色。
- 通过现有 `dcsConfig.ts` 接入预览和 Federation，不扩展通用预览页面。

## Capabilities

### New Capabilities

- `pixelfx-fire-components`: PixelFX Fire 分类逐效果组件、三维呈现、基本播放、原生预览转换及本地源码集成。

### Modified Capabilities

None.

## Impact

- 新增 `src/components/pixelFx/`、`src/vendor/pixelfx/`、`public/preview/animated/pixelFx/`、离线预览转换脚本与本变更目录。
- 修改 `src/dcsConfig.ts` 和 README，依赖、既有组件和通用预览文件不变。
- 第一批不实现角色动作、物体锚点查询、路径、调色板编辑、图集烘焙或全库分类界面。
- 回滚：移除注册 import/spread 和 README 章节，移除上述新增目录及脚本；无存量数据迁移。
- 按 `AGENTS.md` 仅执行源码检查、定向 lint 和 CPU 检查，跳过构建、服务、浏览器调试与截图。离线 WebP 是原始绘制代码的素材转换，不作为 Three.js 浏览器验证。
