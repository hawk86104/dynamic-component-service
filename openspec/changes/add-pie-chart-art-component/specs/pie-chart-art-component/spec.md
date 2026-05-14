## ADDED Requirements

### Requirement: Render a WebGL 3D pie chart

The system SHALL provide a `PieChartArt` dynamic component that renders an extruded beveled 3D pie chart using three.js WebGL-compatible APIs.

#### Scenario: Default render

- **GIVEN** the component is rendered with default props
- **WHEN** the host scene mounts it
- **THEN** it SHALL display the default Market Share dataset as multiple colored extruded pie slices with in-scene labels

#### Scenario: WebGL compatibility

- **GIVEN** the component builds its materials
- **WHEN** it renders the pie chart
- **THEN** it SHALL avoid WebGPU and TSL APIs and use WebGL-compatible three.js materials/shaders

### Requirement: JSON data updates rebuild the chart

The component SHALL accept chart data from JSON text and directly rebuild to the new slice layout when the JSON data changes.

#### Scenario: Valid JSON data

- **GIVEN** a user supplies valid JSON with slice labels and numeric values
- **WHEN** the JSON is applied
- **THEN** the component SHALL rebuild slice angles, heights, labels, and palette colors to match the new chart without per-frame geometry transition work

#### Scenario: Invalid JSON data

- **GIVEN** a user supplies invalid JSON
- **WHEN** the component attempts to parse it
- **THEN** it SHALL keep the previous chart data and log a scoped warning without throwing into the host scene

### Requirement: Limited requested controls

The component SHALL expose only the requested chart, gradient, material, and data JSON controls through `src/dcsConfig.ts`.

#### Scenario: Config controls are available

- **GIVEN** the dynamic component service reads `src/dcsConfig.ts`
- **WHEN** the `PieChartArt` config pane is built
- **THEN** it SHALL include Chart controls for height, radius, inner radius, gap, bevel, side segments, bevel segments, smooth shading, crease angle, and label font size
- **AND** it SHALL include Gradient controls for direction, from Y, to Y, curve power, and automatic color scheme
- **AND** it SHALL include Material controls for roughness, metalness, and environment map intensity

### Requirement: Component service integration

The component SHALL be registered through `src/dcsConfig.ts` without modifying generic preview infrastructure.

#### Scenario: Component appears in service list

- **GIVEN** the dynamic component service builds its component list
- **WHEN** the list includes registered components
- **THEN** `PieChartArt` SHALL be available with default props, default object transform, and preview metadata
