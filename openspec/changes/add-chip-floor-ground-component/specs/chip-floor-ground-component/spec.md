## ADDED Requirements

### Requirement: Provide a new chip floor component in the three.js pipeline
The system SHALL provide a new shader-driven component that renders a floor-ready chip-surface effect inside the existing tresjs / three preview pipeline.

#### Scenario: Render the component with defaults
- **WHEN** the new component is rendered with default parameters
- **THEN** it MUST display a visible chip-floor effect on a circular ground footprint
- **AND** it MUST render through three.js shader logic rather than DOM or CSS effects

### Requirement: Preserve the reference shader language with minimal adaptation
The component MUST preserve shader-friendly equivalents of the reference source's chip split pattern, trench glow, moving data trails, neon particles, and silicon dot texture, while adapting the rendering to a top-down floor material driven by the outer scene camera.

#### Scenario: Show the reference-style motion
- **WHEN** the component animation is running
- **THEN** it MUST show trench glow, long data trails, and particle dots without requiring user input

#### Scenario: Avoid loose reinterpretation
- **WHEN** the component implementation is inspected
- **THEN** the core shader flow MUST remain recognizably derived from `chip-floor-codepen.js`
- **AND** large visual substitutions MUST NOT replace the supplied shader logic

### Requirement: Expose the remaining reference control groups
The component MUST expose the tunable values from the reference `Architecture`, `Silicon Texture`, `Data Trails (Long)`, `Neon Particles (Dots)`, and `Colors` groups, plus a service-level size control.

#### Scenario: Adjust service controls
- **WHEN** a developer changes size, architecture, silicon texture, trail, particle, or color props
- **THEN** the floor MUST update without requiring a remount

#### Scenario: Remove camera and performance controls from the exposed config
- **WHEN** a developer opens the service config panel for the component
- **THEN** the panel MUST NOT expose the reference `Camera & Zoom` controls
- **AND** the panel MUST NOT expose the reference `Quality & Performance` controls

#### Scenario: Let the service scene camera control the viewing angle
- **WHEN** the component is previewed or placed in a scene
- **THEN** the visible viewing angle MUST come from the outer tresjs scene camera
- **AND** the shader MUST NOT create its own internal camera flight view

### Requirement: Use a circular ground footprint with a soft disappearing boundary
The component MUST sit flat on the ground by default, appear as a circular floor surface, and fade toward transparency before the outer edge becomes visually hard.

#### Scenario: Place the component on the floor
- **WHEN** the service loads the component with its default object transform
- **THEN** it MUST sit in a ground-friendly orientation without extra preview wiring

#### Scenario: Fade the outer edge
- **WHEN** the chip-floor pattern reaches the outer area of the geometry
- **THEN** the visible color and alpha MUST soften toward transparency so the floor feels broader than a hard circular cutout

### Requirement: Clamp invalid values safely
The component MUST clamp or fallback invalid numeric and color inputs so the shader continues rendering.

#### Scenario: Pass extreme values
- **WHEN** a developer passes invalid or extreme values into the component props
- **THEN** the component MUST clamp them to safe ranges and keep rendering
