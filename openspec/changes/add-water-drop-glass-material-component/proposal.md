## Why

The component library already includes several shader-driven panels and liquid effects, but it does not yet provide a reusable rain-on-glass material that behaves like real glass in the scene.

The requested reference page `rain-on-glass.html` from the `pbakaus/radiant` project uses a hybrid approach:

- CPU-side droplet simulation and canvas-stamped water maps
- shader-side refraction and highlight shaping
- a small set of tunable rain parameters

That visual language fits this repository well, but the old fullscreen page shell and fake skyline background do not. For this service, the final component should read as a real glass object that can show the actual scene behind it, while keeping the reference-style rain behavior.

## What Changes

- Add a new `waterDropGlassMaterialComponent` rendered as a configurable glass box with adjustable length, width, and thickness.
- Port the reference droplet simulation into component-scoped TypeScript helpers that generate the dynamic `waterMap` and rain normal texture.
- Use a physical transmission glass material plus component-scoped shader hooks under `src/shader/waterDropGlassMaterialComponent/` so the rain effect sits on top of the real preview scene behind the glass.
- Preserve configurable rain controls such as rain amount, drop radius, droplet rate, trail rate, and collision tuning.
- Replace the old fake-background refraction controls with real glass material controls such as transmission, IOR, roughness, clearcoat, attenuation distance, and normal strength.
- Remove fullscreen page logic, `postMessage` parameter plumbing, click / touch splash interaction, and the self-generated skyline from the final visible effect.
- Register the component through `src/dcsConfig.ts` with defaults, config controls, preview metadata, and a sensible default placement.
- Keep OpenSpec artifacts aligned with the final implementation and validation.

## Capabilities

### New Capabilities

- `water-drop-glass-material-component`: Provide a scene-aware rain-on-glass material component with animated droplets on a physical transmission glass body.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `src/components/waterDropGlassMaterialComponent/`
  - `src/shader/waterDropGlassMaterialComponent/`
  - `src/dcsConfig.ts`
  - `public/preview/waterDropGlassMaterialComponent.svg`
- APIs:
  - Adds new component props for glass dimensions, rain amount, drop sizing, droplet spawning, trail behavior, collision tuning, transmission, IOR, roughness, clearcoat, attenuation distance, droplet roughness, and rain normal strength.
- Dependencies:
  - Reuses existing `three`, `@tresjs/core`, `three-custom-shader-material`, and browser canvas APIs; no new dependency is required.
- Systems:
  - Adds a new component registration without modifying generic preview infrastructure files.
- Rollback strategy:
  - Remove the new registry entry from `src/dcsConfig.ts`, then delete the component folder, shader directory, preview asset, and the OpenSpec change folder.
