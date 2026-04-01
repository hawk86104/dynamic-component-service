## 1. Change Scaffold and Port Contract

- [x] 1.1 Create the OpenSpec change artifacts for `moonlitRippleWaterPanelComponent` and document which `Moonlit Ripple` behaviors are preserved versus removed. (Verifiable: proposal, design, tasks, and spec files exist under the new change directory.)
- [x] 1.2 Define a square-plane implementation that uses three.js + shader, default ground placement, and no interaction dependencies. (Verifiable: the design documents describe the square plane + shader architecture and removal of click behavior.)

## 2. Component and Shader Implementation

- [x] 2.1 Add `src/components/moonlitRippleWaterPanelComponent.vue` with safe prop clamping, shader setup, and time-driven uniform updates. (Verifiable: the component renders through tresjs/three and updates over time without DOM-side interaction logic.)
- [x] 2.2 Add `src/shader/moonlitRippleWaterPanelComponent/panel.vert` and `panel.frag` to implement moonlit reflection, layered ripple motion, and Fresnel-style water shading. (Verifiable: shader source is externalized and imported by the component.)
- [x] 2.3 Remove click, pointer, touch, hover, and drag behavior from the reference port. (Verifiable: the component does not register interaction events or require interaction uniforms.)

## 3. Service Integration

- [x] 3.1 Register the component in `src/dcsConfig.ts` with defaults, square-plane sizing controls, preserved reference parameters, preview metadata, and default ground-oriented placement. (Verifiable: the component appears in the registry with usable defaults and config controls.)
- [x] 3.2 Add a preview asset under `public/preview/` for the new component. (Verifiable: the preview path resolves to a local asset.)

## 4. Validation

- [x] 4.1 Run `npm run build` and confirm the new component integrates cleanly. (Verifiable: the build completes successfully or only reports unrelated repository issues.)
- [x] 4.2 Update this task list to reflect the final completion state after implementation and validation. (Verifiable: completed items are checked in this file.)
