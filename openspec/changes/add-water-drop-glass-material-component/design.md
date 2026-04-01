## Context

The reference page `https://github.com/pbakaus/radiant/blob/main/static/rain-on-glass.html` is not a single reusable shader. It combines:

- procedural drop alpha and refraction textures
- a CPU-side raindrop simulation for large drops, trails, micro-droplets, and collisions
- shader-side composition that makes those droplets read like wet glass

For this repository, the component should preserve the droplet simulation but switch the final visual output to actual scene glass. The result should stay self-contained, live under `src/components/` and `src/shader/`, and be integrated only through `src/dcsConfig.ts`.

## Goals / Non-Goals

**Goals:**

- Add a new independent component instead of modifying the existing panel or liquid components.
- Keep the visual identity of the reference through animated droplets, trails, and glass distortion.
- Preserve the useful rain-system tuning parameters from the reference.
- Render as a glass volume with adjustable length, width, and thickness so the component reads like a real object in the scene.
- Use real scene transmission so users can see actual helpers and objects through the glass.

**Non-Goals:**

- Do not recreate the fullscreen HTML page shell from the reference.
- Do not keep `postMessage`, pointer, mouse, click, or touch-triggered splash behavior.
- Do not add a custom preview-wide refraction pipeline unless the built-in material path proves insufficient.
- Do not modify generic preview view files unless a blocker is discovered.

## Decisions

1. Decision: Implement the component as a `BoxGeometry` with adjustable length, width, and thickness.
   - Rationale: The updated requirement is to read as real glass in the scene, and a thin box better communicates physical thickness while still staying lightweight.
   - Alternative considered: Keeping a single plane. That would work for the rain overlay, but it would feel less convincing as real glass when viewed from oblique angles.

2. Decision: Port the CPU-side raindrop simulation into a component-scoped helper instead of trying to rewrite everything as a pure fragment shader.
   - Rationale: The reference look depends on large-drop motion, trail spawning, micro-droplet accumulation, and collision merging. Reusing that simulation model preserves the result more faithfully and keeps the public parameters meaningful.
   - Alternative considered: Replacing the simulation with procedural shader noise. That would be simpler, but it would not preserve the reference behavior or parameter semantics.

3. Decision: Use `MeshPhysicalMaterial` transmission for the final glass response, and feed the rain simulation into a dynamic normal texture plus shader-side roughness / emissive modulation.
   - Rationale: The preview scene already renders through standard three.js materials, so physical transmission is the most direct path to “see through to the opposite objects” without inventing a fake background.
   - Alternative considered: Keeping the previous self-generated skyline background. That matched the reference page mood, but it did not satisfy the request for real scene glass.

4. Decision: Expose the key rain-system parameters together with physical glass controls through props and `src/dcsConfig.ts`.
   - Rationale: The final component needs both the reference rain controls and enough material controls to tune real glass behavior in the scene.
   - Alternative considered: Only exposing rain controls and hardcoding the glass. That would make the component less useful across different scene setups.

5. Decision: Remove all interaction-specific behavior and keep the animation autonomous.
   - Rationale: The component should behave consistently in the service preview without extra event plumbing, and the request explicitly called for a straight component port rather than an interactive page.
   - Alternative considered: Keeping optional click splashes. That would complicate the component and diverge from the requested scope.

## Risks / Trade-offs

- Risk: Updating a canvas-backed water map every frame is more expensive than a purely static material.
  - Mitigation: Keep the geometry simple, use a fixed internal simulation resolution, and avoid unnecessary extra passes.

- Risk: Built-in transmission depends on the preview scene and renderer behavior, so some transparent helpers or effects behind the glass may not refract exactly like a dedicated offline renderer.
  - Mitigation: Keep the implementation on standard three.js physical glass and avoid layering extra transparent tricks behind it in the default preview.

- Risk: Extremely large rain rates or drop counts can make the component visually noisy.
  - Mitigation: Clamp values in the component and expose safe config ranges in `src/dcsConfig.ts`.

## Migration Plan

- Create the new OpenSpec change artifacts for the component.
- Add `src/components/waterDropGlassMaterialComponent/` with props, sanitization, the offscreen rain simulation helper, and the glass box component wrapper.
- Add `src/shader/waterDropGlassMaterialComponent/glass.vert` and `glass.frag` to modulate the physical glass material with rain data.
- Register the component in `src/dcsConfig.ts` with defaults, default transform, config controls, and preview path.
- Add a preview asset under `public/preview/`.
- Run `npm run build` to validate integration.

## Open Questions

- None for the current scope.
