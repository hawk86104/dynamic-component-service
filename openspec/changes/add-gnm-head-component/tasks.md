## 1. Change Contract

- [x] 1.1 Create the `add-gnm-head-component` OpenSpec proposal, design, requirements, impact, rollback plan, and implementation checklist.

## 2. GNM Numerical Core

- [x] 2.1 Port the official browser-side GNM container parser, forward pass, and abortable progress loader.
- [x] 2.2 Port the official browser-side semantic sampler with deterministic seeding and abortable loading.
- [x] 2.3 Add TypeScript declarations and the upstream Apache-2.0 third-party notice.

## 3. Three.js Runtime and Vue Component

- [x] 3.1 Build a disposable Three.js head runtime using the GNM topology, dynamic positions, normals, component visibility, and configurable material.
- [x] 3.2 Add a Vue/tresjs wrapper that mounts a lightweight loading placeholder, stages the head and sampler requests, cancels stale requests, and applies latest props.
- [x] 3.3 Expose compact deterministic identity, expression, pose, material, resource, and non-skin visibility props without adding scene-level behavior.

## 4. Service Integration

- [x] 4.1 Register matching defaults, object transform, description, and config controls in `src/dcsConfig.ts`.
- [x] 4.2 Add a dedicated preview asset without changing the generic preview views.

## 5. Validation

- [x] 5.1 Review the changed JavaScript, TypeScript, Vue, and registry sources and inspect the final diff.
- [x] 5.2 Confirm no renderer, camera, controls, background, environment, lights, DOM/XR panel, or generic preview changes were added.
- [x] 5.3 Record that build/debug validation was skipped because the project rule forbids automatic execution.

Validation record: the component directory passes targeted ESLint, both
third-party JavaScript ports pass `node --check`, the new `dcsConfig.ts` lines
introduce no lint errors, the SVG is structurally checked, and `git diff
--check` passes. Build, dev server, preview server, and browser debugging were
not run in accordance with the project rule.

## 6. Loading and Editor-Control Revision

- [x] 6.1 Replace the configurable loading-delay contract with a component-local Three.js loading placeholder that preserves non-blocking remote component import. (Verifiable: proposal, design, and requirements no longer expose `loadDelayMs` and explicitly require mount-time loading feedback.)
- [x] 6.2 Add and dispose a lightweight progress placeholder, start the head request after mount without a public delay prop, and keep staged sampler loading and abort/generation guards. (Verifiable: the placeholder exists before the head runtime, follows head download progress, and is removed when the head becomes ready.)
- [x] 6.3 Set identity/expression defaults to `0.58`/`0.68`, remove skin visibility, and replace whole-head opacity with skin-only opacity in props, runtime materials, defaults, and `dcsConfig.ts`. (Verifiable: all integration layers expose matching fields and non-skin anatomy remains opaque.)
- [x] 6.4 Review the revised Vue, TypeScript, registry, and OpenSpec sources and record allowed static validation while continuing to skip build/debug commands. (Verifiable: targeted lint and diff checks pass and generic preview files remain unchanged.)

Revision validation record: the revised component directory passes targeted
ESLint; the ported JavaScript files pass `node --check`; the preview SVG passes
`xmllint`; the new registry lines introduce no lint errors; `git diff --check`
passes; and both generic preview views remain unchanged. Build, dev server,
preview server, and browser debugging remain skipped under the project rule.
