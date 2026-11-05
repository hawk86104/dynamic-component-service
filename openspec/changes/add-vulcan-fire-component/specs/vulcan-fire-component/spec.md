## ADDED Requirements

### Requirement: Provide an autonomous fire and smoke component
The service SHALL provide `vulcanFireComponent`, rendering camera-facing fire tongues and rising smoke through Three.js meshes with a local +Y emission direction and no DOM animation.

#### Scenario: Use the default component
- **WHEN** the component is mounted with default parameters
- **THEN** fire and smoke SHALL start in a warm state and animate without pointer input
- **AND** the default fire and smoke counts SHALL be 24 and 40 respectively

#### Scenario: Pause and resume
- **WHEN** `autoPlay` is disabled or `animationSpeed` is zero
- **THEN** particle ages, texture animation, and local light flicker SHALL stop advancing
- **AND** resuming SHALL continue without resetting the effect

### Requirement: Generate self-contained looping textures
Fire density SHALL use a locally generated, time-indexed single-channel 3D texture, and smoke SHALL use a locally generated 2D texture. The component MUST NOT require external runtime images or new dependencies.

#### Scenario: Tune the fire volume
- **WHEN** volume dimensions, octaves, frequency, turbulence, width, or seed change
- **THEN** the component SHALL debounce regeneration and replace the volume safely
- **AND** the previous texture SHALL be disposed

#### Scenario: Tune ordinary appearance
- **WHEN** colors, intensity, particle motion, or smoke opacity change
- **THEN** the effect SHALL update without regenerating the fire volume or remounting

### Requirement: Expose bounded reactive controls
All public props SHALL have synchronized component defaults, registry defaults, and configuration-panel controls. Numeric inputs MUST be finite and clamped, particle counts MUST be integers in the range 0–64, and reversed size bounds MUST be handled safely.

#### Scenario: Change counts or disable smoke
- **WHEN** counts change or smoke is disabled
- **THEN** the existing instanced meshes SHALL update their active instance counts without reallocating their particle buffers

#### Scenario: Pass invalid numbers
- **WHEN** a numeric prop is non-finite or out of bounds
- **THEN** it SHALL fall back to its default or be clamped before allocation or simulation

### Requirement: Integrate with shared 3D scene behavior
Particle centers SHALL follow parent transforms, billboard sizes SHALL honor parent scale magnitudes, and transparent particles SHALL sort from back to front within each layer using the active camera's world view. Transparent meshes MUST retain depth testing, disable depth writes, and include logarithmic-depth and clipping shader support.

#### Scenario: Transform or view the component
- **WHEN** its parent is moved, rotated, or scaled, or the active camera changes
- **THEN** particle centers SHALL follow that transform and the quads SHALL continue facing the active camera
- **AND** depth sorting SHALL use transformed positions rather than treating local coordinates as world coordinates

#### Scenario: Enable scene logarithmic depth
- **WHEN** the owning renderer enables logarithmic depth buffering
- **THEN** the custom shaders SHALL participate in its depth path without changing renderer configuration

### Requirement: Keep ownership and optional decoration local
Glow, ground, and fire lighting SHALL be individually configurable. The component MUST NOT create a scene canvas, camera, controls, global ambient light, or post-processing composer, and MUST dispose owned GPU resources and pending regeneration work on unmount.

#### Scenario: Remove decorations
- **WHEN** glow, ground, and light switches are disabled
- **THEN** only the configured fire and smoke layers SHALL remain visible

#### Scenario: Unmount during pending regeneration
- **WHEN** the component is unmounted
- **THEN** its regeneration timer SHALL be canceled and its textures, geometries, and materials SHALL be disposed

### Requirement: Register without changing generic preview infrastructure
The component SHALL be registered through `src/dcsConfig.ts`, with all GLSL stored in `src/shader/vulcanFireComponent/` and a valid local illustrative catalog asset.

#### Scenario: Discover and expose the component
- **WHEN** the service reads its component registry
- **THEN** `vulcanFireComponent` SHALL be available through the existing preview route and federation exposure map
- **AND** `src/views/previewEntry.vue` and `src/views/templateComponet.vue` MUST remain unchanged
