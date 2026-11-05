## ADDED Requirements

### Requirement: Default attached fire

The component SHALL render burning procedural surface overlays on a subdivided cube when no model URL is supplied. The cube SHALL stand on local Y=0 and the effect SHALL follow the component's parent transforms.

#### Scenario: Default instantiation
- **WHEN** the component is mounted with defaults or its model URL is cleared
- **THEN** one cube with attached animated fire is displayed without requesting a model

### Requirement: Online model replacement

The component SHALL accept HTTP/HTTPS GLB/glTF URLs, retain source materials and hierarchy, fit the model to a configurable size, and attach fire to its meshes. Loading SHALL be per instance, reject stale results, and retain the displayed subject on errors. The component SHALL expose loading, loaded, and loadError events.

#### Scenario: Successful replacement
- **WHEN** a valid online model with accessible dependencies finishes loading
- **THEN** it replaces the previous subject, is centered and grounded, and receives attached fire

#### Scenario: Failed or superseded replacement
- **WHEN** loading fails or a newer URL replaces a pending request
- **THEN** the previous subject remains until a valid replacement is ready and a stale result is never installed

### Requirement: Component-owned configuration

The component SHALL expose burning and transition controls, playback, model size/visibility, flame deformation, procedural texture, and palette settings. Props and catalog defaults SHALL share one defaults module, and numeric inputs SHALL be bounded before use.

#### Scenario: Live tuning
- **WHEN** the host changes a flame, texture, color, playback, or burning parameter
- **THEN** the current effect updates without reloading the model

#### Scenario: Hidden source
- **WHEN** source visibility is disabled
- **THEN** source materials are hidden while attached flames remain renderable

### Requirement: External scene ownership

The component MUST NOT create a canvas, camera, controls, lights, ground plane, environment, or post-processing, nor change scene or renderer settings. Its panel MUST NOT expose those settings.

#### Scenario: Editor integration
- **WHEN** it is mounted in an existing Tres scene
- **THEN** it adds only its subject and flame overlays, leaving external scene configuration to the host

### Requirement: Service integration and cleanup

The component SHALL register through `src/dcsConfig.ts`, keep shaders under `src/shader/divineFireComponent/`, and leave the generic preview views unchanged. Replacements and unmount SHALL release owned render resources and pending work.

#### Scenario: Replacement or unmount
- **WHEN** the subject is replaced or the component is unmounted
- **THEN** obsolete overlays and source resources are disposed and obsolete requests cannot alter the component
