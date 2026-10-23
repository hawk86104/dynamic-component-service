## ADDED Requirements

### Requirement: Data-driven segmented donut
The component SHALL render positive JSON values as proportional hollow sectors with separate heights, colors, rounded edges and luminous outlines. Zero values SHALL not create degenerate meshes.

#### Scenario: Reference-style data
- **WHEN** five positive values with yellow, grey, magenta, blue and green colors are provided
- **THEN** the component renders separated solid sectors on a circular plinth with a central opening and value-dependent heights

#### Scenario: Invalid or empty input
- **WHEN** malformed JSON, negative/nonfinite data, duplicate identifiers or an all-zero dataset is applied
- **THEN** the previous valid dataset remains visible and `data-error` reports the reason

### Requirement: Configurable service integration
The component SHALL expose matching defaults and controls for geometry, colors, labels, opacity, glow and stage options in `dcsConfig.ts`, without changing generic preview views.

#### Scenario: Reactive editing and cleanup
- **WHEN** valid JSON or style props change, or the component unmounts
- **THEN** affected objects are rebuilt or removed and superseded geometry, materials and textures are disposed
