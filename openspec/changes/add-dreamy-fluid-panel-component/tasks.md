## 1. Change Scaffold and Shader Plan

- [x] 1.1 Create the OpenSpec change artifacts for `dreamyFluidPanelComponent` and document which parts of the reference demo are preserved versus removed. (Verifiable: proposal, design, tasks, and spec files exist under the new change directory.)
- [x] 1.2 Define a ground-panel implementation that uses a single plane mesh, independent length/width sizing, and component-scoped shader files. (Verifiable: the design documents describe the plane + shader architecture and default ground usage.)

## 2. Component and Shader Implementation

- [x] 2.1 Add `src/components/dreamyFluidPanelComponent.vue` with safe prop clamping, shader material setup, and time-driven uniform updates. (Verifiable: the component renders through tresjs/three and updates over time without inline DOM effects.)
- [x] 2.2 Add `src/shader/dreamyFluidPanelComponent/panel.vert` and `panel.frag` to implement the hex/sequin tiling, layered waves, and specular flash composition. (Verifiable: shader source is externalized and imported by the component.)
- [x] 2.3 Remove interactive light behavior from the ported effect. (Verifiable: the component does not listen for pointer, touch, or click events to change the visual behavior.)

## 3. Service Integration

- [x] 3.1 Register the component in `src/dcsConfig.ts` with a preview asset, defaults, default object transform, and a concise config panel. (Verifiable: the component appears in the registry and can be tuned through the existing preview pipeline.)
- [x] 3.2 Add a preview asset under `public/preview/` for the new component. (Verifiable: the preview path resolves to a local asset.)

## 4. Validation

- [x] 4.1 Run `npm run build` and confirm the new component does not break the project build. (Verifiable: build completes successfully or only reports unrelated repository issues.)
- [x] 4.2 Update this task list to reflect completion state after implementation and validation. (Verifiable: completed items are checked in the change tasks file.)
