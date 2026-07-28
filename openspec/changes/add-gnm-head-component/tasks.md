## 1. Change Contract

- [x] 1.1 Create the `add-gnm-head-component` OpenSpec proposal, design, requirements, impact, rollback plan, and implementation checklist.

## 2. GNM Numerical Core

- [ ] 2.1 Port the official browser-side GNM container parser, forward pass, and abortable progress loader.
- [ ] 2.2 Port the official browser-side semantic sampler with deterministic seeding and abortable loading.
- [ ] 2.3 Add TypeScript declarations and the upstream Apache-2.0 third-party notice.

## 3. Three.js Runtime and Vue Component

- [ ] 3.1 Build a disposable Three.js head runtime using the GNM topology, dynamic positions, normals, component visibility, and configurable material.
- [ ] 3.2 Add a Vue/tresjs wrapper that delays initial loading, stages the head and sampler requests, cancels stale requests, and applies latest props.
- [ ] 3.3 Expose compact deterministic identity, expression, pose, material, loading, and visibility props without adding scene-level behavior.

## 4. Service Integration

- [ ] 4.1 Register matching defaults, object transform, description, and config controls in `src/dcsConfig.ts`.
- [ ] 4.2 Add a dedicated preview asset without changing the generic preview views.

## 5. Validation

- [ ] 5.1 Review the changed JavaScript, TypeScript, Vue, and registry sources and inspect the final diff.
- [ ] 5.2 Confirm no renderer, camera, controls, background, environment, lights, DOM/XR panel, or generic preview changes were added.
- [ ] 5.3 Record that build/debug validation was skipped because the project rule forbids automatic execution.
