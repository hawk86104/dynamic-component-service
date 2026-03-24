## ADDED Requirements

### Requirement: Provide a configurable bins container component
The system SHALL provide a `binsContainerComponent` that renders a drawer shell and its internal bins in the current Vue 3 + TresJS component service.

#### Scenario: Render the component with default settings
- **WHEN** the component is loaded from `src/dcsConfig.ts` with default props
- **THEN** it MUST render a visible drawer shell and at least one internal bin

#### Scenario: Keep the component within the default preview camera range
- **WHEN** drawer and bin values use millimeter-style defaults from the reference project
- **THEN** the component MUST still remain visible in the existing preview scene without modifying the shared preview views

### Requirement: Preserve reference drawer settings behavior
The component MUST preserve the functional meaning of the reference project's box settings.

#### Scenario: Update drawer dimensions
- **WHEN** a developer changes `width`, `height`, or `depth`
- **THEN** the drawer shell size and available bin layout area MUST update accordingly

### Requirement: Preserve reference bin settings behavior
The component MUST preserve the functional meaning of the reference project's bin settings.

#### Scenario: Update bin geometry settings
- **WHEN** a developer changes `radius` or `thickness`
- **THEN** each rendered bin MUST update its corner rounding and wall thickness representation

#### Scenario: Update layout spacing settings
- **WHEN** a developer changes `divideWidth`, `divideDepth`, `outerGap`, or `innerGap`
- **THEN** bin layout dimensions and spacing MUST update without breaking rendering

### Requirement: Preserve recursive and grid generation settings
The component MUST support both generation modes from the reference project.

#### Scenario: Use recursive generation
- **WHEN** `generationType` is set to `Recursive`
- **THEN** the component MUST generate bins using recursive subdivision controlled by `iterations`, `divideWidth`, and `divideDepth`

#### Scenario: Use grid generation
- **WHEN** `generationType` is set to `Grid`
- **THEN** the component MUST generate bins using row/column subdivision controlled by `rows` and `cols`

### Requirement: Support measurement visibility toggling
The component MUST support the reference project's measurement visibility behavior.

#### Scenario: Show measurements
- **WHEN** `showMeasurements` is `true`
- **THEN** the component MUST display width, height, and depth measurement labels around the drawer

#### Scenario: Hide measurements
- **WHEN** `showMeasurements` is `false`
- **THEN** the component MUST not render the measurement labels

### Requirement: Support index number visibility toggling
The component MUST support the reference project's index-number visibility behavior.

#### Scenario: Show index numbers
- **WHEN** `showIndexNumbers` is `true`
- **THEN** each rendered bin MUST display its layout index number

#### Scenario: Hide index numbers
- **WHEN** `showIndexNumbers` is `false`
- **THEN** no bin index labels MUST be rendered

### Requirement: Integrate through the shared component registration format
The component MUST follow the repository's unified dynamic-component configuration contract.

#### Scenario: Register without preview-entry customization
- **WHEN** the component is added to the service
- **THEN** it MUST be registered through `src/dcsConfig.ts` and MUST NOT require changes to `src/views/previewEntry.vue` or `src/views/templateComponet.vue`
