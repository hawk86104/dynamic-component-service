## Why

The component library already includes volume-style liquid, smoke, shield, and shimmer effects, but it does not yet offer a ground-friendly surface panel that feels like a dreamy fluid layer. The requested visual is closer to a reflective sequin-wave surface than to a container or volumetric liquid body: a ground plane with tightly packed reflective cells, cascading wave motion, and warm/cool highlight flashes.

The reference page `sequin-wave.html` demonstrates the exact kind of shader logic that is worth reusing here:

- hex-like cell packing
- multiple interfering wave fields
- wave-driven tilt and specular flashes
- subtle per-cell shimmer variation

For this repository, the page-level interaction behavior is not appropriate for a reusable dynamic component. Mouse and touch light interaction need to be removed, while the visual core must be ported into a tresjs/three shader component that sits flat on the ground by default.

## What Changes

- Add a new `dreamyFluidPanelComponent` that renders a ground panel through three.js + shader.
- Port the reference effect into a component-scoped plane shader instead of a fullscreen WebGL page.
- Keep shader-driven hex/sequin tiling, layered wave motion, tilt-based specular response, and shimmer variation.
- Remove pointer and touch interaction light behavior from the first version.
- Expose a simplified control set for panel size, sequin density, sequin size, wave speed, wave strength, shimmer speed, sparkle intensity, opacity, and core colors.
- Store shader source under `src/shader/dreamyFluidPanelComponent/`.
- Register the component in `src/dcsConfig.ts` with defaults, config controls, preview metadata, and default ground-oriented placement.
- Add OpenSpec artifacts that document scope, constraints, validation, and rollback.

## Capabilities

### New Capabilities

- `dreamy-fluid-panel-component`: Provide a ground-ready shader panel with independently configurable length and width that reproduces the dreamy reflective wave feel of the reference demo without page-level interaction logic.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `src/components/dreamyFluidPanelComponent.vue`
  - `src/shader/dreamyFluidPanelComponent/`
  - `src/dcsConfig.ts`
  - `public/preview/dreamyFluidPanelComponent.svg`
- APIs:
  - New component props covering panel size, density, wave motion, sparkle response, opacity, and color controls.
- Dependencies:
  - Reuses existing `three`, `@tresjs/core`, and `three-custom-shader-material`; no new dependency is required.
- Systems:
  - Affects the dynamic component registry and preview loading path, but does not modify generic preview infrastructure files.
- Rollback strategy:
  - Remove the registry entry from `src/dcsConfig.ts`, then remove the component file, shader directory, preview asset, and this change folder.
