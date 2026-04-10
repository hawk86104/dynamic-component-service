## Context

All target components already have stable external props and preview integration.
The problem is isolated to how their custom shader materials interact with map scenes that enable logarithmic depth buffering.
The safest fix is to preserve geometry, animation, and props while changing only the underlying material strategy.

## Decisions

1. Use `CustomShaderMaterial` instead of raw shader materials.
   - `rectangleShimmerComponent` uses `THREE.MeshBasicMaterial` as the base material because its wall effect is an unlit transparent surface.
   - `flowingSmokeComponent` uses `THREE.PointsMaterial` as the base material because the smoke system is built on `THREE.Points` and needs `csm_PointSize`.
   - `superEnergyShieldComponent` uses `THREE.MeshBasicMaterial` as the base material because the shield is an additive, unlit shell effect.
   - `chargeOrbGatherComponent`, `chargedBlastRingsComponent`, and `chargedBlastProjectileComponent` use `THREE.MeshBasicMaterial` as the base material because they are emissive mesh effects and need to stay compatible with the renderer's built-in depth/log-depth path.

2. Keep the current component contracts unchanged.
   - No prop rename, removal, or config panel change is required.
   - Existing preview and dynamic-component-service registration stay intact.

3. Rewrite shader outputs to CSM conventions instead of reproducing full built-in shaders.
   - Rectangle wall shaders emit `csm_Position` and `csm_DiffuseColor`.
   - Smoke shaders emit `csm_Position`, `csm_PointSize`, and `csm_DiffuseColor`.
   - Shield shaders emit `csm_Position` and `csm_DiffuseColor`.
   - Charged blast orb, ring, projectile, and trail shaders emit `csm_Position` and `csm_DiffuseColor`.

4. Remove UV coupling from the rectangle wall gradient shader.
   - The previous shader used plane UVs.
   - The new shader computes normalized height from local vertex position plus a `uHeight` uniform, which keeps the gradient stable even when attached through a base material pipeline.

5. Make the imported shader material package explicit.
   - The repo already resolves `three-custom-shader-material` through a transitive dependency, but importing it from application code should be backed by a direct dependency declaration in `package.json`.

## Risks and Mitigations

- Risk: shared material state drifts across the four rectangle walls.
  - Mitigation: create one CSM instance per wall and synchronize uniforms through a single helper.

- Risk: smoke particle sizing changes when moving away from raw `gl_PointSize`.
  - Mitigation: preserve the original sizing formula and route it through `csm_PointSize`.

- Risk: shield fresnel or hit-wave visuals shift after moving off raw `gl_FragColor`.
  - Mitigation: keep all varyings, uniforms, and additive blending unchanged and only switch the final fragment output to CSM diffuse color.

- Risk: charged blast instancing or release motion breaks after moving off raw shader materials.
  - Mitigation: keep the current geometry generation, group transforms, and uniforms unchanged while only swapping the material wrapper and final shader outputs.

- Risk: map compatibility fix changes standalone preview appearance.
  - Mitigation: keep all uniforms, blending, transparency, and animation logic aligned with the original implementation and validate with a project build.

## Validation Plan

- Run a project build to confirm shader compilation and TypeScript integration.
- Run lint for the touched files if the repository lint setup allows targeted validation.
- In a map-enabled scene, confirm all target components remain visible above the map layer when the renderer enables `logarithmicDepthBuffer`.
