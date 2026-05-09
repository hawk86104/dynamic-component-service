## ADDED Requirements

### Requirement: TresJS Fluid Flame Component

The system SHALL provide a `volumetricFluidFlameComponent` dynamic component that renders a three-dimensional fluid fire effect inside the existing TresJS scene without creating its own visible scene, camera, renderer, controls, post-processing chain, or DOM UI.

#### Scenario: Component mounts in shared preview scene

- **WHEN** the dynamic component service loads `volumetricFluidFlameComponent`
- **THEN** the component renders through the shared TresJS canvas and uses the existing preview camera, controls, and lights.

#### Scenario: Standalone reference UI is absent

- **WHEN** the component is rendered in the preview
- **THEN** it does not create a fixed DOM control panel, debug wireframe toggle, standalone FPS counter, EffectComposer, RenderPass, UnrealBloomPass, OutputPass, OrbitControls, WebGLRenderer, or visible root scene/camera.

### Requirement: Shader Organization

The system SHALL keep all custom shader sources for the component under `src/shader/volumetricFluidFlameComponent/` and split them by pass or material responsibility.

#### Scenario: Shader files are externalized

- **WHEN** the component imports GLSL code
- **THEN** it imports raw shader files from `src/shader/volumetricFluidFlameComponent/` rather than embedding large shader strings in the Vue component.

### Requirement: Configurable Fire Controls

The system SHALL expose the fire appearance, shape, simulation, and render-quality controls through component props and `src/dcsConfig.ts`.

#### Scenario: User adjusts fire behavior

- **WHEN** a user changes flame width, flame height, turbulence, buoyancy, dissipation, emit strength, brightness, absorption, color mode, or scale controls in the config panel
- **THEN** the component updates the relevant uniforms without requiring a page reload.

#### Scenario: User adjusts quality controls

- **WHEN** a user changes simulation resolution, pressure iteration count, or ray-march steps
- **THEN** the component applies those settings while keeping values clamped to supported ranges.

### Requirement: Performance-Conscious Defaults

The system SHALL use default settings that are less expensive than the provided 64³, 20-pressure-iteration, 112-ray-step reference while preserving the recognizable volumetric flame effect.

#### Scenario: Default component loads with optimized settings

- **WHEN** the component uses its default `dcsConfig.ts` values
- **THEN** it uses a reduced simulation resolution, reduced pressure iterations, and reduced ray-march step count compared with the reference code.

### Requirement: Resource Lifecycle

The system SHALL dispose GPU resources created by the fluid fire component when the component is unmounted or structurally recreated.

#### Scenario: Component unmounts

- **WHEN** the component is removed from the scene
- **THEN** render targets, geometries, materials, and internal scene resources created by the component are disposed.
