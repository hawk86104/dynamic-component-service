## Context

The requested reference is a presenter page with a circular, scanning, particle-based chart aesthetic. This repository needs a reusable Tres/three component rather than a page-specific implementation. The component should provide only the requested public parameters and leave environment, lighting, scene integration, and reflective treatment to later composition work.

## Goals / Non-Goals

**Goals:**

- Render a circular particle chart in the existing three.js canvas pipeline, lying on the `XZ` plane by default.
- Keep the visual self-lit so it does not depend on lights or environment maps.
- Animate an autonomous sweep where positive speed rotates one way, negative speed rotates the other way, and zero freezes the scan.
- Use center text labels for title and unit with configurable size and color, with text planes parallel to the scan plane rather than camera-facing billboards.
- Recreate the reference-style double circular border with configurable `line2` thickness and border-only `lineColor`.
- Keep the disk hollow in the center and avoid adding a separate hard radial radar line over the scan.
- Keep shader source externalized in a component-scoped shader folder.
- Integrate through `src/dcsConfig.ts` only.

**Non-Goals:**

- Do not add data parsing, chart series controls, scene lights, environment textures, mirrors, or external models.
- Do not modify generic preview infrastructure.
- Do not require pointer, click, hover, or DOM interaction.
- Do not automatically run build/dev/browser validation in this conversation because the project rule forbids it unless explicitly requested.

## Decisions

1. Decision: Implement the chart body as a single `THREE.Points` cloud with custom vertex and fragment shaders.
   - Rationale: Point sprites are a direct fit for particle visuals and keep per-frame work on the GPU.
   - Alternative considered: Instanced mesh particles. That would provide more geometry per particle but is heavier and unnecessary for the requested UI-style chart.

2. Decision: Use two `RingGeometry` meshes for the circular border instead of generic line primitives.
   - Rationale: WebGL line width is unreliable in three.js, while ring meshes allow the `line2` control to produce a visible, stable double-border thickness and let `lineColor` affect only the border meshes.
   - Alternative considered: `LineBasicMaterial.linewidth`. That would not reliably render thicker lines across browsers.

3. Decision: Generate local `CanvasTexture` text planes inside the component.
   - Rationale: The reference text sits on the chart plane, while `bannerLabel` sprite mode faces the camera and its non-sprite mode has fixed orientation that does not match this component's local `XZ` plane.
   - Alternative considered: Reusing `bannerLabel`. That caused the text plane to behave differently from the scan plane.

4. Decision: Add a hollow scan-surface shader plus a denser point-cloud shader rather than only brightening static points.
   - Rationale: The online effect has a visible sweeping surface and a dense scanned-particle trail, so both layers are needed.
   - Alternative considered: Keeping only a rotating line and static point glow. That was too sparse, looked like an extra radar line, and did not match the reference closely enough.

5. Decision: Keep radius, particle count, and ring density internal for this version.
   - Rationale: The user requested a specific concise control set; adding more knobs would make the config panel noisy and imply scope not requested.

## Risks / Trade-offs

- Risk: Large particle sizes with additive blending can become visually dense.
  - Mitigation: Clamp particle size and keep ring/text depth ordering separate from the point field.

- Risk: Text readability depends on placement relative to the scan glow.
  - Mitigation: Render labels as separate transparent planes slightly above the scan surface and keep them independent from particle opacity.

- Risk: Source inspection cannot prove runtime rendering.
  - Mitigation: Keep implementation aligned with existing component patterns and report that build/debug validation was intentionally skipped under the project rule.

## Migration Plan

- Add the component and shader files.
- Register defaults and config schema in `src/dcsConfig.ts`.
- Add a preview SVG asset.
- Inspect source and diffs only unless the user explicitly asks to run build/dev/browser validation.

## Open Questions

- None for the current scope.
