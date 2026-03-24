## Why

当前组件库里还没有一个可以直接在 TresJS 预览链路中展示“抽屉 + 递归/网格隔间容器”的动态组件。用户已经指定参考开源项目 `ak-tr/bins`，但该项目基于 React Three Fiber，并且包含打印床、导出、页面设置等当前仓库不需要的外围能力。

这次变更需要把它收敛成当前仓库可复用的组件形态：

- 使用 Vue 3 + TresJS + TypeScript
- 只保留 `Box Settings`、`Bin Settings`、`Generation Settings`、`Show measurements`、`Show index numbers`
- 通过 `src/dcsConfig.ts` 统一注册默认值与配置面板
- 不修改通用预览视图

## What Changes

- 新增 `binsContainerComponent` 动态组件，用于在场景中渲染抽屉轮廓和内部隔间容器
- 迁移参考项目的两种生成逻辑：
  - `Recursive`
  - `Grid`
- 保留以下参数能力并映射到当前仓库统一配置格式：
  - Box Settings: `width`、`height`、`depth`
  - Bin Settings: `radius`、`thickness`、`divideWidth`、`divideDepth`、`outerGap`、`innerGap`
  - Generation Settings: `generationType`、`iterations`、`rows`、`cols`
  - Page toggles: `showMeasurements`、`showIndexNumbers`
- 删除参考项目里不属于组件本体的逻辑：
  - 打印床尺寸提示
  - 导出 OBJ / Vase Mode
  - 页面级 UI / Provider / 控制面板
  - 相机、灯光、PresentationControls 等场景包装

## Capabilities

### New Capabilities
- `bins-container-component`: 在当前组件服务中提供一个可配置的箱式隔间容器组件，支持递归和网格两种布局。

### Modified Capabilities
- None.

## Impact

- Affected code:
  - `src/components/` 新增组件与子组件
  - `src/dcsConfig.ts` 新增组件注册与配置 schema
  - `openspec/changes/add-bins-container-component/` 新增变更文档
- Dependencies:
  - 仅复用现有 `vue`、`three`、`@tresjs/core`
  - 不新增 React 或导出相关依赖
- Systems:
  - 仅影响前端三维渲染层和动态组件注册表
- Rollback strategy:
  - 先从 `src/dcsConfig.ts` 移除注册
  - 再回退 `src/components/binsContainerComponent*` 新增文件
  - 最后回退 OpenSpec 变更目录和预览占位图
