## Why

The user asked for a new component named `眩目光环`, referencing `vertigo.html` from the Radiant repository. The reusable value of that page is not its fullscreen shell, but its shader-driven tunnel illusion: polar-space ring bands, angular segment lines, pulsing illumination waves, and a crimson-to-amber glow palette.

This repository needs that effect as an independent dynamic component that:

- runs inside the existing tresjs / three.js service pipeline
- renders on a square plane instead of a fullscreen canvas
- removes mouse drag and other page-level interaction
- exposes safe controls through `src/dcsConfig.ts`

## What Changes

- Add a new `vertigoHaloComponent`.
- Port the visual core of `vertigo.html` into a plane-based three.js shader material.
- Keep the component square by default, ground-ready, and autonomous.
- Expose a concise parameter set for size, tunnel motion, ring density, segment density, pulse energy, glow intensity, opacity, and palette colors.
- Register the component in `src/dcsConfig.ts`.
- Add a dedicated preview asset.

## Capabilities

### New Capabilities

- `vertigo-halo-component`: Provide a square plane component that recreates the reference vertigo tunnel as an animated halo-like surface inside the dynamic component service.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `src/components/vertigoHaloComponent.vue`
  - `src/shader/vertigoHaloComponent/`
  - `src/dcsConfig.ts`
  - `public/preview/vertigoHaloComponent.svg`
- APIs:
  - Adds a new component with props for size, tunnel motion, ring density, segment density, pulse intensity, glow intensity, opacity, and core colors.
- Dependencies:
  - Reuses the existing `three`, `@tresjs/core`, and `three-custom-shader-material` stack.
- Systems:
  - Adds a new registry entry without changing generic preview infrastructure.
- Rollback strategy:
  - Remove the new registry entry, then delete the new component, shader files, preview asset, and this change folder.
