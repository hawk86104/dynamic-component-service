## ADDED Requirements

### Requirement: Load online GLB and handle superseded work
The component SHALL accept a required HTTP/HTTPS modelUrl, support URL changes, and ensure that only the latest request can mount a model.

#### Scenario: Load the example model
- **WHEN** a permitted URL points to a Draco or Meshopt compressed GLB
- **THEN** the component MUST load and attach its original node hierarchy using the existing host TresCanvas

#### Scenario: URL changes or component unmounts during parsing
- **WHEN** asynchronous loading is superseded or the component is unmounted
- **THEN** abortable requests MUST be cancelled and late parsed results MUST be disposed without mounting

### Requirement: Preserve original model appearance
The component SHALL use owned runtime materials and edge overlays without modifying the source GLB or discarding original mesh nodes.

#### Scenario: Toggle styling off and on
- **WHEN** enabled changes to false and back to true
- **THEN** original mesh materials MUST be restored and styled materials MUST be reapplied without reloading the GLB

### Requirement: Support all requested parameters and distinct styles
The component SHALL provide modelUrl, enabled, stylePreset, surfaceColor, surfaceOpacity, showEdges, edgeColor, edgeOpacity, edgeThreshold, emissiveColor and emissiveIntensity.

#### Scenario: Update material parameters
- **WHEN** color, opacity or emissive parameters change
- **THEN** existing material properties MUST update without a model reload or edge reconstruction

#### Scenario: Change preset or threshold
- **WHEN** ISO-GLOW, blueprint or X-Ray is selected
- **THEN** the selected contour/rim, hatched/hidden-line or Fresnel-shell behavior MUST apply within the component without overwriting explicit caller parameters or reloading the model
- **WHEN** edgeThreshold changes
- **THEN** structural edges MUST be rebuilt at the new angle without replacing original mesh geometry

#### Scenario: Distinguish styles with the same input colors
- **WHEN** the preset changes while color, opacity and emissive props remain identical
- **THEN** ISO-GLOW MUST use tonal solid surfaces with fine contours and restrained rim/emissive accents
- **AND** blueprint MUST use hatched surfaces with solid visible edges and dashed occluded structure instead of triangle wireframe
- **AND** X-Ray MUST use view-dependent transparent shells with brighter grazing angles and visible internal structure without writing depth
- **AND** showEdges MUST hide all structural lines, contours and hidden dashed lines when false

#### Scenario: Preserve curved and transparent silhouettes
- **WHEN** the model contains smooth curved opaque parts, cutout materials or transparent glass
- **THEN** ISO-GLOW MUST supplement crease edges with pixel-sized contours on opaque parts
- **AND** alpha textures MUST retain their coverage without tinting the styled surface with their original RGB
- **AND** transparent or cutout materials MUST NOT receive an opaque back-face contour shell

### Requirement: Release owned resources and control edge extraction cost
The runtime MUST release its overlays, materials, geometries, textures, skeleton resources and decoder workers while preserving resources during disabled styling.

#### Scenario: Shared geometry and repeated disposal
- **WHEN** several meshes share geometry or material resources and the runtime is disposed
- **THEN** shared resources MUST be disposed once and repeat disposal MUST be harmless

#### Scenario: Repeated threshold adjustments
- **WHEN** the threshold is changed rapidly
- **THEN** pending extraction MUST be superseded and only the latest threshold cache MUST remain owned

### Requirement: Keep scene infrastructure outside the component
The component MUST NOT create a TresCanvas, renderer, camera, controls, scene lights, ground helpers or Bloom.

#### Scenario: Load in an existing TvT.js scene
- **WHEN** the registered remote component is mounted in a host TresCanvas
- **THEN** its own materials and edge structure MUST operate independently of the shared preview page
