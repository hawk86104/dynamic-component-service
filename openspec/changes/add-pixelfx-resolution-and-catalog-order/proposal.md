## Why

PixelFX 按原始像素放大时会出现明显的方块。全部组件列表需要优先展示其他三维组件，让大量 PixelFX 条目集中排在后面。

## What Changes

- 为 PixelFX 注册可保存的贴图分辨率，提供原始像素、2× 平滑和 4× 平滑。
- 在全部组件列表中将 PixelFX 整组放到其他组件之后。

## Capabilities

### New Capabilities

- `pixelfx-resolution-and-catalog-order` 支持贴图分辨率调节和全部组件列表的分类排序。

### Modified Capabilities

无。

## Impact

涉及 PixelFX 播放器、组件工厂和组件注册。回滚时可将场景的贴图分辨率调回 1×，并将组件注册中的 PixelFX 条目移回列表开头。
