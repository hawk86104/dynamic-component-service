## ADDED Requirements

### Requirement: Multi-series solid area ribbons
The component SHALL render each nonnegative series as a solid area ribbon on a common Y scale, separated along Z, with a three-stop gradient and bright top outlines.

#### Scenario: Smooth reference chart
- **WHEN** two equally sampled series are applied with smoothing enabled
- **THEN** the chart displays two independent closed ribbons whose interpolation passes through samples without overshooting adjacent data values

#### Scenario: Degenerate and invalid data
- **WHEN** a single-category or all-zero valid dataset is supplied
- **THEN** geometry remains finite and displays a constant-height ribbon or baseline
- **WHEN** series lengths differ, values are negative/nonfinite or category/series limits are exceeded
- **THEN** the component retains previous valid data and emits `data-error`

### Requirement: Configurable chart presentation
The component SHALL expose data, global palette, per-series palette overrides, dimensions, series spacing, smoothing, opacity, outlines, peak labels, stage/grid and back panel controls.

#### Scenario: Service registration
- **WHEN** the component is selected from the existing component catalog
- **THEN** usable defaults, matching parameter controls and an independent preview image are available without new infrastructure or remote resources

#### Scenario: Resource cleanup
- **WHEN** data or style changes or the component is removed
- **THEN** all replaced geometry, material and texture resources are released
