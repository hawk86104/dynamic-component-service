## Context

The reference page `vertigo.html` is a fullscreen WebGL effect that renders a tunnel illusion entirely in the fragment shader. Its recognizable look comes from:

- converting centered UVs into polar coordinates
- building ring bands that scroll by depth
- slicing those rings with angular segment lines
- modulating ring brightness with multiple wave layers
- adding sparse flash spikes and neon edge highlights
- mixing a dark purple / crimson base with amber and red accents

For this repository, the right translation is a component-scoped shader on a single square `PlaneGeometry`. The component should preserve the motion language and palette feel of the reference while removing DOM shell concerns, fullscreen sizing, and pointer-drag rotation behavior.

## Goals / Non-Goals

**Goals:**

- Add a new independent component instead of editing existing panel components.
- Render the effect on a square plane that sits flat on the ground by default.
- Preserve the reference page's polar tunnel illusion, segmented rings, wave pulses, and flashing highlights.
- Keep the effect autonomous with no click, hover, touch, or drag behavior.
- Expose a concise set of safe controls through `src/dcsConfig.ts`.

**Non-Goals:**

- Do not reproduce the fullscreen canvas shell, page label, or document styling from the reference page.
- Do not modify `src/views/previewEntry.vue` or `src/views/templateComponet.vue`.
- Do not replace `dreamyFluidPanelComponent` or any existing panel component.
- Do not introduce extra mesh layers or geometry-heavy ring instancing.
- Do not port unused or page-specific interaction parameters from the reference file.

## Decisions

1. Decision: Implement the effect as one square `PlaneGeometry` with a custom shader material.
   - Rationale: The source effect is fundamentally fragment-driven, and a single plane keeps the port lightweight and aligned with repository conventions.
   - Alternative considered: Building the tunnel from repeated ring meshes or instanced geometry. This was rejected because it adds complexity and does not improve the intended floor-surface use case.

2. Decision: Use square dimensions controlled by a single `size` prop.
   - Rationale: The user explicitly requested a square plane, so a single size control is clearer than separate length and width values.
   - Alternative considered: Keeping independent width and length controls. This was rejected because it weakens the requested square-plane contract.

3. Decision: Preserve the reference structure by reusing polar mapping, depth scrolling, ring segmentation, layered pulse waves, flash spikes, vignette, haze, and grain in adapted form.
   - Rationale: Those elements are what make the reference visually identifiable as `vertigo.html`.
   - Alternative considered: Replacing the shader with generic radial noise and bloom. This would lose the reference identity.

4. Decision: Remove pointer drag and keep the rotation drift autonomous.
   - Rationale: A reusable service component should animate on its own and ignore preview pointer events unless interactivity is explicitly required.
   - Alternative considered: Preserving a user-driven rotation offset. This was rejected because it depends on page-level event wiring and contradicts the requested migration style.

5. Decision: Expose a compact control set centered on motion, density, glow, and palette.
   - Rationale: `size`, `tunnelSpeed`, `rotationSpeed`, `ringFrequency`, `segmentCount`, `pulseIntensity`, `flashIntensity`, `edgeGlow`, `opacity`, and four palette colors are enough to reshape the effect without overloading the config panel.
   - Alternative considered: Exposing every internal threshold and timing constant from the source shader. This was rejected because it would create a noisy, harder-to-use control surface.

## Risks / Trade-offs

- Risk: Because the source is a fullscreen shader, mapping it onto a finite square plane can make the edges feel more abrupt.
  - Mitigation: Add a soft square edge mask and keep haze / vignette active so the pattern sits naturally inside the plane.

- Risk: High ring density combined with high flash intensity can produce over-bright or noisy visuals.
  - Mitigation: Clamp all exposed numeric props to conservative ranges in both the component and the registry config.

- Risk: The tunnel illusion can look flatter from a perfectly top-down view than from an angled camera.
  - Mitigation: Preserve strong pulse contrast, edge highlights, and atmospheric darkening so the plane still reads clearly from typical scene cameras.

## Migration Plan

- Create the OpenSpec change artifacts for the new component.
- Add `src/components/vertigoHaloComponent.vue` with safe prop clamping, uniform syncing, and time updates.
- Add `src/shader/vertigoHaloComponent/panel.vert` and `panel.frag`.
- Register the component in `src/dcsConfig.ts` with defaults, config controls, and default object transform.
- Add a preview asset under `public/preview/`.
- Run `npm run build` and update `tasks.md` with completion status.

## Open Questions

- None for the current scope.
