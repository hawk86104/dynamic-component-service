## ADDED Requirements

### Requirement: Provide a new vertigo halo component in the three.js pipeline
The system SHALL provide a new shader-driven component that renders a square halo-like tunnel surface inside the existing tresjs / three preview pipeline.

#### Scenario: Render the component with defaults
- **WHEN** the new component is rendered with default parameters
- **THEN** it MUST display a visible square plane with a tunnel-like ring structure
- **AND** it MUST render through three.js shader logic rather than DOM or CSS effects

### Requirement: Preserve the reference vertigo tunnel language without page interaction
The component MUST preserve shader-friendly equivalents of the reference page's polar tunnel depth, ring segmentation, angular slicing, layered pulse waves, flash highlights, and dark-to-warm palette transitions, while excluding page-level interaction behavior.

#### Scenario: Show autonomous pulse motion
- **WHEN** the component animation is running
- **THEN** the plane MUST show continuously moving ring pulses and highlight flashes without requiring any user input

#### Scenario: Ignore preview pointer activity
- **WHEN** a user moves, clicks, or drags the pointer in preview
- **THEN** the component MUST continue its autonomous animation without pointer-specific visual response

### Requirement: Use a square ground plane with safe controls
The component MUST use a square plane geometry, default to a ground-friendly orientation, fade the visible rings before the square boundary becomes visible, and expose safe controls for size, gradient speed, tunnel motion, density, glow, opacity, and palette.

#### Scenario: Adjust motion and density controls
- **WHEN** a developer changes size, gradient speed, tunnel speed, rotation speed, ring frequency, segment count, pulse intensity, flash intensity, edge glow, opacity, or color props
- **THEN** the plane MUST update without requiring a remount

#### Scenario: Fade rings before the square border appears
- **WHEN** the animated rings expand toward the outer area of the plane
- **THEN** they MUST fade out radially before the square outline becomes visible

#### Scenario: Use gradient speed as radial animation direction
- **WHEN** a developer sets `gradientSpeed` to a positive value
- **THEN** the rings MUST expand outward faster as the value increases
- **AND WHEN** `gradientSpeed` is negative
- **THEN** the rings MUST shrink inward faster as the magnitude increases

#### Scenario: Clamp invalid values
- **WHEN** a developer passes invalid or extreme numeric values
- **THEN** the component MUST clamp or fallback to safe values and continue rendering

### Requirement: Keep the implementation independent and component-scoped
The new component MUST be added as a separate registry entry with shader source stored under `src/shader/vertigoHaloComponent/`, without replacing or modifying existing panel components or generic preview infrastructure.

#### Scenario: Load the component registry
- **WHEN** the dynamic component service loads its configured components
- **THEN** the new `vertigoHaloComponent` MUST appear as a separate entry alongside existing components
