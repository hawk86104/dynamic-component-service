## 1. Change Scaffold and Port Plan

- [x] 1.1 Create the OpenSpec change artifacts for `currentRipplePanelComponent` and document which parts of `bass-ripple.html` are preserved versus removed. (Verifiable: proposal, design, tasks, and spec files exist under the new change directory.)
- [x] 1.2 Define a ground-panel implementation that uses a single plane mesh, component-scoped shaders, and default floor placement. (Verifiable: the design documents describe the plane + shader architecture and default usage.)

## 2. Component and Shader Implementation

- [x] 2.1 Add `src/components/currentRipplePanelComponent.vue` with safe prop clamping, shader setup, and time-driven uniform updates. (Verifiable: the component renders through tresjs/three and updates over time without DOM-side interaction logic.)
- [x] 2.2 Add `src/shader/currentRipplePanelComponent/panel.vert` and `panel.frag` to implement pulse-driven ripple displacement, conductive grid shading, and electric highlight composition. (Verifiable: shader source is externalized and imported by the component.)
- [x] 2.3 Remove mouse, touch, click, and pointer-driven ripple behavior from the port. (Verifiable: the component does not listen for interaction events and does not require interaction uniforms.)

## 3. Service Integration

- [x] 3.1 Register the component in `src/dcsConfig.ts` with defaults, default object transform, config controls, and preview metadata. (Verifiable: the component appears in the registry with usable defaults.)
- [x] 3.2 Add a preview asset under `public/preview/` for the new component. (Verifiable: the preview path resolves to a local asset.)

## 4. Validation

- [x] 4.1 Run `npm run build` and confirm the new component integrates cleanly. (Verifiable: the build completes successfully or only reports unrelated repository issues.)
- [x] 4.2 Update this task list to reflect the final completion state after implementation and validation. (Verifiable: completed items are checked in this file.)
