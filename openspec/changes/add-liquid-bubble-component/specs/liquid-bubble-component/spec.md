## ADDED Requirements

### Requirement: Render a standalone liquid bubble mass
The system SHALL provide a 3D liquid bubble component that renders as a standalone liquid body with internal bubbles, without relying on an outer container shell or liquid wave simulation.

#### Scenario: Render default liquid bubble component
- **WHEN** the component is rendered with default parameters
- **THEN** it MUST display a visible liquid body with internal bubbles
- **AND** it MUST NOT require a separate outer shell mesh to read as complete
- **AND** its top surface MUST remain visually stable instead of animating as a wave

### Requirement: Support rectangular and cylindrical liquid volumes
The component MUST support rectangular and cylindrical liquid body shapes through the same integration entry.

#### Scenario: Render rectangular liquid volume
- **WHEN** a developer selects the rectangular shape mode
- **THEN** the liquid body MUST render as a box-like volume and keep bubbles constrained within that volume

#### Scenario: Render cylindrical liquid volume
- **WHEN** a developer selects the cylindrical shape mode
- **THEN** the liquid body MUST render as a cylinder-like volume and keep bubbles constrained within that volume

### Requirement: Animate bubbles with bottom-origin rise behavior
The component MUST reproduce the reference fizz rhythm by animating bubbles that originate near the bottom region, rise upward, drift slightly, and recycle continuously.

#### Scenario: Show clustered bottom-origin bubbling
- **WHEN** the component is rendered with bubbling enabled by default
- **THEN** bubbles MUST appear to emerge from several lower-region nucleation-like areas instead of an entirely uniform spawn field

#### Scenario: Recycle bubbles after top fade
- **WHEN** a bubble reaches the upper fade region
- **THEN** it MUST fade out and re-enter the lifecycle from the lower region without requiring component remount

### Requirement: Preserve shader-friendly versions of the reference bubble cues
The component MUST express the reference bubble feel through shader-friendly equivalents of size variance, subtle wobble, slight growth over lifetime, and bright edge/highlight cues.

#### Scenario: Vary bubble size and motion
- **WHEN** the bubble system is running
- **THEN** visible bubbles MUST not all share the exact same size, speed, or horizontal drift pattern

#### Scenario: Render bubble highlight cues
- **WHEN** a bubble is visible on screen
- **THEN** its rendered appearance MUST include more than a flat solid disc, such as a rim, highlight, or soft inner fill that suggests refraction

### Requirement: Exclude interactive and burst effects from the first version
The first version MUST not implement click-driven spawning, cursor-driven disturbance, sparkle bursts, or page-level ambient effect layers from the reference demo.

#### Scenario: Ignore pointer interaction
- **WHEN** a user moves or clicks the pointer in preview
- **THEN** the component MUST continue its default bubbling behavior without creating interaction-specific particles or burst effects

### Requirement: Expose simplified tuning controls with safe bounds
The component MUST expose a simplified control set for shape, size, liquid color, opacity, bubble count, bubble speed, bubble size, and bubble spread, and it MUST clamp invalid values to safe non-breaking ranges.

#### Scenario: Adjust bubble density and speed
- **WHEN** a developer updates `bubbleCount` or `bubbleSpeed`
- **THEN** the visible bubbling density or rise tempo MUST change without requiring component remount

#### Scenario: Clamp invalid values
- **WHEN** a developer passes invalid or extreme values for key numeric props
- **THEN** the component MUST clamp or fallback to safe values and continue rendering

### Requirement: Keep implementation inside the three.js canvas pipeline
The component MUST implement its liquid and bubble behavior through tresjs/three geometry, materials, and shader logic in canvas.

#### Scenario: Validate rendering path
- **WHEN** the component is loaded through the project preview pipeline
- **THEN** all liquid shading and bubble motion MUST be produced by three.js-side rendering logic rather than DOM or CSS animation

### Requirement: Store shader source in component-scoped files and register the component in service config
Shader source code MUST be stored under `src/shader/liquidBubbleComponent/`, and the component MUST be registered through `src/dcsConfig.ts` with usable defaults and configuration controls.

#### Scenario: Organize shader files
- **WHEN** the liquid bubble component introduces custom shader logic
- **THEN** the shader source MUST be read from component-scoped vertex and fragment files instead of inline shader strings in the Vue component

#### Scenario: Load component from config registry
- **WHEN** the dynamic component service loads its component list
- **THEN** the liquid bubble component MUST be available through `src/dcsConfig.ts` without modifying the generic preview view files
