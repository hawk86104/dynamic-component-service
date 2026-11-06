## ADDED Requirements

### Requirement: Complete independent effect inventory
The service MUST register exactly the pinned upstream's 244 effects across 21 categories, with one unique component type and Vue entry per effect. The previous 12 Fire types and paths MUST remain compatible. Each entry MUST expose the existing six parameter fields and four presentation choices, plus restart, with usable Chinese metadata.

#### Scenario: Inspect the full catalog
- **WHEN** the library registrations are enumerated
- **THEN** they match the pinned source effect IDs without duplicates, omissions or helper modules, and every source and preview path exists

### Requirement: Local lazy source loading
All effect modules and their relative dependencies MUST be available locally with upstream notices and hashes. Loading MUST use lazy per-effect imports without the all-effects static index, runtime network fetches, or the excluded Gallery font.

#### Scenario: Load a chained move
- **WHEN** the arrow-shot component loads
- **THEN** its projectile and hit-spark relative imports resolve locally while unrelated effects are not required by the loader entry

### Requirement: Faithful acted playback and bounds
New actor-dependent effects MUST use upstream action playback with stock pixel actors/targets, wind-up, hit-stops, recovery and on-body drawing. Canvas bounds and origin MUST include the whole action without changing the world anchor. Native loops MUST retain their continuous simulation. Repeating one-shots MUST recreate independent simulation state. Existing pure Fire playback MUST remain available without added actors.

#### Scenario: Play a move or status effect
- **WHEN** the user plays a chained attack or burning status
- **THEN** its original actor performance is visible on the component texture, its target and pose fit within the frame, and it ends or repeats according to the loop setting

#### Scenario: Pause an action during a hit-stop
- **WHEN** playback is paused or its rate is zero
- **THEN** pixels and simulation remain fixed and resuming continues the same action instead of restarting

### Requirement: Local panel semantics for screen effects
UI, weather and transitions MUST be implemented as scene-local textures with the original pixel dimensions/origin and existing presentation options. They MUST NOT take over the host screen, camera or renderer.

#### Scenario: Use an iris transition on a ground plane
- **WHEN** the user selects ground mode for the iris component
- **THEN** its mask animates on that plane and other scene objects retain their existing rendering behavior

### Requirement: Complete original preview conversion
Every effect MUST have a 600×400 animated WebP and poster matching its first decoded frame, converted from the same playback profile as the component. Action previews MUST include the original performance; pure effects MUST omit unrelated characters. Conversion MUST record source identity, profile, frame count and timing, detect missing/stale assets and preserve valid completed entries when resumed.

#### Scenario: Resume a full conversion
- **WHEN** conversion is rerun after some effects have completed
- **THEN** valid assets with matching input signatures are retained, missing or changed entries regenerate, and the final manifest lists all 244 effects

### Requirement: Scoped implementation and honest verification
Generic preview files and dependencies MUST remain unchanged. The implementation MUST pass focused lint/type/CPU/asset checks and report the build/debug exclusions required by AGENTS.md without treating offline imagery as browser/GPU proof.

#### Scenario: Deliver the full library
- **WHEN** validation is reported
- **THEN** static results and original-asset conversion are distinguished from skipped build, server and browser checks
