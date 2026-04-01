## Context

The reference page `https://radiant-shaders.com/shader/moonlit-ripple` is a standalone fullscreen shader demo. Its visible controls expose `Ripple Speed`, `Moon Glow`, `Camera Tilt`, and `Wave Intensity`, and the Radiant site changelog dated March 19, 2026 notes both mouse/touch interactivity across shaders and a `Moonlit Ripple` rewrite with 3D perspective, Fresnel water, and adjustable wave intensity.

That visual logic maps well to a reusable three.js material, but several parts of the page do not belong in this repository:

- fullscreen page ownership and standalone layout
- page-level background framing and camera staging
- click, pointer, and touch interaction behavior
- any dependency on browser-page event plumbing outside the component

Within this repository, the effect should become a square plane material rendered inside the existing tresjs/three canvas pipeline, with shader files externalized under `src/shader/moonlitRippleWaterPanelComponent/` and service integration handled only through `src/dcsConfig.ts`.

## Goals / Non-Goals

**Goals:**

- Add a new independent water-surface component instead of modifying existing panels.
- Preserve the reference feel of moonlit reflection, layered ripple motion, and Fresnel-like water shading.
- Default the component to a ground-ready square plane because the requested use case is a water surface laid flat on the scene.
- Keep a concise control set that preserves the most recognizable reference parameters while still fitting the service config model.
- Keep the rendering self-contained inside the existing three.js + shader architecture.

**Non-Goals:**

- Do not recreate the fullscreen page presentation from the reference.
- Do not keep click, pointer, drag, hover, or touch-driven interaction in the first version.
- Do not add rectangular length/width controls unless they become necessary later; a square plane is enough for the requested scope.
- Do not modify `src/views/previewEntry.vue` or `src/views/templateComponet.vue`.
- Do not build a full physically accurate ocean simulation; this remains a lightweight stylized water panel.

## Decisions

1. Decision: Implement the component as a single square `PlaneGeometry` driven by one public size control.
   - Rationale: The user explicitly said a square plane is sufficient, and a single size control keeps the first version simpler than the repository's rectangular panel variants.
   - Alternative considered: Separate length and width controls. That would be more flexible, but it adds unnecessary surface area for the requested first pass.

2. Decision: Preserve the reference control semantics for `Ripple Speed`, `Moon Glow`, `Camera Tilt`, and `Wave Intensity`, while reinterpreting `Camera Tilt` as a shader-space view/projection bias instead of directly moving the scene camera.
   - Rationale: Those are the most recognizable public parameters on the reference page, but this component should not own the actual preview camera.
   - Alternative considered: Dropping `Camera Tilt` entirely. That would simplify the port, but it would lose one of the named controls the user asked to retain.

3. Decision: Keep the visual identity centered on a moon-disc reflection, layered radial ripple fields, dark-water color depth, and Fresnel-style edge glow.
   - Rationale: Those behaviors are what make the reference read like moonlit water rather than a generic animated plane.
   - Alternative considered: Replacing the moon highlight with generic scrolling noise or an abstract glow. That would weaken the requested source identity.

4. Decision: Remove all interaction-specific uniforms, event listeners, and page-side state, leaving the component fully autonomous.
   - Rationale: The user explicitly asked to remove the click effect, and reusable service components should not depend on standalone page interaction plumbing.
   - Alternative considered: Keeping optional interaction toggles. That would increase complexity and contradict the requested default behavior.

5. Decision: Expose a concise service-facing control set that includes size, opacity, Fresnel strength, and core water colors in addition to the preserved reference parameters.
   - Rationale: The service still needs practical scene controls for water-surface use, even when the source page only exposes a smaller artistic parameter set.
   - Alternative considered: Exposing every internal shader constant. That would make the config panel noisy and harder to use.

6. Decision: Keep shader source externalized in component-scoped vertex and fragment files and integrate the component only through `src/dcsConfig.ts`.
   - Rationale: This matches the repository's shader organization and avoids leaking component-specific behavior into generic preview infrastructure.
   - Alternative considered: Inline shader strings inside the Vue component. That would conflict with the repository convention and make maintenance harder.

## Risks / Trade-offs

- Risk: The strongest moon-glow and Fresnel response will be more noticeable from angled cameras than from a perfectly top-down view.
  - Mitigation: Keep the base ripple luminance visible even when the view angle reduces specular contrast.

- Risk: Reinterpreting `Camera Tilt` inside shader space may not exactly match the standalone page behavior.
  - Mitigation: Document the parameter as a shading tilt / perspective bias and keep the visible response intuitive in the service config.

- Risk: Very high wave intensity or glow values may cause clipping or a blown-out center highlight.
  - Mitigation: Clamp numeric values in the component and expose safe ranges in `src/dcsConfig.ts`.

- Risk: A square-only first version limits some layout flexibility.
  - Mitigation: Keep the component contract simple now and revisit rectangular support only if a real use case appears.

## Migration Plan

- Create the new OpenSpec change artifacts for the component.
- Add `src/components/moonlitRippleWaterPanelComponent.vue` with prop clamping, shader setup, and time-driven uniform updates.
- Add `src/shader/moonlitRippleWaterPanelComponent/panel.vert` and `panel.frag`.
- Register the component in `src/dcsConfig.ts` with defaults, config controls, preview metadata, and default near-ground placement.
- Add a preview asset under `public/preview/`.
- Run `npm run build` to validate integration.

## Open Questions

- None for the current scope.
