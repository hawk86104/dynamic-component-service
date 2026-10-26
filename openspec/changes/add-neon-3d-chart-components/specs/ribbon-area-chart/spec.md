## ADDED Requirements

### Requirement: Multi-series solid area ribbons
The component SHALL render each nonnegative series as a closed glass area ribbon on a common Y scale, separated along Z, with rounded shoulders, smooth roof normals, an independent three-stop roof gradient and a blue-violet side-wall gradient.

#### Scenario: Smooth reference chart
- **WHEN** two equally sampled series are applied with smoothing enabled
- **THEN** the chart displays two independent closed ribbons whose interpolation passes through samples without overshooting adjacent data values, with continuous roof normals and rounded roof-to-wall transitions that stay within the original width and height

#### Scenario: Degenerate and invalid data
- **WHEN** a single-category or all-zero valid dataset is supplied
- **THEN** geometry remains finite and displays a constant-height ribbon or baseline
- **WHEN** series lengths differ, values are negative/nonfinite or category/series limits are exceeded
- **THEN** the component retains previous valid data and emits `data-error`

### Requirement: Configurable chart presentation
The component SHALL expose data, global palette, per-series palette overrides, dimensions, series spacing, smoothing, bevel, opacity, reflection strength, roughness, side color, side gradient, side opacity, outlines and peak labels. Axes SHALL remain optional and default to false. The component SHALL NOT generate a stage, grid or back panel, or expose `showBase`, `showGrid`, `showBackPanel`, `baseColor` or `gridColor` as props, defaults or controls.

#### Scenario: Service registration
- **WHEN** the component is selected from the existing component catalog
- **THEN** usable defaults, matching parameter controls and an independent preview image are available without new infrastructure or remote resources

#### Scenario: Runtime material props survive development updates
- **WHEN** material controls or their defaults are updated during development
- **THEN** every configured field is explicitly declared as a runtime prop with a matching default, including bevel, reflection strength, roughness, side color, side gradient and side opacity
- **AND** those values reach the material when edited without missing-prop-default warnings or an undefined side color
- **AND** removed stage settings are absent from the runtime prop declaration

#### Scenario: Resource cleanup
- **WHEN** data or style changes or the component is removed
- **THEN** all replaced geometry, material and texture resources are released

### Requirement: Distinct frosted roof and translucent sides
The roof SHALL blend blue, cyan and yellow-green by default for the first series, and blue, lavender and coral for the second. Side walls SHALL use their own configurable color and vertical gradient relative to the local curve height, instead of copying the roof palette across the entire solid or replacing the selected RGB hue.

#### Scenario: Reflection and surface variation
- **WHEN** the chart uses default settings or its viewing angle changes
- **THEN** rounded lips and smooth curved roofs show softened studio reflections and fine frosted variation, while walls retain a darker transparent lower section and lighter upper section

#### Scenario: Matching gradient outlines
- **WHEN** outlines are visible
- **THEN** both roof edges follow the roof's three-stop palette with a pale highlight, rather than a single fixed white or green color

#### Scenario: Isolated chart body
- **WHEN** the chart loads with default settings
- **THEN** only the area bodies, gradient edge highlights and peak labels appear, starting at local y=0, without a base, floor grid, back panel or axis cards

#### Scenario: Independent side controls
- **WHEN** side color or gradient changes, with either value for the data-color toggle
- **THEN** the wall uses the selected RGB hue and gradient strength without altering the roof palette; zero gradient disables the vertical color fade
- **WHEN** overall opacity is 1 but side opacity is less than 1
- **THEN** the material remains transparent, does not write depth and preserves the side-opacity setting, with side opacity 0 producing no wall alpha
- **WHEN** both overall and side opacity are 1
- **THEN** the solid uses opaque rendering and depth writing

#### Scenario: The selected blue applies to the visible side wall
- **WHEN** side color is `#0033d8`, red or green and the chart is viewed from either side or an end cap
- **THEN** those faces use a dedicated native color material whose `color` equals the selected RGB, while the roof uses its own material
- **AND** side vertex gradients use neutral RGB factors and alpha only, so a white gradient cannot replace the selected hue
- **AND** ray intersections identify side walls and end caps with the side material, not just a correctly populated but unverified uniform
