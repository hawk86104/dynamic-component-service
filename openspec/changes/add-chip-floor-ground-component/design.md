## Context

The user supplied the original reference page and extracted the critical JavaScript into `chip-floor-codepen.js`. That file contains the core shader and GUI structure. The recognizable effect comes from:

- a chip-floor height field
- recursive split-line pattern generation
- trench glow inside the gaps
- animated long data trails
- sparse moving particle dots
- twinkling silicon surface dots
- a layered surface response that still reads clearly when the outer scene camera looks down at the floor

For this repository, the correct translation is not a fullscreen page shell. It is a component-scoped shader material mounted on geometry inside the existing tresjs / three pipeline.

## Goals / Non-Goals

**Goals:**

- Add a new independent component instead of modifying existing floor or panel components.
- Preserve the reference shader language as closely as practical.
- Let the outer scene camera control the viewing angle instead of embedding an internal demo camera in the shader.
- Remove `Camera & Zoom` and `Quality & Performance` from the exposed control surface.
- Render the effect on a large circular ground mesh with a soft transparent edge fade.
- Expose the remaining tunable groups through `src/dcsConfig.ts`.

**Non-Goals:**

- Do not recreate the fullscreen DOM page shell from the reference.
- Do not add lil-gui or page-level controls inside the component.
- Do not modify `src/views/previewEntry.vue` or `src/views/templateComponet.vue`.
- Do not replace or mutate any existing panel component.
- Do not redesign the shader into a different visual language.

## Decisions

1. Decision: Keep the chip pattern, trench glow, trail, particle, and silicon-dot logic, but translate the surface to a top-down height-field shader instead of preserving the fullscreen raymarch camera section.
   - Rationale: The user wants the component to behave like a normal floor object inside the service scene, with the outer camera controlling the view.
   - Alternative considered: Preserving the original internal camera path. This was rejected because it fights the service camera and costs too much performance.

2. Decision: Remove the internal demo camera, raymarch loop, and SSAA path.
   - Rationale: The user explicitly prefers a vertical floor material whose view is controlled only by the external scene camera, and the original path was too expensive.
   - Alternative considered: Keeping the old internal path but hiding the controls. This was rejected because it still wastes frame time and preserves the wrong view behavior.

3. Decision: Mount the shader on a high-subdivision `PlaneGeometry` rotated flat onto the floor, then keep the visible footprint circular through radial masking and edge fade.
   - Rationale: The user wants a circular floor surface, but real chip height requires dense vertex displacement across the surface, which `CircleGeometry` cannot provide cleanly enough.
   - Alternative considered: Using a literal `CircleGeometry`. This was rejected because it does not provide enough interior subdivision for true chip elevation.

4. Decision: Add only a soft radial transparency fade as the main adaptation layer.
   - Rationale: A finite ground mesh needs a graceful boundary. A wide transparent falloff gives a stronger "infinite floor" impression while keeping the shader body intact.
   - Alternative considered: Hard clipping at the circle edge. This was rejected because it would make the floor boundary too obvious.

5. Decision: Expose the remaining control groups with one additional `size` prop for service integration.
   - Rationale: The remaining GUI groups are part of the requested edit, and the service needs a geometry-level size control for scene placement.
   - Alternative considered: Exposing every internal uniform or keeping the effect fully fixed. The first would overcomplicate the config surface, and the second would ignore the user's parameter request.

## Risks / Trade-offs

- Risk: The reference shader was authored for a fullscreen pass, so showing it on a finite disk can reveal the boundary.
  - Mitigation: Use a large default size and a wide radial alpha fade before the circle edge.

- Risk: A top-down translation can lose some of the original isometric depth feeling.
  - Mitigation: Preserve bevel shading, trench glow, moving trails, particles, and silicon dots so the material still reads like the supplied reference.

- Risk: Very high trail, glow, or particle values can over-brighten the floor.
  - Mitigation: Clamp every exposed numeric control to safe ranges in both the component and `src/dcsConfig.ts`.

## Migration Plan

- Create the OpenSpec change artifacts for the new component.
- Add `src/components/chipFloorGroundComponent.vue` with safe prop clamping, uniform syncing, and time updates.
- Add `src/shader/chipFloorGroundComponent/panel.vert` and `panel.frag`.
- Register the component in `src/dcsConfig.ts` with defaults, transform, and config controls.
- Add a preview asset under `public/preview/`.
- Run `npm run build` and update `tasks.md`.

## Open Questions

- None for the current scope.
