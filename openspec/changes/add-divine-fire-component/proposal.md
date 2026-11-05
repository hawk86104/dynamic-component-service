## Why

Divine Fire demonstrates flames attached to the surface of a geometry or model. Its full-scene setup cannot be reused directly inside an editor that owns the camera, lighting, environment, and post-processing. Add the surface effect as an independent dynamic component.

## What Changes

- Add `divineFireComponent` (模型附着火焰), initially burning on a subdivided cube.
- Allow an online GLB/glTF model URL; an empty URL selects the cube, and failed replacements keep the currently displayed subject.
- Expose component-owned burning, transition, flame, procedural texture, color, and model-size controls through the existing parameter schema.
- Retain surface attachment and model animation without adding a canvas, camera, controls, lights, ground, environment, renderer overrides, or post-processing.
- Add external shaders, usage/source notes, a clearly labeled illustrative catalog asset, and lifecycle cleanup without new application dependencies.

## Capabilities

### New Capabilities

- `divine-fire-component`: A reusable model-attached fire effect with a default cube, online model loading, reactive configuration, and editor-safe ownership.

### Modified Capabilities

None.

## Impact

- Add `src/components/divineFireComponent.vue`, helpers under `src/components/divineFireComponent/`, shaders under `src/shader/divineFireComponent/`, and `public/preview/divineFireComponent.svg`.
- Register the component in `src/dcsConfig.ts`; its existing federation mapping exposes the new component automatically.
- Keep the generic preview views and existing component implementations unchanged.
- Rollback: remove the new registry import/entry and the component, helper, shader, asset, and change directories.
- Validation: targeted ESLint and read-only source/diff review. Build, server startup, browser debugging, and screenshots are skipped under the current project rule.
