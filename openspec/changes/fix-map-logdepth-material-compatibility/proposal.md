## Why

`rectangleShimmerComponent`, `flowingSmokeComponent`, `superEnergyShieldComponent`, `chargeOrbGatherComponent`, `chargedBlastRingsComponent`, and `chargedBlastProjectileComponent` currently rely on `ShaderMaterial` / `TresShaderMaterial`.
When they are rendered inside the GIS editor map scene with `renderer.logarithmicDepthBuffer = true`, the custom shader path does not participate in the built-in material depth pipeline as reliably as the standard material stack, so these effects can be incorrectly occluded by the map layer.

The repository already has a known workaround in downstream usage: wrap custom shader logic with `CustomShaderMaterial` and base it on built-in materials.
This change brings that compatibility strategy into the component implementations directly so these components behave correctly in map scenes without requiring editor-side patches.

## What Changes

- Replace the rectangle wall `TresShaderMaterial` implementation with `CustomShaderMaterial` based on `THREE.MeshBasicMaterial`.
- Replace the flowing smoke `THREE.ShaderMaterial` implementation with `CustomShaderMaterial` based on `THREE.PointsMaterial`.
- Replace the super energy shield `THREE.ShaderMaterial` implementation with `CustomShaderMaterial` based on `THREE.MeshBasicMaterial`.
- Replace the charged blast orb, projectile, trail, and ring shader materials with `CustomShaderMaterial` based on `THREE.MeshBasicMaterial`.
- Adapt all affected shaders to use CSM output variables while preserving their existing visual behavior and props surface.
- Declare `three-custom-shader-material` as a direct project dependency because the source code imports it explicitly.
- Add an OpenSpec record for the map/log-depth compatibility change, including rollback guidance.

## Capabilities

### Modified Capabilities
- `rectangle-shimmer-component`: wall rendering becomes compatible with map scenes that enable logarithmic depth buffering.
- `flowing-smoke-component`: smoke particle rendering becomes compatible with map scenes that enable logarithmic depth buffering.
- `super-energy-shield-component`: shield shell rendering becomes compatible with map scenes that enable logarithmic depth buffering.
- `charge-orb-gather-component`: orb shell rendering becomes compatible with map scenes that enable logarithmic depth buffering.
- `charged-blast-rings-component`: release ring rendering becomes compatible with map scenes that enable logarithmic depth buffering.
- `charged-blast-projectile-component`: projectile and trail rendering become compatible with map scenes that enable logarithmic depth buffering.

## Impact

- Affected code:
  - `src/components/rectangleShimmerComponent.vue`
  - `src/components/flowingSmokeComponent.vue`
  - `src/components/superEnergyShieldComponent.vue`
  - `src/components/chargeOrbGatherComponent.vue`
  - `src/components/chargedBlastRingsComponent.vue`
  - `src/components/chargedBlastProjectileComponent.vue`
  - `src/shader/rectangleShimmerComponent/`
  - `src/shader/flowingSmokeComponent/`
  - `src/shader/superEnergyShieldComponent/`
  - `src/shader/chargeOrbGatherComponent/`
  - `src/shader/chargedBlastRingsComponent/`
  - `src/shader/chargedBlastProjectileComponent/`
  - `package.json`
- APIs:
  - No public prop changes are required for any target component.
- Dependencies:
  - `three-custom-shader-material` becomes a direct dependency instead of an implicit transitive dependency.
- Systems:
  - Affects three.js / tresjs rendering in preview and downstream GIS map integration.
- Rollback strategy:
  - Revert the component material changes first.
  - Revert the shader CSM output variable changes second.
  - Remove the direct dependency declaration last if no remaining source file imports it.
