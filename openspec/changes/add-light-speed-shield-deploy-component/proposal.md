## Why

The component library needs a configurable shield deploy effect that matches the referenced demo's central blue sphere while excluding the demo background, subtitles, and unrelated scene elements.

## What Changes

- Add `lightSpeedShieldDeployComponent`, a Vue 3 + TresJS component that renders a blue energy core and a transparent spherical hex shield.
- Drive the deploy, pulse, sweep, Fresnel rim, noise, and hex grid animation through external shader files loaded by `CustomShaderMaterial`.
- Register the component in `src/dcsConfig.ts` with defaults and configuration controls.
- Add a lightweight preview asset for the component card.

## Impact

- Code: `src/components/lightSpeedShieldDeployComponent.vue`, `src/shader/lightSpeedShieldDeployComponent/*`, `src/dcsConfig.ts`, `public/preview/lightSpeedShieldDeployComponent.svg`.
- No shared preview view changes are required.
- Rollback: remove the `dcsConfig.ts` entry, then delete the component, shader files, preview asset, and this OpenSpec change directory.
