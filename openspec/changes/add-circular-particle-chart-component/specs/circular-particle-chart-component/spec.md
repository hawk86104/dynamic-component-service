## ADDED Requirements

### Requirement: Render a circular dynamic particle chart

The system SHALL provide a `circularParticleChartComponent` dynamic component that renders a hollow-center circular particle chart through the existing Tres/three canvas pipeline and lies on the `XZ` plane by default.

#### Scenario: Default chart render

- **WHEN** the component is rendered with default props
- **THEN** it SHALL display a visible horizontal circular particle field with a hollow center, a reference-style scan surface, a double-line border, and center text
- **AND** it SHALL render through three.js objects and shaders rather than DOM or CSS animation
- **AND** it SHALL avoid adding a separate hard radial radar line over the scan surface

### Requirement: Support requested particle and scan controls

The component MUST expose particle size, particle color, and scan speed controls, and scan speed MUST accept values from `-1` to `1`.

#### Scenario: Positive and negative scan speed

- **WHEN** scan speed is positive or negative
- **THEN** the scanning motion SHALL rotate in opposite directions while keeping the particle field autonomous

#### Scenario: Zero scan speed

- **WHEN** scan speed is `0`
- **THEN** the scan position SHALL remain visible but stop advancing over time

#### Scenario: Particle settings update

- **WHEN** particle size or particle color changes
- **THEN** visible particle size and color SHALL update without requiring a remount

### Requirement: Support configurable center text

The component MUST expose title text, title size, unit text, unit size, and text color controls, and the text MUST render on planes parallel to the scan plane rather than camera-facing billboards.

#### Scenario: Text settings update

- **WHEN** title, unit, size, or text color values change
- **THEN** the center labels SHALL update in the scene and remain independent from scene lighting

#### Scenario: Text plane orientation

- **WHEN** the camera moves around the scene
- **THEN** the title and unit planes SHALL remain parallel to the circular scan surface instead of always facing the camera

### Requirement: Support double-line border width and color

The component MUST render a double circular border and expose a `line2` control that changes the visible border line thickness plus a `lineColor` control that changes only the border color.

#### Scenario: Adjust line2

- **WHEN** `line2` changes
- **THEN** the double circular border SHALL update its thickness while remaining aligned with the circular scan surface

#### Scenario: Adjust lineColor

- **WHEN** `lineColor` changes
- **THEN** the double circular border SHALL update color independently from particle color

### Requirement: Keep shader source scoped and service registration complete

Shader source code MUST be stored under `src/shader/circularParticleChartComponent/`, and the component MUST be available through `src/dcsConfig.ts` with usable defaults and config-panel controls.

#### Scenario: Component registry loads the chart

- **WHEN** the dynamic component service reads `src/dcsConfig.ts`
- **THEN** `circularParticleChartComponent` SHALL be available with defaults, default transform, preview metadata, and the requested controls including `line2` and `lineColor`

#### Scenario: Shader files are externalized

- **WHEN** the component creates its particle material
- **THEN** it SHALL import vertex and fragment shader source from component-scoped shader files
