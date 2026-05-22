## 1. Change Contract

- [x] 1.1 Create proposal, design, spec, and task artifacts for `add-circular-particle-chart-component`. (Verifiable: files exist under the OpenSpec change directory.)
- [x] 1.2 Capture the requested public controls and out-of-scope environment/lighting concerns in the artifacts. (Verifiable: spec and design mention the exact control set and non-goals.)

## 2. Component and Shader Implementation

- [x] 2.1 Add `src/components/circularParticleChartComponent.vue` with a Tres/three particle chart, guide rings, scan sweep, center labels, safe prop clamping, and cleanup. (Verifiable: component source contains the visual implementation and disposes three.js resources.)
- [x] 2.2 Add `src/shader/circularParticleChartComponent/chart.vert` and `chart.frag` for scan-reactive particle motion and soft glowing point sprites. (Verifiable: shader files exist and are imported by the component.)
- [x] 2.3 Revise the component so the scan surface and text planes lie on the `XZ` plane by default. (Verifiable: component geometry and text planes use horizontal orientation without billboard labels.)
- [x] 2.4 Add a sweep-surface shader and dense ring-biased particle behavior for a closer reference-style scan trail. (Verifiable: `sweep.vert` and `sweep.frag` exist and the particle shader includes soft scan-trail logic.)
- [x] 2.5 Keep the circular disk visually hollow in the center and remove the extra hard radar-like radial line. (Verifiable: scan surface uses ring geometry, particles avoid the center radius, and shaders do not add a sharp radial front line.)

## 3. Service Integration

- [x] 3.1 Register `circularParticleChartComponent` in `src/dcsConfig.ts` with defaults, default object transform, preview metadata, and the requested controls. (Verifiable: registry entry includes the requested config controls, `line2`, and `lineColor`.)
- [x] 3.2 Add a preview asset under `public/preview/`. (Verifiable: preview path resolves to a local asset.)
- [x] 3.3 Add a `line2` slider for the double-line border thickness. (Verifiable: registry entry exposes `line2` and the component rebuilds ring mesh thickness from it.)
- [x] 3.4 Add a border-line color control independent from particle color. (Verifiable: registry entry exposes `lineColor` and border ring materials sync from it.)

## 4. Validation

- [x] 4.1 Inspect changed source and diffs for integration mistakes. (Verifiable: source/diff inspection completes.)
- [x] 4.2 Skip build/dev/browser validation unless explicitly requested by the user in this conversation. (Verifiable: final report notes the project-rule skip.)
