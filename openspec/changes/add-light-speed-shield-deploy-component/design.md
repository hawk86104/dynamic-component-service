## Design

The effect is split into two Tres sphere meshes:

- Shell mesh: a transparent outer sphere using `CustomShaderMaterial` and `shield.vert` / `shield.frag`.
- Core mesh: a smaller additive blue energy sphere using `CustomShaderMaterial` and `core.vert` / `core.frag`.

The shader animation reproduces the reference's central blue shield behavior:

- The shell expands from a compact start scale to its final radius in the vertex shader.
- The fragment shader reveals the hex grid from the camera-facing center outward to imitate a shield unfolding across the sphere.
- A cyan sweep band travels with the reveal front.
- Fresnel rim lighting, moving noise, and cell flashing keep the surface alive after deploy.
- The inner core pulses in shader space and remains independent from any scene background.

## Configuration

The component exposes:

- Playback: `autoAnimate`, `deployProgress`, `deployToken`, `deployDuration`, `holdDuration`, `collapseDuration`.
- Shape: `radius`, `coreRadiusRatio`, `startScale`.
- Surface: `shellColor`, `hexColor`, `rimColor`, `opacity`, `hexScale`, `hexWidth`, `hexOpacity`.
- Energy: `coreColor`, `hotColor`, `coreIntensity`, `fresnelStrength`, `sweepWidth`, `sweepIntensity`, `noiseScale`, `noiseSpeed`, `pulseSpeed`, `pulseIntensity`.

`deployToken` and `triggerDeployAction` give the config panel or a host scene a replay hook without adding scene-specific logic.

## Constraints

- Shader sources stay under `src/shader/lightSpeedShieldDeployComponent/`.
- The generic preview views remain unchanged.
- No background, post-processing, camera helpers, or demo-only subtitles are added.
