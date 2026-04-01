## Why

The component library already includes several shader-driven ground panels, but it does not yet provide a reusable moonlit water surface that reads like calm water with traveling ripples and a bright lunar reflection.

The requested reference page `https://radiant-shaders.com/shader/moonlit-ripple` provides the right visual language for this new component:

- layered ripple motion across dark water
- a strong moon-glow focal area and reflective highlight response
- Fresnel-style edge lighting and wave-shaped shading
- a concise visible control set built around `Ripple Speed`, `Moon Glow`, `Camera Tilt`, and `Wave Intensity`

For this repository, the reusable part is the shader behavior rather than the standalone fullscreen page shell. The first version should explicitly remove click, pointer, and touch interaction behavior, then port the visual core into a three.js + shader component that defaults to a ground-ready square plane for water-surface usage.

## What Changes

- Add a new `moonlitRippleWaterPanelComponent` that renders a moonlit ripple water surface on a square plane through three.js + shader.
- Port the reference effect into component-scoped shader files under `src/shader/moonlitRippleWaterPanelComponent/`.
- Preserve the most useful reference-style controls: ripple speed, moon glow, camera tilt, and wave intensity.
- Add service-friendly controls for plane size, opacity, Fresnel response, and core water colors.
- Remove click, pointer, touch, and fullscreen page logic from the port.
- Register the component in `src/dcsConfig.ts` with defaults, config controls, preview metadata, and default ground placement.
- Add OpenSpec artifacts that document the scope, implementation choices, validation plan, and rollback strategy.

## Capabilities

### New Capabilities

- `moonlit-ripple-water-panel-component`: Provide a shader-driven square water panel with autonomous moonlit ripple motion for ground usage.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `src/components/moonlitRippleWaterPanelComponent.vue`
  - `src/shader/moonlitRippleWaterPanelComponent/`
  - `src/dcsConfig.ts`
  - `public/preview/moonlitRippleWaterPanelComponent.svg`
- APIs:
  - Adds new component props for square plane size, ripple speed, moon glow, camera tilt, wave intensity, Fresnel strength, opacity, and core water colors.
- Dependencies:
  - Reuses existing `three`, `@tresjs/core`, and `three-custom-shader-material`; no new dependency is required.
- Systems:
  - Adds a new component registration without modifying generic preview infrastructure files.
- Rollback strategy:
  - Remove the registry entry from `src/dcsConfig.ts`, then delete the component file, shader directory, preview asset, and this change folder.
