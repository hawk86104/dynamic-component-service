## ADDED Requirements

### Requirement: Provide a reusable GNM Head scene component

The system SHALL provide a `gnmHeadComponent` that loads and renders a parametric GNM Head through the existing tresjs/Three.js pipeline without requiring a backend service.

#### Scenario: Render the default head

- **WHEN** the component is mounted with its default props
- **THEN** it MUST load the configured GNM head container in the browser
- **AND** it MUST first display the neutral head as one transformable object hierarchy
- **AND** it MUST apply the registered semantic defaults when the sampler becomes ready

### Requirement: Keep dynamic import responsive while loading large resources

The component SHALL NOT fetch either GNM binary container at module evaluation time, SHALL mount without waiting for the binary download, and SHALL show an owned lightweight Three.js loading placeholder until the main head becomes renderable.

#### Scenario: Register the component without mounting it

- **WHEN** the service discovers or imports the component module
- **THEN** no GNM binary request MUST start

#### Scenario: Mount while the main model is uncached

- **WHEN** the component mounts and `gnm_head_web.bin` is not cached
- **THEN** the component module and instance MUST become available without waiting for the model download
- **AND** a loading placeholder MUST be renderable while download progress is reported
- **AND** the main head request MUST begin only after mount

### Requirement: Stage the two binary downloads

The component SHALL load the main head container before the semantic sampler container.

#### Scenario: Main model becomes ready

- **WHEN** `gnm_head_web.bin` has loaded and parsed successfully
- **THEN** the neutral mesh MUST become renderable without waiting for `gnm_samplers_web.bin`
- **AND** the main-model loading placeholder MUST be removed and disposed
- **AND** semantic sampler loading MUST continue separately

### Requirement: Expose compact deterministic parameters

The component SHALL expose resource URLs, identity seed and strength, expression seed/class and strength, basic pose, material, skin opacity, and non-skin anatomical visibility props through both the Vue component and `src/dcsConfig.ts`.

#### Scenario: Use default semantic strengths

- **WHEN** the component mounts with its registered defaults
- **THEN** identity strength MUST be `0.58`
- **AND** expression strength MUST be `0.68`

#### Scenario: Change identity settings

- **WHEN** identity seed or strength changes after the semantic sampler is ready
- **THEN** the head identity MUST update deterministically

#### Scenario: Change expression settings

- **WHEN** expression seed, class, or strength changes after the semantic sampler is ready
- **THEN** the head expression MUST update deterministically

#### Scenario: Restore neutral semantics

- **WHEN** identity or expression strength is zero
- **THEN** the corresponding GNM parameter vector MUST be reset to zero

#### Scenario: Change basic pose

- **WHEN** head or eye rotation props change
- **THEN** the component MUST update the GNM joint pose without remounting

#### Scenario: Change skin opacity

- **WHEN** `skinOpacity` changes
- **THEN** only skin triangles MUST change opacity
- **AND** eyes, teeth, gums, and tongue MUST remain opaque

### Requirement: Keep scene ownership outside the component

The component MUST NOT create or expose a renderer, camera, controls, background, environment, scene light, GUI, DOM panel, XR panel, keyboard shortcut, or demo animation loop.

#### Scenario: Add the head to an existing host scene

- **WHEN** the component is mounted in the advanced dynamic component preview or regional editor
- **THEN** the host MUST retain ownership of camera, lighting, renderer, environment, controls, and application UI

### Requirement: Cancel stale loading work

The component SHALL abort active requests and reject stale asynchronous results when resource URLs change or the component unmounts.

#### Scenario: Unmount while downloading

- **WHEN** the component unmounts before a binary request completes
- **THEN** the active request MUST be aborted
- **AND** no Three.js object from that request may be mounted afterward

#### Scenario: Change a resource URL while downloading

- **WHEN** either configured binary URL changes
- **THEN** the prior loading generation MUST be cancelled
- **AND** only the newest generation may update component state

### Requirement: Manage Three.js resources safely

The component SHALL dispose all owned geometries and materials when replacing the model or unmounting.

#### Scenario: Reload the model

- **WHEN** a new head URL replaces an already rendered head
- **THEN** the previous runtime resources MUST be removed and disposed

#### Scenario: Unmount the component

- **WHEN** the component leaves the scene
- **THEN** its owned head and loading-placeholder Three.js resources MUST be disposed

### Requirement: Preserve upstream attribution

The component SHALL include the Apache-2.0 provenance and license notice for the ported XR Blocks GNM code.

#### Scenario: Audit third-party code

- **WHEN** a maintainer inspects the component directory
- **THEN** the upstream repository, relevant source paths, and Apache-2.0 license notice MUST be present
