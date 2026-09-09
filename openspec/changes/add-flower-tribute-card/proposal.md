## Why
需要一个使用指定纪念背景、可填写献花寄语的三维镭射卡片组件。

## What Changes
- 新增献花卡片，原图比例、偏红光栅炫光、五角星压纹及双面镜像。
- 增加两行白色左对齐文字与材质参数，接入组件配置。

## Capabilities
### New Capabilities
- `flower-tribute-card`: 献花卡片图文与双面镭射展示。
### Modified Capabilities
无。

## Impact
仅新增组件、独立 shader、图片资源和 dcsConfig 注册；不修改通用预览、不引入依赖。回滚时移除这些新增内容及注册项。
