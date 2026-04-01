## Why

The component library already includes several shader-driven panels and liquid effects, but it does not yet provide a reusable rain-on-glass material that reads like water droplets sliding across illuminated glass.

The requested reference page `rain-on-glass.html` from the `pbakaus/radiant` project uses a hybrid approach:

- CPU-side droplet simulation and canvas-stamped water maps
- shader-side refraction, highlight, and shadow compositing
- a small set of tunable rain and refraction parameters

That visual language fits this repository well, but the fullscreen page shell, DOM canvas ownership, and pointer interaction do not. For this service, the reusable part should become a standalone three.js component that renders on a double-sided square plane and keeps the important tuning controls.

## What Changes

- Add a new `waterDropGlassMaterialComponent` rendered as a configurable square plane with a double-sided glass shader.
- Port the reference droplet simulation into component-scoped TypeScript helpers that generate the dynamic `waterMap` texture for the shader.
- Port the refraction shader into externalized shader files under `src/shader/waterDropGlassMaterialComponent/`.
- Preserve configurable rain and shader tuning controls, including rain amount, refraction, drop radius, droplet rate, trail rate, collision radius, brightness, and alpha shaping.
- Remove fullscreen page logic, `postMessage` parameter plumbing, and click / touch splash interaction from the port.
- Register the component through `src/dcsConfig.ts` with defaults, config controls, preview metadata, and a sensible default placement.
- Add OpenSpec artifacts that document scope, implementation choices, validation, and rollback.

## Capabilities

### New Capabilities

- `water-drop-glass-material-component`: Provide a self-contained rain-on-glass material component with animated droplets and shader-based refraction on a square plane.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `src/components/waterDropGlassMaterialComponent/`
  - `src/shader/waterDropGlassMaterialComponent/`
  - `src/dcsConfig.ts`
  - `public/preview/waterDropGlassMaterialComponent.svg`
- APIs:
  - Adds new component props for plane size, rain amount, refraction, drop sizing, droplet spawning, trail behavior, collision tuning, brightness, alpha shaping, and visibility toggles for shine / shadow treatment.
- Dependencies:
  - Reuses existing `three`, `@tresjs/core`, and the browser canvas APIs; no new dependency is required.
- Systems:
  - Adds a new component registration without modifying generic preview infrastructure files.
- Rollback strategy:
  - Remove the new registry entry from `src/dcsConfig.ts`, then delete the component folder, shader directory, preview asset, and the OpenSpec change folder.
