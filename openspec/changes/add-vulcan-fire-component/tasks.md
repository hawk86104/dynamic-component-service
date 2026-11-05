## 1. Scope and contracts

- [x] 1.1 Inspect the supplied view, its actual component/helpers/shaders, and the deployed demo module. Verifiable: source notes and design record the resolved implementation and source differences.
- [x] 1.2 Create proposal, design, requirements, and tasks for `add-vulcan-fire-component`. Verifiable: all change artifacts exist and are recognized by OpenSpec.

## 2. Component implementation

- [x] 2.1 Add shared defaults and numeric bounds. Verifiable: component props and registry import the same defaults and all numeric settings are normalized before use.
- [x] 2.2 Implement periodic fire-volume and smoke-texture generation without new dependencies. Verifiable: helper imports only existing Three.js modules and bounds allocation sizes.
- [x] 2.3 Add bounded instanced fire/smoke systems with warmed lifetimes, reactive motion, and transformed depth sorting. Verifiable: source uses fixed particle buffers and the camera-view/component-world matrix for ordering.
- [x] 2.4 Add external particle, fire, smoke, and glow shaders with logarithmic depth and clipping. Verifiable: shader imports resolve inside `src/shader/vulcanFireComponent/`.
- [x] 2.5 Add the Vue lifecycle, pause/speed controls, debounced texture replacement, optional decorations, and cleanup. Verifiable: component owns and disposes every geometry, material, texture, and regeneration timer.

## 3. Integration and documentation

- [x] 3.1 Register all props, defaults, Chinese panel controls, transform support, and local catalog image. Verifiable: one `vulcanFireComponent` entry exists and generic preview files are unchanged.
- [x] 3.2 Add component usage/source notes and local catalog assets. Verifiable: the initial SVG is labeled as illustrative; the final catalog paths resolve to a real animated WebP and matching poster after the requested recording follow-up.

## 4. Static validation

- [x] 4.1 Run targeted ESLint on changed application files and resolve introduced errors. Verifiable: new files pass; the registry's 208 diagnostics are identical to its HEAD baseline (see `validation.md`).
- [x] 4.2 Review diffs, parameter/schema parity, resource cleanup, and OpenSpec consistency. Verifiable: final source review and whitespace checks pass.
- [x] 4.3 Record initial implementation validation limits. Verifiable: build/dev/serve/browser debugging/screenshots were skipped per `AGENTS.md` before the user's explicit recording request; the authorized follow-up is recorded separately below and runtime visual parity is not claimed.

## 5. Requested animated preview follow-up

- [x] 5.1 Record the actual default component in the existing local preview service. Verifiable: 40 distinct frames at a 900×600 working size, with measured 82–84 ms sampling intervals.
- [x] 5.2 Encode and register a 600×400 infinite-loop WebP and identical first-frame poster. Verifiable: the animation is 3.333 seconds / 112286 bytes and the poster is 3240 bytes; the homepage loads the poster, enters `playing` on hover, and returns to `poster` on pointer leave.
- [x] 5.3 Create and exercise the reusable user skill `tvt-dc-preview-capture`. Verifiable: capture and encoder scripts produced the delivered assets, skill validation passed, and temporary recording state was restored. Additional build/debug checks remain skipped under `AGENTS.md`.
