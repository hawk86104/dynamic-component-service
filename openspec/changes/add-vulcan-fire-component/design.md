## Context

The supplied view mounts `src/components/demos/t-z/vulcan-fire/index.vue`. The deployed demo module was inspected and uses the same 24 fire / 40 smoke defaults as that source. Its reusable techniques are a time-indexed `Data3DTexture`, independently animated camera-facing particle layers, lifetime color/opacity, and depth sorting. Its own canvas, camera, orbit controls, Tweakpane, bloom composer, external smoke image, and page lighting are not suitable as shared scene infrastructure.

## Goals / Non-Goals

**Goals:**

- Preserve the reference's narrow, turbulent flame tongues and expanding dark smoke with a local +Y emitter.
- Provide reactive controls with one shared default source, bounded resource usage, deterministic seeds, and a pause switch.
- Remain usable under parent transforms and in logarithmic-depth map renderers.
- Keep all shaders in the component shader directory and use the existing registration/preview/federation path.

**Non-Goals:**

- No canvas, camera, controls, scene background, global ambient light, or post-processing composer.
- No fluid simulation; this component complements `volumetricFluidFlameComponent`.
- No new dependency, copied upstream shader/helper code, or remotely fetched runtime texture.
- No build, dev server, browser validation, or screenshots without a user request.

## Decisions

1. Use two `InstancedBufferGeometry` meshes, each capped at 64 particles. Their shared vertex shader constructs screen-facing quads in view space. Particle centers use the full model matrix; billboard dimensions use its X/Y scale magnitudes so parent scaling affects both placement and visible sizes. Sorting uses the active camera's view matrix multiplied by the component world matrix.
2. Independently implement a periodic flame-density volume with the existing Three.js `ImprovedNoise` utility. Circular time coordinates and height-dependent phase produce a looping animation. Use single-channel unsigned-byte textures, default 64×64×64, with a configurable upper bound of 128×128×64. Debounce structural volume edits and dispose the replaced texture. Ordinary palette and motion controls do not regenerate it.
3. Generate a smoke-density texture locally with an irregular radial/noise mask. The shader adds warm illumination near birth and fades growing puffs over their lifetime. This avoids a fragile `/textures/smoke.png` URL.
4. Store randomized particle traits and normalized ages. Derive positions analytically from age, emitter radius, rise speed, and binding, allowing tuning while already warm. Update and sort without allocating objects per frame. Draw smoke before fire, with back-to-front sorting within each layer, matching the reference's two-layer composition.
5. Use `ShaderMaterial` with explicit Three.js common, logarithmic-depth, clipping, and color-space chunks. Three.js r180's WebGL2 shader pipeline supports `sampler3D`; no custom material injection or renderer changes are required. Keep depth testing enabled and depth writes disabled on transparent meshes.
6. Replace scene-wide bloom with an optional soft additive billboard halo. Keep the optional dark ground disk and local fire point light scoped to the component. This approximation does not blur unrelated scene content.
7. Register all public props, shared defaults, transform support, and local preview paths in `src/dcsConfig.ts`. The initial illustrative SVG is retained as a source asset. Following the user's recording request, the catalog uses a real 600×400 animated WebP plus its identical first-frame poster through the existing hover-preview infrastructure; generic preview views remain unchanged.

## Risks / Trade-offs

- Procedural noise differs from the upstream simplex implementation → preserve its motion/shape controls and palette; document that visual parity is unverified.
- Large volume regeneration costs CPU time → cap dimensions/octaves, debounce edits, and avoid rebuilding for per-frame or ordinary controls.
- Billboard smoke/fire are not solid 3D volumes and their two layers cannot inter-sort with every external transparent object → keep normal depth testing and document this limitation.
- Parent rotation changes the emission direction while billboard faces remain aligned with the camera → this is intentional particle behavior; nonuniform size scaling follows the parent X/Y scale magnitudes.
- No runtime rendering validation is authorized → perform lint and source review only, and state this limit in the delivery.

## Migration Plan

Add the component, helper modules, shader files, catalog image, and registry entry. Existing federation exposure is generated from the registry. Roll back by removing these additions and the single registry import/entry; no stored data migration is needed.

## Open Questions

None for implementation. Render quality and GLSL driver compatibility remain pending an explicitly authorized runtime validation.
