## Why

组件目录使用静态示意图和自动播放的 GIF，不能一致地展示真实组件效果；同时加载多张动图会增加首次访问开销并干扰浏览。

## What Changes

- 逐一从用户已启动的真实预览页采集全部 44 个组件，制作 600×400、约 10 帧、无限循环的压缩 WebP。
- 为每张动图导出独立首帧封面，并在注册配置中同时声明动图与首帧地址。
- 目录只懒加载首帧，鼠标进入预览图片后才请求和显示动图，离开立即恢复首帧；加载失败时保留封面。
- 保留采集路由、时序、构图、编码统计和验收记录。
- 按后续要求删除 44 张已替换的旧 SVG/GIF/PNG/JPG，并同步 README 示例。

## Capabilities

### New Capabilities
- `animated-catalog-previews`: 真实动图资源、独立首帧及按需悬停播放。

### Modified Capabilities
无。

## Impact

影响 `src/views/componentList.vue`、独立目录图片组件、`src/dcsConfig.ts`、元素卡片注册、`public/preview/`、README 和采集工具。已被新资源替换的旧预览图按后续要求删除，通用三维预览页和组件渲染实现不变，不增加运行依赖。

回滚：从 Git 同时还原原预览资源及上述目录和配置改动。采集仅使用已有 localhost 服务；根据 AGENTS.md 不运行 build/dev/serve/preview，浏览器操作限于本次用户授权的采集和预览交互验收。
