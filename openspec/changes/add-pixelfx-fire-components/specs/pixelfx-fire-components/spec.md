## ADDED Requirements

### Requirement: Independent Fire effect components

The service SHALL register all 12 effects in the pinned PixelFX Fire category as independent component types and Vue entry files, sharing one player. All source and dependencies MUST be local, lazily loaded, and accompanied by upstream license/notices.

#### Scenario: Load one fire component
- **WHEN** a consumer selects the campfire component
- **THEN** it loads the campfire module through its own entry and exposes the same default/config contract as other DCS components without importing the all-effects index or requesting GitHub at runtime

### Requirement: Selectable presentation and original pivot

Each component SHALL offer billboard, sprite, vertical and ground render modes. It MUST preserve the original aspect ratio, pivot, transparent pixels and parent transforms. Billboard meshes MUST compensate parent rotation when aligning to the camera; Sprite MUST use the original pivot as its center.

#### Scenario: Change render mode under a rotated parent
- **WHEN** the user switches between billboard, sprite, vertical and ground modes
- **THEN** the same effect retains its pivot and dimensions, billboard/sprite face the camera, vertical stays in local XY, and ground stays in local XZ

### Requirement: Minimal playback and lifecycle

Components SHALL expose width, opacity, playing, playbackRate, loop and restart using shared defaults. Native metadata MUST determine default looping and animation sampling. Pausing MUST preserve the frame; a completed one-shot MUST clear; restart MUST recreate the simulation at time zero. Each instance MUST own its simulation/buffers and dispose geometry, materials and textures on unmount. Late module results MUST NOT recreate an unmounted instance.

#### Scenario: Pause and restart a single-shot effect
- **WHEN** the user pauses, resumes and restarts a meteor
- **THEN** pause freezes the frame, resume continues from that time, restart begins again, and completing with loop disabled clears the effect

#### Scenario: Unmount during module loading
- **WHEN** a component is removed while its module is loading
- **THEN** the late load result does not allocate or attach a runtime and all already-owned resources are released

### Requirement: Native preview conversion and existing integration

Each component SHALL provide a local 600×400 animated WebP and a poster matching its first decoded frame, converted from the original effect drawing without a stock actor. Props, defaults and panel fields MUST agree. Registration MUST preserve generic preview views and use the existing Federation mapping. No new shader is required; any future shader MUST follow the component-scoped vertex/fragment layout.

#### Scenario: Inspect a catalog entry
- **WHEN** the user opens a Fire component from the catalog
- **THEN** it has an original-effect preview, matching poster, usable Chinese controls and a unique component source path through existing DCS registration

### Requirement: Explicit static validation boundary

Work MUST respect AGENTS.md by skipping build, server startup, browser debugging and screenshots unless explicitly requested, and MUST distinguish offline image conversion/CPU checks from browser or GPU proof.

#### Scenario: Report this implementation
- **WHEN** implementation is delivered without additional validation authorization
- **THEN** the report records performed static checks and explicitly states that build/debug validation was skipped under the project rule
