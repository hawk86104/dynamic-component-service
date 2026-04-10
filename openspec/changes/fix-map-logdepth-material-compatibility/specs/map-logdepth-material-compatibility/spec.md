## ADDED Requirements

### Requirement: Rectangle shimmer walls must remain compatible with logarithmic depth map scenes
The rectangle shimmer wall material pipeline MUST remain visible and render correctly in scenes where the renderer enables `logarithmicDepthBuffer`.

#### Scenario: Render rectangle shimmer walls on a map scene
- **WHEN** `rectangleShimmerComponent` is rendered in a scene that enables `renderer.logarithmicDepthBuffer`
- **THEN** the wall effect MUST render through a built-in-material-compatible shader path instead of relying on raw `TresShaderMaterial`

#### Scenario: Preserve rectangle wall appearance after compatibility fix
- **WHEN** a developer adjusts wall colors, opacities, height, and gradient progress
- **THEN** the walls MUST keep the same bottom-to-top gradient behavior after the compatibility change

### Requirement: Flowing smoke particles must remain compatible with logarithmic depth map scenes
The flowing smoke particle material pipeline MUST remain visible and render correctly in scenes where the renderer enables `logarithmicDepthBuffer`.

#### Scenario: Render flowing smoke on a map scene
- **WHEN** `flowingSmokeComponent` is rendered in a scene that enables `renderer.logarithmicDepthBuffer`
- **THEN** the smoke effect MUST render through a built-in-material-compatible shader path instead of relying on raw `ShaderMaterial`

#### Scenario: Preserve smoke motion after compatibility fix
- **WHEN** a developer adjusts density, direction, flow rate, spread, opacity, particle size, and life range
- **THEN** the smoke effect MUST preserve the existing motion, dissipation, and size behavior after the compatibility change

### Requirement: Super energy shield shell must remain compatible with logarithmic depth map scenes
The super energy shield material pipeline MUST remain visible and render correctly in scenes where the renderer enables `logarithmicDepthBuffer`.

#### Scenario: Render super energy shield on a map scene
- **WHEN** `superEnergyShieldComponent` is rendered in a scene that enables `renderer.logarithmicDepthBuffer`
- **THEN** the shield effect MUST render through a built-in-material-compatible shader path instead of relying on raw `ShaderMaterial`

#### Scenario: Preserve shield controls after compatibility fix
- **WHEN** a developer adjusts shield color, opacity, fresnel, noise, flow, hex, and hit-wave parameters
- **THEN** the shield effect MUST preserve the existing controls and exposed impact-registration behavior after the compatibility change

### Requirement: Charged orb gather shells must remain compatible with logarithmic depth map scenes
The charged orb gather material pipeline MUST remain visible and render correctly in scenes where the renderer enables `logarithmicDepthBuffer`.

#### Scenario: Render charged orb gather in a map scene
- **WHEN** `chargeOrbGatherComponent` is rendered in a scene that enables `renderer.logarithmicDepthBuffer`
- **THEN** the orb shell effect MUST render through a built-in-material-compatible shader path instead of relying on raw `ShaderMaterial`

#### Scenario: Preserve charged orb gather controls after compatibility fix
- **WHEN** a developer adjusts glow, fresnel, noise-flow, and charge-progress related parameters
- **THEN** the orb shell effect MUST preserve the existing orb scale, color, and gather-particle behavior after the compatibility change

### Requirement: Charged blast release rings must remain compatible with logarithmic depth map scenes
The charged blast release ring material pipeline MUST remain visible and render correctly in scenes where the renderer enables `logarithmicDepthBuffer`.

#### Scenario: Render charged blast release rings on a map scene
- **WHEN** `chargedBlastRingsComponent` is rendered in a scene that enables `renderer.logarithmicDepthBuffer`
- **THEN** the ring effect MUST render through a built-in-material-compatible shader path instead of relying on raw `ShaderMaterial`

#### Scenario: Preserve charged blast ring behavior after compatibility fix
- **WHEN** a developer adjusts ring count, interval, lifetime, radius, gradient, direction, and speed parameters
- **THEN** the ring burst effect MUST preserve the existing instanced expansion and carrier-following behavior after the compatibility change

### Requirement: Charged blast projectile shells must remain compatible with logarithmic depth map scenes
The charged blast projectile and trail material pipelines MUST remain visible and render correctly in scenes where the renderer enables `logarithmicDepthBuffer`.

#### Scenario: Render charged blast projectile on a map scene
- **WHEN** `chargedBlastProjectileComponent` is rendered in a scene that enables `renderer.logarithmicDepthBuffer`
- **THEN** the projectile and trail effects MUST render through a built-in-material-compatible shader path instead of relying on raw `ShaderMaterial`

#### Scenario: Preserve charged blast projectile controls after compatibility fix
- **WHEN** a developer adjusts projectile colors, fresnel, pulse, trail, direction, and fire-speed parameters
- **THEN** the projectile effect MUST preserve the existing flight, pulse, and trail behavior after the compatibility change

### Requirement: Explicit shader wrapper dependencies must be declared
Any package imported directly by application source for shader compatibility MUST be declared as a direct dependency of the project.

#### Scenario: Import shader wrapper package from source
- **WHEN** a source file imports `three-custom-shader-material`
- **THEN** `package.json` MUST declare that package directly under project dependencies
