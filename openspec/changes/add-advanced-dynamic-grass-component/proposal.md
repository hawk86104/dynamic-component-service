## Why

The service does not yet provide a reusable high-detail grass component for the regional scene editor. The referenced `Steve245270533/three-stylized` project already contains a strong Three.js meadow renderer, but its demo also owns the camera, renderer, background, Sun, hemisphere light, GUI, and scene statistics. Those scene-level concerns would conflict with the editor that will host this component.

The useful capability is the meadow itself: deterministic terrain, area-weighted instanced grass, animated wind, stylized blade shading, and optional deterministic wildflowers. This change ports that capability while deliberately removing demo-scene ownership and scene-environment controls.

## What Changes

- Add a new `advancedDynamicGrassComponent` based on the MIT-licensed `three-stylized` meadow implementation.
- Port procedural terrain generation, vegetation surface sampling, instanced grass blades, wind animation, and procedural wildflowers.
- Move all grass and wildflower GLSL into component-specific files under `src/shader/advancedDynamicGrassComponent/`.
- Expose terrain, grass, wind, appearance, and wildflower controls through flat Vue props and `src/dcsConfig.ts`.
- Do not create or expose a Sun, background, environment, camera, renderer, orbit controls, GUI, demo statistics, or reset controls.
- Add a dedicated preview asset and third-party license notice.

## Capabilities

### New Capabilities

- `advanced-dynamic-grass-component`: Provide a deterministic, configurable meadow that can be positioned as a normal three.js object inside the regional scene editor.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `src/components/advancedDynamicGrassComponent/`
  - `src/shader/advancedDynamicGrassComponent/`
  - `src/dcsConfig.ts`
  - `public/preview/advancedDynamicGrassComponent.svg`
  - `openspec/changes/add-advanced-dynamic-grass-component/`
- APIs:
  - Adds a new dynamic component with terrain, grass, wind, color, and wildflower props.
- Dependencies:
  - Reuses existing `three`, Vue, and `@tresjs/core`; no new runtime dependency is required.
- Systems:
  - Adds one registry entry without modifying generic preview or editor infrastructure.
- Rollback strategy:
  - Remove the registry entry, component directory, shader directory, preview asset, notice, and this OpenSpec change.
