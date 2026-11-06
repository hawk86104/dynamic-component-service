## Why

公告牌与精灵目前都完整跟随相机朝向。用户需要可区分的呈现方式、上游 Gallery 的配色与种子控制，以及能独立放入场景的循环特效。

## What Changes

- 公告牌绕组件的本地 Y 轴转向相机，精灵保持完整面向相机。
- 注册原始配色与 27 个上游预设、可保存的种子、新种子按钮和水平镜像。
- 所有已发布效果默认循环，显式传入 `loop: false` 时单次播放。
- 下架 12 个串联动作与 31 个依赖示例人物像素的效果。其余 29 个演示动作切换为纯特效并更新预览。

## Capabilities

### New Capabilities

- `pixelfx-standalone-controls` 提供独立特效、可保存的配色与种子、镜像及不同的相机朝向。

### Modified Capabilities

无。

## Impact

改动范围包括 PixelFX 播放器、组件入口、注册、预览和组件说明。上游许可、来源清单与全部原始源码用于核对和恢复。

已保存本次改动前的未跟踪入口和预览。回滚时可从 `%TEMP%/dcs-pixelfx-standalone-rollback-SjDQHS` 恢复对应相对路径，再移除本次新增文件和 OpenSpec 变更。已使用下架类型的旧场景需要换成单独效果或恢复对应入口。
