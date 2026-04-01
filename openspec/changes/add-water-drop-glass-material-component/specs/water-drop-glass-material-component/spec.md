## ADDED Requirements

### Requirement: Render a rain-on-glass material on a physical glass volume
The system SHALL provide a rain-on-glass material component that renders on a configurable glass volume inside the existing tresjs / three preview pipeline.

#### Scenario: Render the default component
- **WHEN** the component is rendered with default parameters
- **THEN** it MUST display visible animated droplets on a transparent glass body with adjustable length, width, and thickness
- **AND** it MUST render through the three.js material pipeline rather than a fullscreen DOM canvas overlay

### Requirement: Use actual scene glass instead of a fake backdrop
The component MUST let viewers see the real preview scene behind the glass, rather than relying on a self-generated faux background for the final visible result.

#### Scenario: View objects through the glass
- **WHEN** the component is placed between the camera and scene helpers or other objects
- **THEN** the viewer MUST be able to see those scene elements through the glass material

### Requirement: Preserve reference-style rain tuning while exposing physical glass controls
The component MUST preserve configurable tuning for the core rain-system behavior from the reference port, while also exposing physical glass controls such as transmission, IOR, roughness, clearcoat, attenuation distance, and rain normal strength.

#### Scenario: Adjust rain controls
- **WHEN** a developer changes rain-system props
- **THEN** the visible droplet density, size behavior, and motion MUST update without requiring a remount

#### Scenario: Adjust glass controls
- **WHEN** a developer changes the physical glass props
- **THEN** the glass transmission, thickness feel, and droplet distortion response MUST update on the rendered component

### Requirement: Exclude standalone page interaction logic
The first version MUST NOT implement the reference page's `postMessage` control channel, fullscreen canvas ownership, or click / touch splash behavior.

#### Scenario: Ignore preview pointer activity
- **WHEN** a user moves or clicks the pointer in preview
- **THEN** the component MUST continue its autonomous animation without interaction-specific splashes or event-driven ripple behavior

### Requirement: Support safe, service-ready parameter clamping
The component MUST clamp invalid or extreme numeric values to safe ranges and continue rendering.

#### Scenario: Clamp invalid values
- **WHEN** a developer passes invalid or out-of-range numeric props
- **THEN** the component MUST fallback or clamp to safe values rather than failing to render

### Requirement: Keep implementation component-scoped and registered through the service config
The helper logic MUST live under `src/components/waterDropGlassMaterialComponent/`, shader source MUST be stored under `src/shader/waterDropGlassMaterialComponent/`, and the component MUST be exposed through `src/dcsConfig.ts` without modifying the generic preview views.

#### Scenario: Load from the component registry
- **WHEN** the dynamic component service loads its configured component list
- **THEN** the rain-on-glass component MUST be available through the standard registry path and preview metadata
