## ADDED Requirements

### Requirement: Render a rain-on-glass material on a square three.js plane
The system SHALL provide a shader-driven rain-on-glass material component that renders on a double-sided square plane inside the existing tresjs / three preview pipeline.

#### Scenario: Render the default component
- **WHEN** the component is rendered with default parameters
- **THEN** it MUST display visible animated droplets and glass refraction on a square plane
- **AND** it MUST render through the three.js material pipeline rather than a fullscreen DOM canvas overlay

### Requirement: Preserve reference-style rain and refraction tuning
The component MUST preserve configurable tuning for the core rain-system and refraction behavior from the reference port, including rain amount, refraction strength, drop radius range, droplet spawn rate, trail rate, collision tuning, brightness, and alpha shaping.

#### Scenario: Adjust rain controls
- **WHEN** a developer changes rain-system props
- **THEN** the visible droplet density, size behavior, and motion MUST update without requiring a remount

#### Scenario: Adjust refraction controls
- **WHEN** a developer changes shader-composite props such as refraction, brightness, or alpha shaping
- **THEN** the glass response MUST update on the rendered plane

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
