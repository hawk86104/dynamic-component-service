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

## 5. Validation

- [x] 5.1 Run a project build and fix any regressions introduced by the material swap. (Verifiable: `npm run build` succeeds)
- [x] 5.2 Run lint for the touched scope if the repository setup supports it. (Verifiable: lint completes for the modified files or a repo limitation is documented)
- [ ] 5.3 Verify all target components in a map scene with `logarithmicDepthBuffer` enabled. (Verifiable: rectangle walls, smoke, and shield are no longer incorrectly occluded by the map layer)
