## Why

The component service needs a reusable circular particle chart that can reproduce the reference's radar-like circular motion language while staying independent from scene lighting, environment maps, mirrors, and other authored scene objects.

## What Changes

- Add a new `circularParticleChartComponent` that renders a circular particle field with autonomous scanning motion on the `XZ` plane by default.
- Expose the requested controls: particle size, particle color, scan speed from `-1` to `1`, title text, title size, unit text, unit size, text color, `line2` double-border width, and border-only `lineColor`.
- Keep the circular disk hollow in the center and remove the extra hard radar-like radial line from the scan effect.
- Render title and unit text as in-scene canvas texture planes that stay parallel to the scan plane instead of billboard/sprite labels.
- Store custom particle shader source under `src/shader/circularParticleChartComponent/`.
- Register the component through `src/dcsConfig.ts` with defaults, preview metadata, and config controls.

## Capabilities

### New Capabilities

- `circular-particle-chart-component`: Provides a hollow-center circular dynamic particle chart with configurable particles, scan direction/speed, center text, and border styling.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `src/components/circularParticleChartComponent.vue`
  - `src/shader/circularParticleChartComponent/`
  - `src/dcsConfig.ts`
  - `public/preview/circularParticleChartComponent.svg`
- APIs:
  - Adds a new component type `circularParticleChartComponent` with the requested props plus `line2` and `lineColor`.
- Dependencies:
  - Reuses existing `three`, `@tresjs/core`, and the existing canvas sprite label component; no new dependency is required.
- Systems:
  - Adds component registration without modifying `src/views/previewEntry.vue` or `src/views/templateComponet.vue`.
- Rollback strategy:
  - Remove the `circularParticleChartComponent` entry from `src/dcsConfig.ts`, then delete the new component file, shader directory, preview asset, and this OpenSpec change folder.
