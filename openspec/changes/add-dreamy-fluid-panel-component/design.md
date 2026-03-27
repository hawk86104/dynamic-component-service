## Context

The reference page at `https://github.com/pbakaus/radiant/blob/main/static/sequin-wave.html` is a fullscreen WebGL demo. Its core effect comes from a fragment shader that does the following:

- builds a hex/sequin tiling
- samples a layered wave field
- tilts each virtual reflective disc according to that wave
- computes a tight specular response for flashes and sheen

That logic maps well to a plane material in three.js, but several parts of the demo do not belong in a reusable component:

- fullscreen canvas handling
- page label and page background styling
- pointer and touch event listeners
- extra cursor-driven specular lighting

Within this repository, the effect must be expressed as a canvas-side tresjs/three component. Shader files must live under `src/shader/<component-name>/`, and the component must be integrated through `src/dcsConfig.ts` without changing the generic preview pages.

## Goals / Non-Goals

**Goals:**

- Provide a plane component with independently configurable length and width that sits flat on the ground by default.
- Keep the visual core of the reference effect: dense reflective cells, layered wave motion, and strong view-dependent flashes.
- Let developers tune the effect through a concise set of safe parameters.
- Keep all core rendering inside the three.js canvas pipeline.
- Keep the implementation self-contained and component-scoped.

**Non-Goals:**

- Do not reproduce fullscreen page presentation from the reference.
- Do not implement pointer, touch, click, or hover-driven light interaction.
- Do not turn the panel into a volumetric liquid body or a container-based component.
- Do not add generic preview infrastructure changes.
- Do not introduce per-cell real geometry; the panel should stay shader-based for stability and performance.

## Decisions

1. Decision: Use a single `PlaneGeometry` with independently configurable length and width plus a custom shader material instead of instanced reflective discs.
   - Rationale: The reference effect is already fundamentally fragment-driven. A single plane keeps the component lightweight and appropriate for a ground panel.
   - Alternative considered: Instanced disc geometry for each sequin. This would increase geometry and update cost without meaningfully improving the intended medium-distance usage.

2. Decision: Correct the shader field by panel aspect ratio so reflective cells keep a stable shape when length and width diverge.
   - Rationale: Once the panel can become rectangular, UV-space sampling alone would visibly stretch the sequins and wave field. Passing panel length and width into the shader keeps the effect visually consistent.
   - Alternative considered: Leaving the pattern in normalized UV space. This would make the reflective cells look squashed or elongated on non-square panels.
3. Decision: Preserve the reference demo's hex tiling, layered wave sampling, tilt direction estimation, and specular layering in the fragment shader.
   - Rationale: Those are the parts that define the look and directly answer the user's request.
   - Alternative considered: Replacing the pattern with generic noise or texture scrolling. That would lose the recognizable reflective-cell character.

4. Decision: Remove the cursor-driven light source entirely.
   - Rationale: The user explicitly asked to remove the click/interaction effect, and page-level interaction does not belong in a reusable service component.
   - Alternative considered: Keeping an optional pointer highlight toggle. This would add complexity and contradict the requested first version.

5. Decision: Keep color tuning concise with three color controls: base tone, sheen tone, and highlight tone.
   - Rationale: This provides enough freedom to shift between cold and warm looks without exposing the entire internal lighting composition.
   - Alternative considered: Exposing every intermediate ramp color. That would overcomplicate the control panel.

6. Decision: Make the component ground-ready by rotating the internal plane into the XZ orientation and setting a near-ground default placement in the registry.
   - Rationale: This matches the intended use on floor-like surfaces while preserving a simple external object transform contract.
   - Alternative considered: Leaving the plane vertical and requiring external rotation every time. That would create avoidable setup friction.

## Risks / Trade-offs

- Risk: The panel depends on view-dependent specular math, so it will feel more alive from angled cameras than from a perfectly top-down view.
  - Mitigation: Keep ambient sheen and wave modulation strong enough that the panel still reads well when viewed from higher angles.

- Risk: Very high density plus large sequin size can overfill cells and reduce readability.
  - Mitigation: Clamp `tileDensity` and `sequinSize` to safe ranges in both the component and registry config.

- Risk: A fully opaque backing plate may look too heavy in some scenes, while a fully transparent panel can lose the patterned floor identity.
  - Mitigation: Blend between dark backing gaps and bright sequins, and expose panel `opacity` as a top-level control.

## Migration Plan

- Create the new change artifacts for the component.
- Add `dreamyFluidPanelComponent.vue` with a single plane mesh and custom shader material.
- Add component-scoped vertex and fragment shader files under `src/shader/dreamyFluidPanelComponent/`.
- Register the component in `src/dcsConfig.ts` with defaults, controls, description, preview path, and default ground-oriented object transform.
- Add a preview asset under `public/preview/`.
- Run `npm run build` to validate that the component integrates cleanly without touching preview infrastructure.

## Open Questions

- None for the current scope.
