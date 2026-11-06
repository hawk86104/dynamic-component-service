## ADDED Requirements

### Requirement: Distinct camera facing modes and anchored mirror
Billboard mode SHALL yaw about local Y toward the camera. Sprite mode SHALL fully face the camera. Mirroring SHALL reverse the texture around the original effect anchor in all four presentation modes.

#### Scenario: Tilt the camera and mirror an asymmetric effect
- **WHEN** the user changes the camera pitch or enables mirror
- **THEN** billboard remains locally upright, the sprite faces the camera, and the mirrored graphic stays attached to its original anchor

### Requirement: Gallery palettes and reproducible seeds
Each published effect SHALL expose its native palette and the 27 Gallery palettes, its numeric seed and a New Seed action. Changing palette or seed SHALL restart the effect with those settings. The action SHALL return a seed patch for the configuration panel.

#### Scenario: Select water and generate a seed
- **WHEN** the user chooses `water` and clicks New Seed
- **THEN** the original color ramp is overridden and the new seed is applied and reflected in the editable configuration

### Requirement: Publish independently drawable effects
The service SHALL publish the 201 standalone effects. The 12 chained moves and 31 effects that require sample character data SHALL be excluded. Catalog previews SHALL show the corresponding standalone visuals.

#### Scenario: Open a sword slash preview
- **WHEN** a user selects sword slash from the catalog
- **THEN** the effect and its thumbnail depict the slash independently of the demonstration character and target

### Requirement: Default continuous playback
All published effects SHALL default to looping. Native one-shots SHALL restart at the end of a cycle with looping enabled. Explicit `loop: false` SHALL end playback after a single cycle.

#### Scenario: Instantiate a native one-shot with defaults
- **WHEN** a new fire ring is added with default parameters
- **THEN** it automatically repeats after the native duration
