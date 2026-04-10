## 1. Rectangle Shimmer Map Compatibility

- [x] 1.1 Replace the rectangle wall shader material path with `CustomShaderMaterial` based on `THREE.MeshBasicMaterial`. (Verifiable: wall surfaces still render and no longer depend on `TresShaderMaterial`)
- [x] 1.2 Adapt the rectangle wall shaders to CSM output variables and keep the bottom-to-top gradient stable. (Verifiable: wall color/opacity gradient still follows wall height after the material swap)
- [x] 1.3 Keep the existing line effect and public props contract unchanged. (Verifiable: perimeter line flow still updates from existing props without `dcsConfig` changes)

## 2. Flowing Smoke Map Compatibility

- [x] 2.1 Replace the smoke particle material path with `CustomShaderMaterial` based on `THREE.PointsMaterial`. (Verifiable: smoke still renders through `THREE.Points` with no raw `ShaderMaterial`)
- [x] 2.2 Adapt the smoke shaders to CSM output variables while preserving motion, dissipation, and particle size logic. (Verifiable: flow direction, fade behavior, and size progression remain visible)
- [x] 2.3 Preserve the current component props and geometry generation logic. (Verifiable: no config schema or prop surface change is needed)

## 3. Super Energy Shield Map Compatibility

- [x] 3.1 Replace the shield material path with `CustomShaderMaterial` based on `THREE.MeshBasicMaterial`. (Verifiable: shield shell no longer uses raw `ShaderMaterial`)
- [x] 3.2 Adapt the shield shaders to CSM output variables while preserving fresnel, flow, hex pattern, and hit-wave behavior. (Verifiable: shield effect still renders with the same controls after the material swap)
- [x] 3.3 Preserve the current shield props and exposed hit-registration API. (Verifiable: consumers still use the same props and exposed methods)

## 4. Dependency and Change Tracking

- [x] 4.1 Add `three-custom-shader-material` as a direct dependency. (Verifiable: application source imports the package without relying on an undeclared dependency)
- [x] 4.2 Record the change in `openspec/changes/` with proposal, design, spec, and tasks artifacts. (Verifiable: the new change folder contains the required files)

## 5. Charged Blast Map Compatibility

- [x] 5.1 Replace the charged orb gather shell materials with `CustomShaderMaterial` based on `THREE.MeshBasicMaterial`. (Verifiable: orb shell layers no longer use raw `ShaderMaterial`)
- [x] 5.2 Adapt the charged orb gather shaders to CSM output variables while preserving glow, fresnel, and noise-flow behavior. (Verifiable: orb shell appearance still follows existing controls after the material swap)
- [x] 5.3 Replace the charged blast projectile, trail, and ring materials with `CustomShaderMaterial` based on `THREE.MeshBasicMaterial`. (Verifiable: projectile, trail, and ring visuals no longer use raw `ShaderMaterial`)
- [x] 5.4 Adapt the charged blast projectile, trail, and ring shaders to CSM output variables while preserving release motion and timing behavior. (Verifiable: burst rings, projectile flight, and trail appearance still respond to the current props after the material swap)
- [x] 5.5 Preserve the current charged blast component prop surface and composed release-component contract. (Verifiable: no `dcsConfig` or public prop changes are required for the map-compatibility fix)

## 6. Validation

- [x] 6.1 Run a project build and capture any current repo or environment blockers encountered after the material swap. (Verifiable: build output is reviewed and the current blocker is documented if the build does not complete)
- [x] 6.2 Run lint for the touched scope if the repository setup supports it. (Verifiable: lint completes for the modified files or a repo limitation is documented)
- [ ] 6.3 Verify all target components in a map scene with `logarithmicDepthBuffer` enabled. (Verifiable: rectangle walls, smoke, shield, charge orb, charged blast rings, and charged blast projectile are no longer incorrectly occluded by the map layer)

Validation note:
`npm run build` reached `vite build` after `vue-tsc`, then stopped in the current environment with `memory allocation of 4483080 bytes failed`.
