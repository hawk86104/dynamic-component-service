## ADDED Requirements

### Requirement: Provide a reusable advanced dynamic grass component

The system SHALL provide an `advancedDynamicGrassComponent` that renders generated terrain, instanced grass blades, wind animation, and optional wildflowers through the existing tresjs/three pipeline.

#### Scenario: Render the default meadow

- **WHEN** the component is mounted with its default props
- **THEN** it MUST display a generated ground surface covered by animated instanced grass
- **AND** it MUST be transformable by the parent scene as one normal object hierarchy

### Requirement: Preserve deterministic terrain and vegetation

The component SHALL use seeded procedural generation for terrain shape, grass placement, and wildflower placement.

#### Scenario: Recreate the same seeded meadow

- **WHEN** two component instances use the same structural parameters and seed
- **THEN** their terrain shape and vegetation placement MUST match

#### Scenario: Change the seed

- **WHEN** the seed prop changes
- **THEN** the component MUST rebuild the generated terrain and vegetation with a different deterministic layout

### Requirement: Expose component-scoped settings

The component SHALL expose terrain size and detail, grass density and blade dimensions, wind behavior, meadow colors and brightness, and wildflower settings through component props and `src/dcsConfig.ts`.

#### Scenario: Adjust a structural setting

- **WHEN** terrain, seed, density, blade-size, or wildflower structure props change
- **THEN** the affected meadow resources MUST rebuild with the new setting

#### Scenario: Adjust wind or appearance

- **WHEN** wind, brightness, or grass color props change
- **THEN** the visible meadow MUST update without requiring a full component remount

### Requirement: Exclude scene-level demo configuration

The component MUST NOT create or expose a camera, renderer, OrbitControls, background, environment map, hemisphere light, directional Sun, GUI, statistics, or demo reset control.

#### Scenario: Add the component to the regional scene editor

- **WHEN** the component is loaded inside a host scene
- **THEN** the host scene MUST retain ownership of its camera, lighting, background, environment, renderer, and controls
- **AND** the component config panel MUST NOT contain Sun, background, environment, or camera parameters

### Requirement: Keep all component shaders external

Grass and wildflower shader sources MUST live in separate vertex and fragment files under `src/shader/advancedDynamicGrassComponent/`.

#### Scenario: Inspect the component implementation

- **WHEN** a maintainer reviews the Vue and helper files
- **THEN** long GLSL programs MUST NOT be embedded inline

### Requirement: Manage resources safely

The component SHALL dispose all owned generated geometry, material, texture, and instanced mesh resources when rebuilt or unmounted.

#### Scenario: Change a structural prop repeatedly

- **WHEN** the component rebuilds multiple times
- **THEN** superseded meadow resources MUST be removed and disposed before they are abandoned

#### Scenario: Unmount the component

- **WHEN** the component leaves the scene
- **THEN** its animation scheduling MUST stop and all owned GPU resources MUST be disposed

### Requirement: Preserve upstream attribution

The port SHALL include the upstream MIT copyright and permission notice.

#### Scenario: Inspect third-party notices

- **WHEN** a maintainer audits the component source
- **THEN** the origin repository and MIT license notice MUST be present
