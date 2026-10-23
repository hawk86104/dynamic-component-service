## ADDED Requirements

### Requirement: Data-driven segmented donut
The component SHALL render positive JSON values as proportional hollow sectors with separate heights, colors, rounded edges and luminous outlines. Zero values SHALL not create degenerate meshes.

#### Scenario: Reference-style data
- **WHEN** five positive values with yellow, grey, magenta, blue and green colors are provided
- **THEN** the component renders separated glass sectors with a central opening and value-dependent heights, their bottoms at local y=0, without a plinth, ground plane or grid

#### Scenario: Invalid or empty input
- **WHEN** malformed JSON, negative/nonfinite data, duplicate identifiers or an all-zero dataset is applied
- **THEN** the previous valid dataset remains visible and `data-error` reports the reason

### Requirement: Configurable service integration
The component SHALL expose matching defaults and controls for geometry, colors, labels, opacity, glow, reflection strength and roughness in `dcsConfig.ts`, without changing generic preview views. The component SHALL NOT expose `showBase`, `showGrid`, `baseColor` or `gridColor` as props, defaults or controls.

#### Scenario: Reactive editing and cleanup
- **WHEN** valid JSON or style props change, or the component unmounts
- **THEN** affected objects are rebuilt or removed and superseded geometry, materials and textures are disposed

### Requirement: Reflective frosted glass presentation
The sectors SHALL combine view-dependent studio-style reflections, Fresnel edge highlights, translucent front and back surfaces, thickness tint and fine frosted surface variation. Reflection intensity and roughness SHALL be independently configurable without external textures, host lights, scene capture or post-processing.

#### Scenario: Default glass appearance
- **WHEN** the chart uses its default material settings
- **THEN** the material uses transparency, back-before-front double-sided drawing and smooth bevel normals, with stronger edge opacity, softened white reflections and subdued back surfaces

#### Scenario: Surface controls and opaque fallback
- **WHEN** reflection strength or roughness changes
- **THEN** the shader updates the reflection intensity or softness and frosted grain respectively, while preserving chart colors and geometry
- **WHEN** opacity is set to 1
- **THEN** sectors become fully opaque and use front faces with depth writing
