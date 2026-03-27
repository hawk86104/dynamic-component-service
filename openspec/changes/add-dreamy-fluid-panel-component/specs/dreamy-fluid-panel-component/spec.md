## ADDED Requirements

### Requirement: Render a dreamy fluid panel in the three.js canvas pipeline
The system SHALL provide a shader-driven panel component that renders as a ground-friendly reflective surface inside the existing tresjs/three preview pipeline.

#### Scenario: Render default panel
- **WHEN** the component is rendered with default parameters
- **THEN** it MUST display a visible ground panel with repeating reflective cells
- **AND** it MUST render through three.js-side shader logic rather than DOM or CSS animation

### Requirement: Preserve the reference effect's reflective cell and wave behavior
The component MUST preserve shader-friendly equivalents of the reference demo's hex-like tiling, layered wave motion, per-cell shimmer variation, and tilt-based specular flashing.

#### Scenario: Show reflective wave motion
- **WHEN** the component animation is running
- **THEN** the panel MUST show shifting reflective flashes that respond to layered wave motion across the surface

#### Scenario: Show dense tiled cells
- **WHEN** the panel is visible
- **THEN** the surface MUST read as many small reflective cells instead of a single smooth color field

### Requirement: Exclude interaction-driven lighting from the first version
The first version MUST NOT implement pointer, touch, hover, or click-driven lighting behavior from the reference page.

#### Scenario: Ignore preview pointer activity
- **WHEN** a user moves or clicks the pointer in preview
- **THEN** the panel MUST continue its default autonomous animation without interaction-specific visual response

### Requirement: Support simplified tuning controls with safe bounds
The component MUST expose a simplified control set for panel length, panel width, cell density, cell size, wave speed, wave strength, shimmer speed, sparkle intensity, opacity, and core colors, and it MUST clamp invalid values to safe ranges.

#### Scenario: Adjust panel density and motion
- **WHEN** a developer changes panel dimensions, density, or motion-related props
- **THEN** the panel MUST update its visible size, cell packing, and motion tempo without requiring component remount

#### Scenario: Clamp invalid values
- **WHEN** a developer passes invalid or extreme numeric values
- **THEN** the component MUST clamp or fallback to safe values and continue rendering

### Requirement: Default to a ground-ready rectangular plane with independent dimensions
The component MUST use a plane geometry with independently configurable length and width, and default to a ground-friendly orientation appropriate for floor usage.

#### Scenario: Load default object transform
- **WHEN** the component is loaded from the service registry defaults
- **THEN** it MUST appear as a plane aligned for floor-like placement without requiring manual rotation to become usable

#### Scenario: Preserve cell proportions on a non-square panel
- **WHEN** a developer sets different values for panel length and panel width
- **THEN** the reflective cells and wave field MUST remain proportionally stable rather than appearing stretched by the changed aspect ratio

### Requirement: Keep shader source component-scoped and register through the service config
Shader source code MUST be stored under `src/shader/dreamyFluidPanelComponent/`, and the component MUST be available through `src/dcsConfig.ts` with usable defaults and config controls.

#### Scenario: Organize shader files
- **WHEN** the component introduces custom shader logic
- **THEN** the shader source MUST be read from component-scoped vertex and fragment files instead of inline shader strings

#### Scenario: Load from the component registry
- **WHEN** the dynamic component service loads its component list
- **THEN** the dreamy fluid panel component MUST be available without modifying generic preview view files
