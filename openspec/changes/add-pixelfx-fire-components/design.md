## Context

当前 DCS 通过 `comFile` 加载组件，并由 `dcsConfig.ts` 同时生成目录、参数面板和 Federation exposes。PixelFX 0.3.0 的效果是 CPU 像素绘制或模拟模块，其 `createFx` 将 color/light 合成为透明 RGBA。Fire 分类 12 项中只有火环携带示例角色元数据，效果本身可以单独绘制。

## Goals / Non-Goals

**Goals:** 独立组件入口、原始效果、四种呈现、基本播放、离线转换预览、资源正确释放。

**Non-Goals:** 本批不搬运其他分类，不开发角色系统、绑定 UI、路径、烘焙播放器、扩展渲染器接口、调色板或自建特效浏览器。

## Decisions

1. 上游代码独立放入 `src/vendor/pixelfx/`，保留 core 和完整 fire 分类相对路径及许可证；不复制 gallery 字体和全效果静态入口。薄 Vue 入口通过工厂设置固定 effectId，共用播放器；每项仍有独立 type/comFile。
2. 描述和默认值放入组件目录的 catalog/defaults，注册到 `dcsConfig.ts`。使用 `import.meta.glob` 懒加载本批效果。meta 的 size/origin、fps、duration 和默认 loop 来自固定版本，不通过目录名推测。
3. 每实例复用 Canvas、ImageData、像素缓冲和 CanvasTexture。动画由 Tres `useLoop` 驱动，固定步长模拟，限制异常帧差；暂停保留画面，单次完成清空纹理，循环重建效果实例，重播清空累积时间。异步加载用代次标识丢弃过期结果。
4. 公告牌采用旋转 Plane，先抵消父级世界旋转再对齐相机；精灵采用原生 Sprite。固定立面使用 XY，地面将该平面旋转至 XZ。几何平移或 Sprite.center 映射 meta.origin，宽高等比，父级负责附着与 Object3D 变换。
5. 纹理使用 sRGB、NearestFilter、无 mipmap；材质正常透明混合、深度测试开启、深度写入关闭、toneMapped=false。复用上游离线预览的光晕边界淡化策略；不额外叠加发光，不新增 shader。
6. 预览脚本调用同一上游绘制/合成代码和背景，禁止绘制示例角色，离线转为 600×400 WebP 与相同首帧 poster。记录参数和来源，不把转换素材称为 Three.js 页面实录。

## Risks / Trade-offs

- CPU 像素模拟成本随实例数增长 → 按原生 fps 更新纹理，按需加载，只接入一类效果。
- 二维原图已包含投影，地面贴面仍是原二维纹理 → 默认用公告牌保留原图，地面为用户可选类型，不声称立体火焰。
- 公告牌的面朝向受父级影响 → 每帧计算父级世界旋转的逆，再应用相机世界旋转；Sprite 使用自身面向相机机制。
- 构建和 GPU 行为未验证 → 仅报告定向 lint、CPU/静态检查；按项目规则不启动服务、构建或浏览器。

## Migration Plan

追加注册和本地资源即可；回滚移除新增注册、目录、转换脚本与 README 章节。后续分类复用当前播放器和入口工厂，逐项补充元数据、来源和预览。
