## Why

The component library already has dreamy fluid and mosaic-style ground panels, but it does not yet include a floor-ready electric ripple surface that feels like energized current flowing through a patterned panel.

The requested reference page `bass-ripple.html` provides the right motion language for this new component:

- pulse-driven concentric ripples
- layered standing and radial wave modes
- strong shader-based highlight response
- dense patterned surface detail

For this repository, the reusable part is the shader behavior rather than the fullscreen page shell. Pointer, touch, and click interaction from the reference should be removed, while the effect itself should be ported into a three.js ground panel component with configurable size and simplified controls.

## What Changes

- Add a new `currentRipplePanelComponent` that renders as a ground-ready plane using three.js + shader.
- Port the reference pulse/ripple logic into component-scoped shader files instead of a fullscreen WebGL page.
- Keep the reference-style pulse frequency and strength controls, then add panel size, grid density, wire width, flow speed, ripple scale, shimmer strength, opacity, and core color controls.
- Remove click, pointer, touch, and mouse-driven ripple behavior from the port.
- Register the new component through `src/dcsConfig.ts` with defaults, config controls, preview metadata, and default ground placement.
- Add OpenSpec artifacts that document scope, constraints, validation, and rollback.

## Capabilities

### New Capabilities

- `current-ripple-panel-component`: Provide a shader-driven ground panel with autonomous electric ripple motion derived from the reference `bass-ripple.html` demo.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `src/components/currentRipplePanelComponent.vue`
  - `src/shader/currentRipplePanelComponent/`
  - `src/dcsConfig.ts`
  - `public/preview/currentRipplePanelComponent.svg`
- APIs:
  - Adds new component props for panel size, pulse frequency, pulse strength, grid density, wire width, ripple scale, flow speed, shimmer strength, opacity, and palette colors.
- Dependencies:
  - Reuses existing `three`, `@tresjs/core`, and `three-custom-shader-material`; no new dependency is required.
- Systems:
  - Adds a new component registration without modifying generic preview infrastructure files.
- Rollback strategy:
  - Remove the new registry entry from `src/dcsConfig.ts`, then delete the new component file, shader directory, preview asset, and change folder.
