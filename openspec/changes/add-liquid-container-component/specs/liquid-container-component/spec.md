## ADDED Requirements

### Requirement: Support bounded container shape families
The system SHALL provide a 3D liquid container component that supports exactly the confirmed shape families: rectangular container, cylindrical container, and vase-shaped preset container.

#### Scenario: Render rectangular container
- **WHEN** a developer sets the shape type to the rectangular option with valid length, width, and height values
- **THEN** the component MUST render a visible rectangular container shell and internal liquid volume matching those dimensions

#### Scenario: Render cylindrical container
- **WHEN** a developer sets the shape type to the cylindrical option with valid radius and height values
- **THEN** the component MUST render a visible cylindrical container shell and internal liquid volume matching those dimensions

#### Scenario: Render vase preset container
- **WHEN** a developer sets the shape type to the vase preset option
- **THEN** the component MUST render a vase-like container and corresponding internal liquid geometry without requiring arbitrary freeform shape input

### Requirement: Control liquid fill level and wave motion
The component MUST expose liquid fill level and independent wave controls for speed, amplitude, and frequency.

#### Scenario: Update fill level
- **WHEN** a developer changes `fillLevel`
- **THEN** the visible liquid height MUST update without requiring the component to remount

#### Scenario: Increase wave speed
- **WHEN** a developer increases the wave speed parameter
- **THEN** the liquid surface motion MUST animate faster while preserving the same container shape

#### Scenario: Clamp unsafe wave values
- **WHEN** a developer passes invalid or extreme values for liquid height or wave motion parameters
- **THEN** the component MUST clamp or fallback to safe non-breaking values and continue rendering

### Requirement: Support liquid color gradient and density appearance
The component MUST support configurable liquid color appearance using gradient-oriented color controls and density-related visual strength.

#### Scenario: Apply liquid gradient colors
- **WHEN** a developer sets liquid base color and upper gradient color parameters
- **THEN** the liquid body MUST render with a visible color transition instead of a flat single-color fill

#### Scenario: Increase density appearance
- **WHEN** a developer increases the liquid density appearance parameter
- **THEN** the liquid body MUST appear visually fuller or heavier through stronger color/opacity response rather than requiring physical simulation

#### Scenario: Preserve three.js visual pipeline
- **WHEN** the component renders liquid color, density, and wave motion
- **THEN** those effects MUST be produced by three.js geometry, material, and shader logic in canvas instead of CSS animation

### Requirement: Support optional bubble layer inside the liquid
The component MUST support an optional bubble layer with configurable count, size range, randomness, and upward motion.

#### Scenario: Disable bubbles
- **WHEN** a developer turns off the bubble feature
- **THEN** the liquid MUST continue rendering without visible bubbles

#### Scenario: Enable bubbles with random size variation
- **WHEN** a developer enables bubbles and configures size randomness
- **THEN** visible bubbles MUST appear inside the liquid with non-uniform sizes within the configured range

#### Scenario: Animate bubble rise
- **WHEN** the bubble layer is enabled
- **THEN** bubbles MUST move upward over time within the liquid volume instead of remaining static

### Requirement: Support local shell clipping for interior reveal
The component MUST support local vertical clipping controls along the component's `X` and `Z` directions to adjust the visible range of the container shell.

#### Scenario: Reduce shell visibility along X
- **WHEN** a developer reduces the `clipX` parameter from its full-visibility default
- **THEN** the visible shell range MUST shrink along the component-local `X` direction so more of the interior can be observed

#### Scenario: Reduce shell visibility along Z
- **WHEN** a developer reduces the `clipZ` parameter from its full-visibility default
- **THEN** the visible shell range MUST shrink along the component-local `Z` direction so more of the interior can be observed

#### Scenario: Avoid preview infrastructure changes
- **WHEN** the clipping behavior is enabled for this component
- **THEN** it MUST be implemented within the component itself and remain available without modifying the generic preview view files

### Requirement: Organize implementation as a split plugin directory
The component implementation MUST be organized under a dedicated plugin directory in `src/components/`, while shader sources remain component-scoped under `src/shader/`.

#### Scenario: Resolve component entry from config
- **WHEN** the dynamic component service loads the liquid container component from `src/dcsConfig.ts`
- **THEN** the registered `comFile` MUST point to a component entry inside `src/components/<plugin-name>/` rather than a root-level single-file component

#### Scenario: Load externalized shader files
- **WHEN** the component uses custom shader logic for shell or liquid rendering
- **THEN** the shader source MUST be stored under `src/shader/liquidContainerComponent/` and separated into vertex and fragment files instead of inline shader strings

### Requirement: Register defaults and controls in service config
The component MUST be registered through `src/dcsConfig.ts` with usable defaults and configuration-panel controls for preview and publishing.

#### Scenario: Load component from registry
- **WHEN** the service loads its component list
- **THEN** the liquid container component MUST be available through `src/dcsConfig.ts` without requiring changes to the generic preview entry files

#### Scenario: Expose core controls in the config panel
- **WHEN** a user opens the component configuration panel
- **THEN** the panel MUST expose controls for at least shape type, container dimensions, fill level, wave controls, color appearance, density appearance, bubble settings, and shell clipping parameters
