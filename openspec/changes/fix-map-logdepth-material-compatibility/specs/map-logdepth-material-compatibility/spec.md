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

### Requirement: Explicit shader wrapper dependencies must be declared
Any package imported directly by application source for shader compatibility MUST be declared as a direct dependency of the project.

#### Scenario: Import shader wrapper package from source
- **WHEN** a source file imports `three-custom-shader-material`
- **THEN** `package.json` MUST declare that package directly under project dependencies
