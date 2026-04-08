## Why

The repository does not yet provide a floor-ready component that recreates the reference `chip floor` shader language from the user's CodePen source. The user explicitly wants a new component, wants the shader studied closely instead of reinterpreted loosely, and wants the result to stay grounded on the floor with a large soft-edged circular footprint.

The reference demo exposes multiple tuning groups. For this service port, the component should keep the exposed controls from:

- `Architecture`
- `Silicon Texture`
- `Data Trails (Long)`
- `Neon Particles (Dots)`
- `Colors`

and should remove the exposed controls from:

- `Camera & Zoom`
- `Quality & Performance`

while switching the component itself to a top-down floor shader that relies on the service scene camera instead of an internal demo camera.

## What Changes

- Add a new `chipFloorGroundComponent`.
- Port the core fragment shader structure from `chip-floor-codepen.js` into component-scoped shader files with minimal adaptation.
- Render the effect on a large circular ground mesh with a soft transparent edge fade so the floor feels broader than the visible boundary.
- Remove the internal demo camera path and render the effect as a top-down floor material controlled by the outer scene camera.
- Expose the remaining reference control groups plus a service-level `size` control.
- Register the new component through `src/dcsConfig.ts`.
- Add a dedicated preview asset.

## Capabilities

### New Capabilities

- `chip-floor-ground-component`: Provide a floor-ready circular chip-surface effect that closely matches the reference shader's chip pattern, trench glow, moving trails, particles, and silicon dot texture.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `src/components/chipFloorGroundComponent.vue`
  - `src/shader/chipFloorGroundComponent/`
  - `src/dcsConfig.ts`
  - `public/preview/chipFloorGroundComponent.svg`
- APIs:
  - Adds new component props for size, architecture detail, silicon texture, trail motion, particle motion, and palette colors.
- Dependencies:
  - Reuses existing `three`, `@tresjs/core`, and `three-custom-shader-material`.
- Systems:
  - Adds a new component registration without changing generic preview infrastructure.
- Rollback strategy:
  - Remove the new registry entry from `src/dcsConfig.ts`, then delete the new component file, shader directory, preview asset, and change folder.
