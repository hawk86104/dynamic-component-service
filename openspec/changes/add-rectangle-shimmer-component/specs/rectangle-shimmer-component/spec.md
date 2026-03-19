## ADDED Requirements

### Requirement: Support configurable 3D rectangle dimensions
The system SHALL provide a 3D rectangle component with configurable `length`, `width`, and `height`, where `height` defines the raised wall height from the base rectangle.

#### Scenario: Render with explicit dimensions
- **WHEN** a developer sets `length`, `width`, and `height`
- **THEN** the component MUST render four raised walls and a matching bottom perimeter path using those dimensions

#### Scenario: Render with default dimensions
- **WHEN** the component is rendered without dimension props
- **THEN** the component MUST render with default non-zero `length`, `width`, and `height`

### Requirement: Render wall color gradient from bottom to top
The four walls MUST render a vertical gradient from bottom to top and support opacity interpolation across that same direction.

#### Scenario: Apply custom wall gradient colors
- **WHEN** a developer sets wall bottom and top colors
- **THEN** each wall MUST show a continuous bottom-to-top gradient using those colors

#### Scenario: Keep gradient direction stable
- **WHEN** the component dimensions change
- **THEN** the gradient direction MUST remain bottom-dark to top-light on all four walls

#### Scenario: Apply opacity fade on walls
- **WHEN** a developer sets wall bottom opacity and wall top opacity
- **THEN** each wall MUST interpolate transparency from bottom to top while keeping the configured color gradient

#### Scenario: Configure gradient progress percentage
- **WHEN** a developer sets wall gradient progress between 0 and 100
- **THEN** the wall color and opacity transition MUST complete within the configured percentage of wall height

### Requirement: Provide perimeter animated Line2 effect on base rectangle
The base rectangle perimeter MUST support animated `Line2` flowing segments.

#### Scenario: Configure Line2 width and color
- **WHEN** a developer sets `lineWidth` and `lineColor`
- **THEN** the perimeter running line MUST render with the configured width and color in canvas

#### Scenario: Configure running speed
- **WHEN** a developer sets `lineSpeed`
- **THEN** the line flow movement MUST update at the configured speed

#### Scenario: Configure gradient length and segment count
- **WHEN** a developer sets `gradientLength` and `segmentCount`
- **THEN** the running line MUST reflect configured fade length and number of flowing line segments

### Requirement: Keep implementation in three.js canvas pipeline
The implementation MUST be based on tresjs/three rendering in canvas and MUST NOT rely on CSS animation for core visual behavior.

#### Scenario: Validate rendering path
- **WHEN** the component is used in project preview
- **THEN** all visual effects (walls gradient and perimeter line flow) MUST be produced by three.js materials/geometry in canvas

### Requirement: Store shader source as component-scoped files
Shader source code MUST be stored under `src/shader/<component-name>/` and separated into vertex and fragment files.

#### Scenario: Organize shader files
- **WHEN** the rectangle shimmer component introduces wall shaders
- **THEN** the shader source MUST be read from component-scoped vertex and fragment files instead of inline strings in the Vue component
