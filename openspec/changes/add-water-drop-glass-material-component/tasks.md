## 1. Change Scaffold and Port Plan

- [x] 1.1 Create the OpenSpec change artifacts for `waterDropGlassMaterialComponent` and document which reference behaviors are preserved versus removed. (Verifiable: proposal, design, tasks, and spec files exist under the new change directory.)
- [x] 1.2 Define a square-plane implementation that uses component-scoped helpers, external shader files, and a double-sided material. (Verifiable: the design documents describe the plane + helper + shader architecture and the requested shape constraints.)

## 2. Component and Shader Implementation

- [x] 2.1 Add `src/components/waterDropGlassMaterialComponent/` with safe prop clamping, offscreen raindrop simulation, texture updates, and a plane wrapper rendered through three.js. (Verifiable: the component renders without DOM overlay logic and updates the rain effect over time.)
- [x] 2.2 Add `src/shader/waterDropGlassMaterialComponent/glass.vert` and `glass.frag` to implement the refractive glass composition using the dynamic water map plus foreground / background textures. (Verifiable: shader source is externalized and imported by the component.)
- [x] 2.3 Remove `postMessage`, fullscreen page ownership, and click / touch splash logic from the port. (Verifiable: the component does not register interactive splash events or depend on standalone page plumbing.)

## 3. Service Integration

- [x] 3.1 Register the component in `src/dcsConfig.ts` with defaults, config controls, preview metadata, and default transform values. (Verifiable: the component appears in the registry with usable defaults and preserved tuning controls.)
- [x] 3.2 Add a preview asset under `public/preview/` for the new component. (Verifiable: the preview path resolves to a local asset.)

## 4. Validation

- [x] 4.1 Run `npm run build` and confirm the new component integrates cleanly. (Verifiable: the build completes successfully or only reports unrelated repository issues.)
- [x] 4.2 Update this task list to reflect the final completion state after implementation and validation. (Verifiable: completed items are checked in this file.)
