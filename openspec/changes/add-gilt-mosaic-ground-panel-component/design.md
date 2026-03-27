## Context

The reference page `gilt-mosaic.html` is a fullscreen WebGL demo with a tile-based gold mosaic surface, directional wave flips, and moving highlight sweeps. For this repository, the reusable part is the shader behavior, not the page shell or event handling.

This repository already has an older `dreamyFluidPanelComponent`, so the new work must live in a separate component and separate shader directory. The user explicitly wants a new component, a floor-ready square plane, and removal of click-triggered interaction.

## Goals / Non-Goals

**Goals:**

- Add a new independent component instead of changing the existing dreamy fluid panel.
- Render the effect as a square plane that is rotated flat for floor use.
- Preserve the reference feel of tiled reflective motion and wave-front flipping.
- Keep all visuals inside the three.js canvas pipeline.
- Expose a concise set of safe controls through `src/dcsConfig.ts`.

**Non-Goals:**

- Do not modify `dreamyFluidPanelComponent`.
- Do not add fullscreen DOM presentation from the reference page.
- Do not add click, touch, hover, or pointer-driven interaction.
- Do not modify `src/views/previewEntry.vue` or `src/views/templateComponet.vue`.
- Do not turn the panel into volumetric fluid or container geometry.

## Decisions

1. Decision: Create a new `giltMosaicGroundPanelComponent` instead of editing `dreamyFluidPanelComponent`.
   - Rationale: The user asked to create a new component, and preserving the existing component avoids regressions.
   - Alternative considered: Replacing the existing dreamy fluid panel implementation. This was rejected because it changes a working component.

2. Decision: Use a single square `PlaneGeometry` with a custom shader material.
   - Rationale: The reference effect is fragment-driven and best represented as a flat ground surface.
   - Alternative considered: Instanced tile geometry. This would increase complexity and cost without clear benefit for the intended use.

3. Decision: Port the reference as a jittered tile grid with directional wave flipping, layered roughness, and moving specular lights.
   - Rationale: Those elements define the recognizable look of `gilt-mosaic.html`.
   - Alternative considered: Simple scrolling noise or generic shimmer. That would lose the mosaic identity.

4. Decision: Remove all interaction-driven branches from the port.
   - Rationale: The requested first version should animate autonomously and ignore preview pointer activity.
   - Alternative considered: Keeping optional click waves. This would contradict the request and complicate the component contract.

5. Decision: Expose only the controls that materially change the look.
   - Rationale: `panelSize`, `tileDensity`, `lightSpeed`, `animationMode`, `waveSpeed`, `waveDelay`, `waveDirection`, `sparkleIntensity`, `groutWidth`, `opacity`, and three colors are enough for the first version.
   - Alternative considered: Exposing every internal shading ramp and timing constant. That would overcomplicate the config panel.

## Risks / Trade-offs

- Risk: The effect is view-dependent and looks strongest from angled cameras.
  - Mitigation: Keep ambient glow and shimmer active so the panel still reads from higher viewpoints.

- Risk: Very high density with high sparkle can over-brighten the panel.
  - Mitigation: Clamp `tileDensity` and `sparkleIntensity` to safe ranges in both the component and registry config.

- Risk: SVG preview art is representative rather than a live render screenshot.
  - Mitigation: Use a preview that clearly communicates the mosaic direction while keeping the implementation lightweight.

## Migration Plan

- Add the new component file under `src/components/`.
- Add component-scoped shader files under `src/shader/giltMosaicGroundPanelComponent/`.
- Register the component in `src/dcsConfig.ts` with defaults, controls, and preview metadata.
- Add a dedicated preview asset in `public/preview/`.
- Validate the repo with `npm run build`.

## Open Questions

- None for the current scope.
