## Why

The repository already has `dreamyFluidPanelComponent`, and that existing component should remain untouched. This change adds a separate ground-panel component for the user's `gilt-mosaic.html` reference instead of mutating the older shader effect.

The requested look is a square floor-ready reflective mosaic panel with:

- dense tiled cells
- autonomous wave-front flipping
- strong shader-driven specular flashes
- no pointer, touch, or click interaction

## What Changes

- Add a new `giltMosaicGroundPanelComponent`.
- Port the core visual ideas from `gilt-mosaic.html` into a three.js shader plane.
- Keep the new component independent from `dreamyFluidPanelComponent`.
- Expose a concise control set for size, density, motion, sparkle, opacity, grout, and core colors.
- Register the new component through `src/dcsConfig.ts`.
- Add a dedicated preview asset.

## Capabilities

### New Capabilities

- `gilt-mosaic-ground-panel-component`: Provide a ground-ready square mosaic panel that can be placed on the floor and animated entirely inside the three.js shader pipeline.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `src/components/giltMosaicGroundPanelComponent.vue`
  - `src/shader/giltMosaicGroundPanelComponent/`
  - `src/dcsConfig.ts`
  - `public/preview/giltMosaicGroundPanelComponent.svg`
- APIs:
  - Adds new component props for panel size, density, motion timing, sparkle intensity, grout width, opacity, and palette colors.
- Dependencies:
  - Reuses existing `three`, `@tresjs/core`, and `three-custom-shader-material`.
- Systems:
  - Adds a new component registration without modifying generic preview infrastructure.
- Rollback strategy:
  - Remove the new registry entry from `src/dcsConfig.ts`, then delete the new component file, shader directory, preview asset, and change folder.
