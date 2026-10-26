## ADDED Requirements

### Requirement: Four independently mountable single cards
The service SHALL expose four separate TresJS components for Ember, Solar, Breeze and Bloom. Each SHALL render a single capsule card and its own spatial effect within its local Object3D hierarchy.

#### Scenario: Independent instances
- **WHEN** multiple card types are mounted in an existing TresJS scene and transformed independently
- **THEN** each card and its effect follow only their own parent transforms without changing the host camera, background, lighting or renderer settings.

### Requirement: Recognizable spatial elemental effects
The components SHALL provide a volumetric flame and sparks for Ember, radiating beams and motes for Solar, spatial curved stream ribbons for Breeze, and layered curved translucent petals for Bloom.

#### Scenario: View from another angle
- **WHEN** the scene camera moves away from the frontal view
- **THEN** card thickness and effect depth remain represented by scene geometry or volume coordinates, and the opaque card occludes effect geometry behind it.

### Requirement: Editable common and element parameters
Each component SHALL expose text, dimensions, palette, intensity, animation, visibility and particle controls as Vue props and matching dcsConfig defaults and config entries. Each SHALL also expose parameters specific to its elemental effect. Inputs MUST be sanitized to finite supported ranges.

#### Scenario: Live edits
- **WHEN** supported parameters change while a card is mounted
- **THEN** its uniforms, label texture or necessary geometry update without replacing the host scene or leaking the previous resources.

#### Scenario: Invalid values
- **WHEN** numeric inputs are non-finite or outside supported ranges
- **THEN** sanitized configuration uses bounded defaults or clamped values and creates finite geometry and shader parameters.

### Requirement: Playback and lifecycle ownership
Each component SHALL support play, pause, restart, enabled state and root access through defineExpose. Playback speed zero or pause MUST freeze animation progression. Unmount and rebuild MUST release owned geometries, materials and textures.

#### Scenario: Pause and resume
- **WHEN** the public pause method is called and later play is called
- **THEN** the local clock remains constant while paused and resumes continuously, and update:playing is emitted.

#### Scenario: Disposal
- **WHEN** a component is unmounted or its topology changes
- **THEN** only resources owned by that instance are disposed, and other card instances remain independent.

### Requirement: Service integration and shader separation
Each component SHALL have a unique dcsConfig registration, documented parameters and a local preview cover. Shader code MUST reside under src/shader and be split into vertex and fragment files. Generic preview views MUST remain unchanged.

#### Scenario: Catalog and remote export
- **WHEN** the existing component catalog and federation exposure map read dcsConfig
- **THEN** four independent entries resolve to existing Vue files with usable defaults, controls and covers.

### Requirement: Ember reference-specific flame structure
Ember SHALL emit a curved, shallow volumetric crown from the upper capsule arc and shoulders, with a near-white root, red outer flame and independently curling narrow tongues. Ember SHALL provide dedicated upper-crown sparks, sparse perimeter motes and hollow triangle particles. Solar, Breeze and Bloom defaults and effects MUST remain unchanged by this refinement.

#### Scenario: Stable flame silhouette
- **WHEN** Ember is shown at its default dimensions and active playback
- **THEN** its flame roots follow the upper arc, multiple tongues evolve continuously above it, and the opaque card covers the flame behind its face.

#### Scenario: Independent flame controls
- **WHEN** the user changes crown depth, tongue count, flame speed, core brightness or triangle ratio
- **THEN** Ember updates its own resources or uniforms and keeps the other component factories on their original rendering paths.

### Requirement: Solar reference-specific corona and radial light
Solar SHALL provide an unbroken near-white capsule corona, short light spikes, varied-length golden beams with soft shafts, and sparse outward-moving hollow rings and pinpoints. Beam origins MUST lie on the capsule boundary and their planar directions MUST point away from the card center. These effects SHALL retain local three-dimensional depth.

#### Scenario: Stable solar radiation
- **WHEN** Solar plays at its default settings
- **THEN** the corona stays continuous while individual beams vary softly in brightness and length without rotating the entire beam field.

#### Scenario: Live solar controls
- **WHEN** corona width, brightness, shaft opacity, ray depth, ring ratio or solar speed changes
- **THEN** Solar updates its own uniforms and retains existing geometry for non-topology changes, and speed zero freezes the current phase without resetting it.

#### Scenario: Independent refinement
- **WHEN** Solar is refined or reconfigured
- **THEN** Ember, Breeze and Bloom retain their dedicated implementations and defaults.

### Requirement: Breeze reference-specific split airflow
Breeze SHALL provide upper and lower open airflow paths that pass from left to right around the capsule, with a bright near-edge field, soft broad trails, moving narrow white-mint segments and sparse curled motes. The field SHALL retain actual spatial depth and SHALL NOT rotate as one rigid loop.

#### Scenario: Flow around an obstacle
- **WHEN** Breeze is configured at supported card proportions
- **THEN** the path centerlines stay outside the capsule silhouette, divide above and below it and converge toward the left and right mid-height regions, while moving segments advance along these paths.

#### Scenario: Independent breeze controls
- **WHEN** flow speed, trail length, trail glow, rim brightness or curl ratio changes
- **THEN** the related uniforms or particles update without replacing the host scene, and flow speed zero preserves the current effect phase.

### Requirement: Bloom reference-specific layered lotus
Bloom SHALL provide a layered lotus silhouette, with a central high petal, paired tall/diagonal/lateral petals and broad low petals at default settings. Petals SHALL be curved translucent surfaces with spatial cupping, fine lengthwise veins, warm-white luminous edges and separate local glow. Dedicated particles SHALL include petal flakes and sparse hollow hearts.

#### Scenario: Layered opening and replay
- **WHEN** Bloom starts or restarts with a nonzero opening duration
- **THEN** petals unfold successively from a closed shape behind the opaque card, and remain near the target opening with gentle motion instead of continuously opening and closing the whole flower.

#### Scenario: Moving transparent petals
- **WHEN** opening, curl, depth or spread changes
- **THEN** petal geometry and sorting centers represent the new pose, the card retains its depth occlusion, and replaced owned resources are released exactly once.

#### Scenario: Isolated refinements and honest validation
- **WHEN** Breeze and Bloom are refined
- **THEN** Ember, Solar and generic preview sources remain unchanged, and static validation is reported separately from GPU visual comparison, which is skipped under the current user instruction.
