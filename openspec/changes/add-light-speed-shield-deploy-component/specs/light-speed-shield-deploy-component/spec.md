## ADDED Requirements

### Requirement: Render the referenced blue shield sphere only

The system SHALL provide `lightSpeedShieldDeployComponent` that renders the central blue sphere shield effect from the reference video without adding the video's background, subtitles, or unrelated scene objects.

#### Scenario: Default render

- **GIVEN** the component is rendered with default props
- **WHEN** the TresJS canvas displays the component
- **THEN** a cyan-blue glowing core and transparent spherical hex shield are visible

#### Scenario: No demo scene leakage

- **GIVEN** the component is added to a host scene
- **WHEN** the component renders
- **THEN** it SHALL only create shield/core meshes and SHALL NOT create background geometry, subtitles, cameras, lights, or post-processing chains

### Requirement: Shader-driven deploy animation

The component SHALL use `three-custom-shader-material/vanilla` and external vertex/fragment shader files to animate the shield deploy.

#### Scenario: Auto deploy loop

- **GIVEN** `autoAnimate` is true
- **WHEN** time advances
- **THEN** the shield SHALL unfold from the center outward, hold, and reset according to the configured durations

#### Scenario: Manual deploy progress

- **GIVEN** `autoAnimate` is false
- **WHEN** `deployProgress` changes
- **THEN** the shader uniforms SHALL update without remounting the component

#### Scenario: Replay action

- **GIVEN** `autoAnimate` is false
- **WHEN** `deployToken` changes or `triggerDeployAction` is called
- **THEN** the component SHALL replay the deploy animation once and remain fully deployed

### Requirement: Config service integration

The component SHALL be registered in `src/dcsConfig.ts` with defaults and configuration controls.

#### Scenario: Component appears in service list

- **GIVEN** the dynamic component service reads `src/dcsConfig.ts`
- **WHEN** the component list is built
- **THEN** `lightSpeedShieldDeployComponent` SHALL be available with preview metadata

#### Scenario: Runtime config updates

- **GIVEN** a user changes colors, opacity, hex density, sweep, pulse, or timing controls
- **WHEN** props update
- **THEN** existing shader uniforms SHALL update in place
