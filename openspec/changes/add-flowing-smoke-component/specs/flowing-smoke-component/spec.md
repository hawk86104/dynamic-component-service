## ADDED Requirements

### Requirement: Support directional flowing smoke emission
The system SHALL provide a 3D flowing smoke component that emits smoke continuously from a configurable origin and direction for exhaust-like scenes.

#### Scenario: Render default upward smoke plume
- **WHEN** the component is rendered with default parameters
- **THEN** it MUST display a visible non-zero smoke plume that flows upward continuously in canvas

#### Scenario: Render custom emission direction
- **WHEN** a developer sets a custom emission direction
- **THEN** the smoke flow MUST align with that direction so the component can represent scenes such as tailpipe exhaust

### Requirement: Control smoke flow rate and density
The component MUST expose independent controls for smoke flow rate and density.

#### Scenario: Increase flow rate
- **WHEN** a developer increases `flowRate`
- **THEN** smoke particles MUST advance faster along the emission path without requiring component remount

#### Scenario: Increase density
- **WHEN** a developer increases `density`
- **THEN** the visible smoke volume MUST become fuller by increasing active particle presence or equivalent visual density

#### Scenario: Clamp invalid values
- **WHEN** a developer passes invalid or extreme values for `flowRate` or `density`
- **THEN** the component MUST clamp or fallback to safe non-breaking values and continue rendering

### Requirement: Control smoke color and dissipation appearance
The component MUST support configurable smoke color and visually fade or dissipate over its lifetime.

#### Scenario: Apply custom smoke color
- **WHEN** a developer sets `color`
- **THEN** the smoke particles MUST render with the configured tint

#### Scenario: Fade over lifetime
- **WHEN** smoke particles move away from the emission origin over their lifetime
- **THEN** their opacity MUST decrease so the smoke visually dissipates instead of ending abruptly

#### Scenario: Expand over lifetime
- **WHEN** smoke particles progress through their lifetime
- **THEN** their apparent size or spread MUST increase to create a soft expanding plume

### Requirement: Support scene-specific spread behavior
The component MUST support configurable spread behavior so that narrow chimney smoke and wider vehicle exhaust can both be represented.

#### Scenario: Render narrow plume
- **WHEN** a developer configures a small spread value
- **THEN** the smoke plume MUST remain visually tighter around the main emission direction

#### Scenario: Render wide exhaust
- **WHEN** a developer configures a larger spread value
- **THEN** the smoke plume MUST disperse more broadly while preserving the main directional flow

### Requirement: Keep implementation in three.js canvas pipeline
The implementation MUST rely on tresjs/three rendering in canvas and MUST NOT use CSS animation for the core smoke behavior.

#### Scenario: Validate rendering path
- **WHEN** the component is loaded in the project preview pipeline
- **THEN** all smoke motion, spread, color, and dissipation effects MUST be produced by three.js materials, geometry, and shader logic in canvas

### Requirement: Store shader source as component-scoped files
Shader source code MUST be stored under `src/shader/flowingSmokeComponent/` and separated into vertex and fragment files.

#### Scenario: Organize shader files
- **WHEN** the flowing smoke component introduces custom shader logic
- **THEN** the shader source MUST be read from component-scoped vertex and fragment files instead of inline shader strings in the Vue component

### Requirement: Register component defaults and controls in service config
The component MUST be registered through `src/dcsConfig.ts` with usable defaults and parameter controls for preview and publishing.

#### Scenario: Load component from config registry
- **WHEN** the dynamic component service loads its component list
- **THEN** the flowing smoke component MUST be available through `src/dcsConfig.ts` without modifying the generic preview view files

#### Scenario: Adjust smoke parameters in config panel
- **WHEN** a user opens the component configuration panel
- **THEN** the panel MUST expose controls for at least flow rate, density, color, direction, and spread with usable defaults
