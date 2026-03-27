## ADDED Requirements

### Requirement: Provide a new ground mosaic component in the three.js pipeline
The system SHALL provide a new shader-driven component for a floor-ready square mosaic panel inside the existing tresjs/three preview pipeline.

#### Scenario: Render the new panel with defaults
- **WHEN** the new component is rendered with default parameters
- **THEN** it MUST display a visible square reflective ground panel
- **AND** it MUST render through three.js shader logic rather than DOM or CSS effects

### Requirement: Preserve the reference mosaic motion without interaction
The component MUST preserve shader-friendly equivalents of the reference page's tiled mosaic structure, directional wave flipping, shimmer variation, and specular flashing, while excluding interaction-driven effects.

#### Scenario: Show autonomous wave motion
- **WHEN** the component animation is running
- **THEN** the panel MUST show moving reflective flips and highlight sweeps across the surface

#### Scenario: Ignore preview pointer activity
- **WHEN** a user moves or clicks the pointer in preview
- **THEN** the panel MUST continue its autonomous animation without pointer-specific visual response

### Requirement: Use a square ground plane with safe controls
The component MUST use a square plane geometry, default to a ground-friendly orientation, and expose a simplified control set with safe bounds.

#### Scenario: Adjust panel controls
- **WHEN** a developer changes panel size, density, motion, sparkle, opacity, grout, or color props
- **THEN** the panel MUST update without requiring a remount

#### Scenario: Clamp invalid values
- **WHEN** a developer passes invalid or extreme numeric values
- **THEN** the component MUST clamp or fallback to safe values and continue rendering

### Requirement: Keep the new implementation independent from the existing dreamy fluid panel
The new component MUST be added as a separate component registration with component-scoped shader files, without replacing the existing `dreamyFluidPanelComponent`.

#### Scenario: Load the component registry
- **WHEN** the dynamic component service loads its configured components
- **THEN** both the existing dreamy fluid panel and the new mosaic ground panel MUST remain available as separate entries
