## ADDED Requirements

### Requirement: PixelFX texture resolution
Each published PixelFX component SHALL expose `resolutionScale` values 1, 2 and 4. Value 1 SHALL use the native raster with nearest sampling. Values 2 and 4 SHALL upload a smoothly resampled texture at the corresponding multiple of the native dimensions. Changes SHALL preserve the anchor, world width and playback position.

#### Scenario: Increase the resolution of an enlarged effect
- **WHEN** the user switches from the original texture to 2× or 4× while playing or paused
- **THEN** the displayed texture uses the selected dimensions and smooth sampling at the same world size and playback position

#### Scenario: Load a configuration without resolutionScale
- **WHEN** an existing component omits `resolutionScale`
- **THEN** it uses the original texture and nearest sampling

### Requirement: PixelFX follows other catalog entries
The all-components list SHALL place every PixelFX entry after all other entries and preserve the order within each group.

#### Scenario: View all components
- **WHEN** the user selects the all-components filter
- **THEN** the list presents other components first and PixelFX entries last

#### Scenario: View the PixelFX category
- **WHEN** the user selects the PixelFX category
- **THEN** the list shows the PixelFX entries in their original relative order
