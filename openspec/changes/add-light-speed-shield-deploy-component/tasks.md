## 1. Reference and Contract

- [x] 1.1 Inspect the reference video enough to identify the relevant central blue shield sphere behavior.
- [x] 1.2 Define the component scope: blue core, spherical hex shield, shader deploy animation, no background or unrelated demo elements.

## 2. Component and Shader

- [x] 2.1 Add `src/components/lightSpeedShieldDeployComponent.vue` with Tres sphere meshes, clamped props, replay hooks, and uniform sync.
- [x] 2.2 Add external shader files under `src/shader/lightSpeedShieldDeployComponent/` for shell and core animation.

## 3. Service Integration

- [x] 3.1 Register the component in `src/dcsConfig.ts` with defaults, Object3D placement, and config-panel schema.
- [x] 3.2 Add a preview asset for the new component card.

## 4. Validation

- [x] 4.1 Run the project build or report any environment/repo-wide blocker.
- [x] 4.2 Confirm no generic preview views were modified.
