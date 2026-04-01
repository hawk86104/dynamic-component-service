## Context

The reference page `https://github.com/pbakaus/radiant/blob/main/static/bass-ripple.html` is a fullscreen WebGL demo. Its fragment shader combines pulse-synced displacement, layered radial/standing waves, hex-like patterned detail, and highlight-heavy shading. That core logic fits this repository well, but the page-level implementation does not:

- fullscreen canvas setup is not reusable as a dynamic component
- `u_res` and page background styling are specific to the standalone demo
- mouse, touch, and click ripple behavior do not belong in a reusable service component

Within this repository, the effect should become a three.js plane material with externalized shader files under `src/shader/currentRipplePanelComponent/`, and the component should be integrated only through `src/dcsConfig.ts`.

## Goals / Non-Goals

**Goals:**

- Add a new independent component instead of changing existing ground panels.
- Keep the reference feel of pulse-driven ripple motion, layered waves, and highlight-rich patterned shading.
- Default the panel to floor usage with a flat plane and near-ground placement.
- Preserve a concise set of useful controls rather than exposing every internal shader constant.
- Keep all rendering inside the existing tresjs/three pipeline.

**Non-Goals:**

- Do not recreate the fullscreen page presentation from the reference.
- Do not keep pointer, click, hover, or touch-driven interaction logic.
- Do not add generic preview view changes.
- Do not replace existing dreamy fluid or mosaic ground components.
- Do not add real displaced geometry or per-cell instancing; the panel should stay shader-based.

## Decisions

1. Decision: Implement the component as a single `PlaneGeometry` with a custom shader material.
   - Rationale: The reference effect is fundamentally fragment-driven, and a single plane remains lightweight and appropriate for a ground panel.
   - Alternative considered: Using dense displaced geometry or instanced cells. That would increase complexity and cost without materially improving the intended medium-distance usage.

2. Decision: Keep the reference pulse envelope and layered ripple composition, but adapt it to plane-local UV coordinates and actual scene view direction.
   - Rationale: The actual scene camera already provides angled viewing, so the fake fullscreen camera setup from the reference is unnecessary. Keeping the pulse envelope and displacement math preserves the recognizable motion.
   - Alternative considered: Replacing the effect with generic scrolling noise. That would lose the reference identity.

3. Decision: Reinterpret the reference grille-like pattern as an energized conductive panel with hex-grid grooves and glowing current lines.
   - Rationale: The user asked for an electric ripple panel used on the ground, so the color and material response should read as a floor energy panel rather than a speaker close-up.
   - Alternative considered: Porting the metallic amber look verbatim. That would be faithful to the original demo, but not to the requested panel concept.

4. Decision: Keep a concise public control set centered on pulse frequency, pulse strength, grid density, wire width, ripple scale, flow speed, shimmer strength, panel size, opacity, and three colors.
   - Rationale: These controls preserve the most useful reference tuning while keeping the service config manageable.
   - Alternative considered: Exposing every internal wave multiplier, light exponent, and timing constant. That would overcomplicate the config panel.

5. Decision: Remove all interaction-specific shader inputs and event dependencies.
   - Rationale: The user explicitly asked to remove click effects, and dynamic components should animate autonomously.
   - Alternative considered: Keeping optional interactive ripples. That would contradict the request and increase complexity.

## Risks / Trade-offs

- Risk: The shader relies on view-dependent highlights, so the panel looks strongest from oblique cameras.
  - Mitigation: Keep pulse glow and ambient current response visible so the surface still reads from higher angles.

- Risk: Very high grid density combined with a very wide wire width can visually close the panel surface.
  - Mitigation: Clamp numeric values inside the component and expose safe config ranges in `src/dcsConfig.ts`.

- Risk: The preview asset is illustrative rather than a captured live render.
  - Mitigation: Use a preview that clearly communicates an electric hex-ripple floor panel while keeping the change lightweight.

## Migration Plan

- Create the new OpenSpec change artifacts for the component.
- Add `src/components/currentRipplePanelComponent.vue` with safe prop clamping, shader material setup, and time-driven uniform updates.
- Add `src/shader/currentRipplePanelComponent/panel.vert` and `panel.frag`.
- Register the component in `src/dcsConfig.ts` with defaults, config controls, preview path, and default ground placement.
- Add a preview asset under `public/preview/`.
- Run `npm run build` to validate integration.

## Open Questions

- None for the current scope.
