## Context

The reference page `https://github.com/pbakaus/radiant/blob/main/static/rain-on-glass.html` is not a single reusable shader. It combines:

- procedural drop alpha and refraction textures
- a CPU-side raindrop simulation for large drops, trails, micro-droplets, and collisions
- shader-side composition that refracts a foreground texture over a blurred background

For this repository, the component should preserve that hybrid behavior while fitting into the existing tresjs / three component pipeline. The result should stay self-contained, live under `src/components/` and `src/shader/`, and be integrated only through `src/dcsConfig.ts`.

## Goals / Non-Goals

**Goals:**

- Add a new independent component instead of modifying the existing panel or liquid components.
- Keep the visual identity of the reference through animated droplets, trails, and glass refraction.
- Preserve the reference-style tuning parameters where they remain useful in the component context.
- Render on a square plane with a double-sided material, as requested.
- Keep the implementation self-contained and compatible with the current dynamic component service.

**Non-Goals:**

- Do not recreate the fullscreen HTML page shell from the reference.
- Do not keep `postMessage`, pointer, mouse, click, or touch-triggered splash behavior.
- Do not add a scene capture / true screen-space refraction pipeline for the whole preview.
- Do not modify generic preview view files unless a blocker is discovered.

## Decisions

1. Decision: Implement the component as a single `PlaneGeometry` with a custom `ShaderMaterial`.
   - Rationale: The requested output is a configurable square plane with a double-sided glass material, and the reference effect is fundamentally texture-driven rather than mesh-driven.
   - Alternative considered: Using a subdivided mesh with vertex displacement. That would add geometry cost without improving the characteristic rain-on-glass read.

2. Decision: Port the CPU-side raindrop simulation into a component-scoped helper instead of trying to rewrite everything as a pure fragment shader.
   - Rationale: The reference look depends on large-drop motion, trail spawning, micro-droplet accumulation, and collision merging. Reusing that simulation model preserves the result more faithfully and keeps the public parameters meaningful.
   - Alternative considered: Replacing the simulation with procedural shader noise. That would be simpler, but it would not preserve the reference behavior or parameter semantics.

3. Decision: Keep the background self-contained by generating foreground / background canvases for the shader to refract.
   - Rationale: This repository does not currently provide a capture pass for refracting the live scene behind a material component. A self-contained backdrop keeps the component portable and visually close to the reference demo.
   - Alternative considered: Rendering the actual scene into a refraction target. That would be more physically correct, but it would introduce infrastructure work outside the requested component scope.

4. Decision: Expose the key rain-system and shader-composite parameters through props and `src/dcsConfig.ts`.
   - Rationale: The user explicitly asked to preserve the adjustable settings from the reference, so the component should not collapse the port into only a couple of decorative controls.
   - Alternative considered: Only exposing `rainAmount` and `refraction`. That would be easier to use, but it would hide the useful rain-system controls that make the port flexible.

5. Decision: Remove all interaction-specific behavior and keep the animation autonomous.
   - Rationale: The component should behave consistently in the service preview without extra event plumbing, and the request explicitly called for a straight component port rather than an interactive page.
   - Alternative considered: Keeping optional click splashes. That would complicate the component and diverge from the requested scope.

## Risks / Trade-offs

- Risk: Updating a canvas-backed water map every frame is more expensive than a purely static material.
  - Mitigation: Keep the plane geometry simple, use a fixed internal simulation resolution, and avoid adding unnecessary extra passes.

- Risk: Because the background is self-generated, the material reads like a stylized glass insert rather than true refraction of arbitrary scene content.
  - Mitigation: Document that choice in the change, keep the reference-style amber city lighting, and avoid claiming physically correct scene refraction.

- Risk: Extremely large rain rates or drop counts can make the component visually noisy.
  - Mitigation: Clamp values in the component and expose safe config ranges in `src/dcsConfig.ts`.

## Migration Plan

- Create the new OpenSpec change artifacts for the component.
- Add `src/components/waterDropGlassMaterialComponent/` with props, sanitization, the offscreen rain simulation helper, and the plane component wrapper.
- Add `src/shader/waterDropGlassMaterialComponent/glass.vert` and `glass.frag`.
- Register the component in `src/dcsConfig.ts` with defaults, default transform, config controls, and preview path.
- Add a preview asset under `public/preview/`.
- Run `npm run build` to validate integration.

## Open Questions

- None for the current scope.
