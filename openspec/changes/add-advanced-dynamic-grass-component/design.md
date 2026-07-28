## Context

`three-stylized` separates a reusable `Grass` facade from a standalone demonstration scene. Its reusable rendering path consists of:

- deterministic fractal terrain height and dirt-patch generation
- an invisible geometry that limits vegetation to meadow-covered areas
- deterministic, area-weighted triangle sampling
- an instanced ribbon mesh for grass blades
- vertex-shader wind with coherent world-space waves
- stylized grass color, diffuse, and back-transmission shading
- optional instanced wildflower cards generated from a procedural channel-mask texture
- explicit disposal of generated geometries, materials, textures, and instanced meshes

The demo layer separately creates the renderer, camera, OrbitControls, scene background, hemisphere light, directional Sun, GUI, statistics, resize handling, and animation loop. The dynamic component service and future regional scene editor already own those scene responsibilities.

## Goals / Non-Goals

**Goals:**

- Preserve the recognizable meadow implementation and deterministic output from the reference.
- Package the result as a normal tresjs/three component that can be transformed by its parent scene.
- Expose useful terrain, grass, wind, appearance, and wildflower settings.
- Keep the implementation self-contained and release all GPU resources on rebuild or unmount.
- Keep shader sources external and register the component through `src/dcsConfig.ts`.

**Non-Goals:**

- Do not port the reference renderer, camera, OrbitControls, resize hooks, GUI, reset button, or statistics.
- Do not create or configure a scene background, environment map, hemisphere light, or directional Sun.
- Do not expose Sun azimuth, elevation, color, or intensity controls.
- Do not support caller-provided sampling meshes in this first service component; the component owns its generated terrain.
- Do not modify generic preview files.

## Decisions

1. Decision: Port the rendering layers, not the `Grass` facade and demo shell verbatim.
   - Rationale: Vue props and lifecycle hooks already provide configuration updates and ownership. Porting the full facade would duplicate state normalization and external-surface APIs that are not part of this component request.
   - Alternative considered: Copying the complete facade unchanged. This was rejected because it would preserve unused scene-facing API and add unnecessary code.

2. Decision: Rebuild terrain and vegetation for structural changes, while updating wind and appearance uniforms in place.
   - Rationale: Terrain dimensions, seed, density, blade dimensions, and flower counts affect geometry or placement. Wind and colors only affect uniforms or existing vertex colors.
   - Alternative considered: Rebuild on every prop change. This was rejected because color and wind sliders should remain responsive.

3. Decision: Keep a fixed internal stylized-light basis for the grass shader, but create no light object and expose no Sun controls.
   - Rationale: The reference grass material is a custom shader and needs a stable basis to remain visible. A fixed shader basis is component appearance, not scene ownership; the generated ground continues to respond to the host scene's real lighting.
   - Alternative considered: Adding a directional light to the component. This was rejected because it would leak scene-level lighting into the regional editor.

4. Decision: Keep procedural wildflowers optional and synchronize them to the same wind uniforms.
   - Rationale: Wildflowers are an important part of the upstream meadow, but the editor may need grass-only regions.
   - Alternative considered: Remove flowers completely. This was rejected because the user asked to port the project and retain useful settings.

5. Decision: Flatten the service config into editor-friendly props.
   - Rationale: `dcsConfig.ts` binds direct props, while the upstream library accepts nested option objects. Flat names such as `terrainDegree`, `windStrength`, and `wildflowerDensity` are easier to configure and serialize.
   - Alternative considered: A single JSON options prop. This was rejected because it would lose native slider, switch, and color controls.

6. Decision: Preserve the upstream MIT attribution in a component-local third-party notice.
   - Rationale: The port substantially derives from the upstream source and must retain its license notice.

## Risks / Trade-offs

- Risk: High terrain area and density values can generate many blade instances.
  - Mitigation: Clamp editor ranges and derive one instanced draw call for all blades.

- Risk: Structural sliders can trigger repeated rebuilds while dragged.
  - Mitigation: Coalesce structural changes to at most one rebuild per animation frame.

- Risk: The generated ground uses `MeshStandardMaterial` and therefore depends on host-scene light.
  - Mitigation: This is intentional editor integration; the generic preview already provides ambient and directional lights.

- Risk: Wildflowers use a generated canvas texture.
  - Mitigation: Generate one mask texture per flower layer and dispose it with the layer.

## Migration Plan

- Add the OpenSpec contract and implementation tasks.
- Port terrain, sampling, grass, and flower helpers into the component directory.
- Externalize grass and flower shaders under `src/shader/advancedDynamicGrassComponent/`.
- Add the Vue lifecycle wrapper and flat prop normalization.
- Register defaults and config controls in `src/dcsConfig.ts`.
- Add the preview asset and attribution notice.
- Perform read-only static review and diff inspection; do not run build/debug commands under the project rule.

## Open Questions

- None for the current scope.
