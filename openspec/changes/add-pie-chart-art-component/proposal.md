## Why

The service needs a reusable 3D pie chart component that matches the supplied WebGPU reference while staying compatible with this repository's TresJS + three.js WebGL runtime.

## What Changes

- Add a new `PieChartArt` component that renders the default Market Share dataset as an extruded 3D pie chart.
- Port the reference visual ideas to WebGL using `ExtrudeGeometry`, WebGL-compatible materials, and component-scoped shaders.
- Support chart data replacement through a JSON prop and rebuild the chart directly when the data changes.
- Expose only the requested controls: all Chart settings, label size, Gradient direction/range/curve/color scheme, and Material roughness/metalness/environment intensity.
- Register the component in `src/dcsConfig.ts` with defaults, object transform, preview metadata, and config-panel controls.

## Capabilities

### New Capabilities

- `pie-chart-art-component`: Provide a WebGL 3D pie chart component with JSON-driven data, direct data rebuilds, automatic color schemes, configurable geometry/labels, gradient shading, and material controls.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `src/components/PieChartArt/`
  - `src/shader/PieChartArt/`
  - `src/dcsConfig.ts`
  - `public/preview/PieChartArt.svg`
- APIs:
  - Adds a new component type `PieChartArt` with JSON data and chart/gradient/material props.
- Dependencies:
  - Reuses existing `three`, `@tresjs/core`, `three-custom-shader-material`, and `json5`.
- Systems:
  - Adds component registration through `src/dcsConfig.ts`; generic preview views remain unchanged.
- Rollback strategy:
  - Remove the `PieChartArt` registry entry from `src/dcsConfig.ts`, then delete the component folder, shader folder, preview asset, and this OpenSpec change folder.
