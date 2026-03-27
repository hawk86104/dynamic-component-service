## ADDED Requirements

### Requirement: Support bounded liquid bubble vessel shapes
The system SHALL provide a 3D liquid bubble component that supports exactly two vessel shape families: rectangular tank and cylindrical tank.

#### Scenario: Render rectangular liquid bubble vessel
- **WHEN** a developer selects the rectangular shape with valid `length`, `width`, and `height`
- **THEN** the component MUST render a visible rectangular vessel shell, internal liquid body, and bubble layer that fit those dimensions

#### Scenario: Render cylindrical liquid bubble vessel
- **WHEN** a developer selects the cylindrical shape with valid `radius` and `height`
- **THEN** the component MUST render a visible cylindrical vessel shell, internal liquid body, and bubble layer that fit those dimensions

#### Scenario: Reject unsupported shape families
- **WHEN** a developer passes an unsupported shape type
- **THEN** the component MUST fall back to a safe supported default instead of throwing or attempting arbitrary geometry

### Requirement: Render a shader-driven liquid body and surface
The component MUST render the liquid body and liquid surface through three.js geometry plus externalized shader files rather than 2D canvas drawing.

#### Scenario: Update fill level without remount
- **WHEN** a developer changes the liquid fill level
- **THEN** the liquid body height and liquid surface position MUST update without requiring the component to remount

#### Scenario: Animate subtle surface motion
- **WHEN** surface animation is enabled through the component defaults or controls
- **THEN** the liquid surface MUST show a subtle wave-like motion appropriate for a bubbly liquid rather than a large water-like surge

#### Scenario: Load external shader sources
- **WHEN** the component renders its liquid body, liquid surface, and bubble layer
- **THEN** the shader source MUST be stored under `src/shader/liquidBubbleComponent/` and imported from external files

### Requirement: Animate bubbles from bottom-biased nucleation zones
The component MUST create the visual impression of continuous bubble generation from bottom-biased nucleation zones, with non-uniform sizes and upward motion.

#### Scenario: Bias bubbles toward nucleation zones
- **WHEN** the component initializes its bubble layer
- **THEN** most bubbles MUST originate from fixed or semi-fixed bottom zones instead of appearing uniformly across the entire volume

#### Scenario: Rise with variation
- **WHEN** bubble animation is running
- **THEN** bubbles MUST move upward over time with small differences in speed, size, and horizontal sway instead of moving as identical particles

#### Scenario: Fade near the liquid surface
- **WHEN** bubbles approach the liquid surface
- **THEN** they MUST fade or recycle near the surface instead of visibly continuing far above the liquid level

### Requirement: Use shader-first animation for bubble motion
The component MUST convert the reference canvas motion logic into a shader-first particle animation flow where per-frame motion is primarily time-driven in shader code.

#### Scenario: Animate without per-frame particle position rewrites
- **WHEN** the component is animating bubbles during normal playback
- **THEN** it MUST avoid relying on a JavaScript loop that rewrites every particle position buffer on each frame as the primary animation mechanism

#### Scenario: Rebuild only on structural changes
- **WHEN** a developer changes vessel shape, vessel dimensions, or bubble pool sizing controls
- **THEN** the component MAY rebuild geometry or particle attributes, but normal time-based animation MUST continue through uniforms and shader math

### Requirement: Exclude demo-only interaction effects from the component
The component MUST intentionally omit reference-page interaction behaviors that are not suitable for a reusable dynamic component.

#### Scenario: No click or touch burst logic
- **WHEN** the component is used in the dynamic component service
- **THEN** it MUST render and animate without requiring mouse, touch, or hold-to-spawn interaction handlers

#### Scenario: No sparkle pop effect
- **WHEN** bubbles reach the liquid surface
- **THEN** the component MUST not depend on a sparkle burst or star-shaped pop effect to complete the animation

### Requirement: Register defaults and controls in the dynamic component service
The component MUST be registered in `src/dcsConfig.ts` with usable defaults and configuration-panel controls.

#### Scenario: Load component from the registry
- **WHEN** the dynamic component service loads its component list
- **THEN** `liquidBubbleComponent` MUST be available through `src/dcsConfig.ts` without modifying the generic preview entry files

#### Scenario: Expose core controls in the config panel
- **WHEN** a user opens the component configuration panel
- **THEN** the panel MUST expose controls for shape type, vessel dimensions, fill level, core liquid colors, shell opacity, bubble density, bubble size, bubble rise speed, and bubble sway strength
