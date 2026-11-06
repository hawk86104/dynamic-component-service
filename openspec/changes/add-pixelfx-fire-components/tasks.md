## 1. Source and scope

- [x] 1.1 核对分享、源码、Fire 的 12 项 meta 与现有 DCS 接入，形成 proposal/design/spec。
- [x] 1.2 本地集成固定版本 core、fire、LICENSE/NOTICE，记录提交和文件哈希；可验证：文件与上游一致且未复制字体或全效果入口。

## 2. Shared player and component entries

- [x] 2.1 实现透明 RGBA 帧合成和固定步长播放；可验证：复用纹理/缓冲、暂停、单次结束清空、循环、重播和实例独立。
- [x] 2.2 实现四种呈现、等比尺寸和 origin 锚点；可验证：变换计算覆盖非中心 pivot 及旋转父级。
- [x] 2.3 实现 Vue 生命周期及 12 个薄入口；可验证：代次守卫、取消/失效加载、完全释放及 restart 暴露。

## 3. Catalog and previews

- [x] 3.1 同步组件默认值、中文配置、独立 type/comFile；可验证：12 项唯一、default/config 与 props 对齐，通用预览不改动。
- [x] 3.2 离线转换原始效果为 12 组 600×400 动态 WebP/同首帧封面；可验证：资产尺寸、帧数和首帧一致，来源记录完整。
- [x] 3.3 添加使用文档、效果清单、下批扩展方式；可验证：描述实际参数、首次移植范围与预览来源。

## 4. Static validation

- [x] 4.1 完成定向 lint、CPU 行为与资源/锚点检查、注册和素材一致性检查；可验证：记录检查结果及任何既有诊断。
- [x] 4.2 完成 OpenSpec 与 diff 审查；可验证：明确按 AGENTS.md 跳过 build/dev/serve/浏览器/截图，未将离线素材视为运行效果验证。
