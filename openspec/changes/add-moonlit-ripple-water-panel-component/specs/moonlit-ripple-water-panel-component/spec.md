## ADDED Requirements

### Requirement: Render a moonlit ripple water panel inside the three.js canvas pipeline
The system SHALL provide a shader-driven moonlit water panel component that renders inside the existing tresjs/three preview pipeline.

#### Scenario: Render the default panel
- **WHEN** the component is rendered with default parameters
- **THEN** it MUST display a visible water-like surface with autonomous ripple motion
- **AND** it MUST render through three.js-side shader logic rather than DOM or CSS animation

### Requirement: Preserve the reference panel's moonlit water identity
The component MUST preserve shader-friendly equivalents of the reference effect's moon reflection, layered ripple motion, dark-water shading, and Fresnel-style edge response.

#### Scenario: Show autonomous moonlit ripple motion
- **WHEN** the component animation is running
- **THEN** the surface MUST show continuous ripple motion and a visible moonlit highlight without requiring user interaction

#### Scenario: Read as water rather than a generic glow plane
- **WHEN** the panel is visible in preview
- **THEN** the shading MUST communicate reflective water depth and edge lighting instead of a flat single-color surface

### Requirement: Preserve key public tuning controls from the reference
The component MUST expose shader-friendly controls for ripple speed, moon glow, camera tilt, and wave intensity, and it MUST update the rendered result without requiring a remount.

#### Scenario: Adjust the preserved reference-style controls
- **WHEN** a developer changes ripple speed, moon glow, camera tilt, or wave intensity
- **THEN** the visible motion, highlight emphasis, and perspective bias MUST update on the existing component instance

### Requirement: Exclude interaction-driven ripple behavior
The first version MUST NOT implement click, pointer, hover, drag, or touch-driven ripple behavior from the reference page.

#### Scenario: Ignore preview interaction
- **WHEN** a user moves, clicks, or drags in preview
- **THEN** the panel MUST continue its default autonomous animation without interaction-specific visual response

### Requirement: Default to a ground-ready square plane with safe parameter bounds
The component MUST use a square plane geometry controlled by a single size value, default to a floor-like orientation, and clamp invalid numeric values to safe ranges.

#### Scenario: Load the default square panel
- **WHEN** the component is loaded from the service registry defaults
- **THEN** it MUST appear aligned for ground placement without requiring manual rotation
- **AND** it MUST use equal surface dimensions rather than a rectangular default plane

#### Scenario: Clamp invalid values
- **WHEN** a developer passes invalid or extreme numeric values for size, ripple speed, moon glow, camera tilt, wave intensity, Fresnel strength, or opacity
- **THEN** the component MUST clamp or fallback to safe values and continue rendering

### Requirement: Keep shader source component-scoped and register through the service config
Shader source code MUST be stored under `src/shader/moonlitRippleWaterPanelComponent/`, and the component MUST be available through `src/dcsConfig.ts` with usable defaults, config controls, preview metadata, and default placement.

#### Scenario: Organize shader files
- **WHEN** the component introduces custom shader logic
- **THEN** the shader source MUST be read from component-scoped vertex and fragment files instead of inline shader strings

#### Scenario: Load from the component registry
- **WHEN** the dynamic component service loads its configured component list
- **THEN** the moonlit ripple water panel component MUST be available without modifying generic preview view files
