## ADDED Requirements

### Requirement: Render an electric ripple panel inside the three.js canvas pipeline
The system SHALL provide a shader-driven electric ripple panel component that renders as a floor-ready surface inside the existing tresjs/three preview pipeline.

#### Scenario: Render the default panel
- **WHEN** the component is rendered with default parameters
- **THEN** it MUST display a visible ground panel with autonomous ripple motion
- **AND** it MUST render through three.js-side shader logic rather than DOM or CSS animation

### Requirement: Preserve pulse-driven ripple behavior from the reference demo
The component MUST preserve shader-friendly equivalents of the reference demo's pulse envelope, layered concentric ripples, standing wave contribution, and highlight-heavy material response.

#### Scenario: Show autonomous pulse motion
- **WHEN** the component animation is running
- **THEN** the panel MUST show recurring pulse-driven ripple motion without requiring user interaction

#### Scenario: Show patterned conductive detail
- **WHEN** the panel is visible
- **THEN** the surface MUST read as a patterned conductive panel rather than a flat single-color plane

### Requirement: Exclude interaction-driven ripple sources
The first version MUST NOT implement pointer, mouse, click, hover, or touch-driven ripple behavior from the reference page.

#### Scenario: Ignore preview pointer activity
- **WHEN** a user moves or clicks the pointer in preview
- **THEN** the panel MUST continue its default autonomous animation without interaction-specific visual response

### Requirement: Support safe panel tuning controls
The component MUST expose controls for panel length, panel width, grid density, wire width, pulse frequency, pulse strength, ripple scale, flow speed, shimmer strength, opacity, and core colors, and it MUST clamp invalid values to safe ranges.

#### Scenario: Adjust ripple and panel settings
- **WHEN** a developer changes dimensions or motion-related props
- **THEN** the panel MUST update its visible size, surface detail, and animation tempo without requiring a remount

#### Scenario: Clamp invalid values
- **WHEN** a developer passes invalid or extreme numeric values
- **THEN** the component MUST clamp or fallback to safe values and continue rendering

### Requirement: Keep shader source component-scoped and register through the service config
Shader source code MUST be stored under `src/shader/currentRipplePanelComponent/`, and the component MUST be available through `src/dcsConfig.ts` with usable defaults, default placement, and config controls.

#### Scenario: Organize shader files
- **WHEN** the component introduces custom shader logic
- **THEN** the shader source MUST be read from component-scoped vertex and fragment files instead of inline shader strings

#### Scenario: Load from the component registry
- **WHEN** the dynamic component service loads its configured component list
- **THEN** the electric ripple panel component MUST be available without modifying generic preview view files
