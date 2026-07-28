## Context

The official XR Blocks GNM demo contains a dependency-free `GNMHeadModel` implementation, a typed-array semantic sampler, Three.js scene construction, multiple application UIs, XR interaction, animation drivers, inspection overlays, and export helpers. The dynamic component service only needs the model computation and a Three.js mesh. The host scene already owns its renderer, camera, controls, lighting, background, and application UI.

The two GNM containers are large enough that eager application startup loading would be disruptive:

- `gnm_head_web.bin`: approximately 35 MB
- `gnm_samplers_web.bin`: approximately 2.7 MB

The component is loaded through the service's existing dynamic-component mechanism, so network work must begin inside the component lifecycle rather than at module evaluation time.

## Goals / Non-Goals

**Goals:**

- Preserve Google's browser-side GNM forward pass and semantic sampling behavior.
- Package the result as one normal tresjs/Three.js object hierarchy.
- Render the neutral head before waiting for the optional semantic sampler.
- Provide deterministic identity and expression controls without exposing 636 individual PCA coefficients.
- Expose useful basic material, pose, non-skin component-visibility, resource URL, and skin-opacity settings.
- Keep remote component import responsive by showing an owned loading placeholder while the large head container downloads.
- Cancel or supersede asynchronous loads safely and dispose all owned Three.js resources.
- Keep the generic preview files unchanged.

**Non-Goals:**

- Do not port the upstream renderer, camera, OrbitControls, background, environment, or lights.
- Do not port desktop DOM controls, spatial XR panels, keyboard shortcuts, or WebXR interaction.
- Do not port animation tours, random walks, pulse exploration, landmarks, skeleton, statistics, or OBJ export.
- Do not expose every identity and expression PCA coefficient.
- Do not add Node.js, Python, TensorFlow.js, or a server-side inference service.
- Do not embed or proxy the binary assets through this repository.

## Decisions

1. Decision: Create a lightweight Three.js loading placeholder during component setup and start head loading on the first animation frame after mount.
   - Rationale: Module evaluation never starts network work, the remote component can resolve and mount immediately in the regional editor, and the host gets visible loading feedback without an arbitrary user-configurable delay.
   - Alternative considered: Download at module import time. Rejected because merely registering or importing the component would start a 35 MB transfer.

2. Decision: Load and render the head container before loading the semantic sampler.
   - Rationale: The main mesh can show a neutral head without semantic sampling. Sequential staged loading shortens time to first visible result and avoids holding two simultaneous streaming buffers.
   - Alternative considered: `Promise.all` for both containers. Rejected because the 2.7 MB sampler and its parsing would become a hard first-render dependency.

3. Decision: Use deterministic seed plus strength controls for identity and expression.
   - Rationale: The service config panel is suited to a compact serializable parameter surface, not 636 sliders. `identitySeed`, `identityStrength`, `expressionSeed`, `expressionClass`, and `expressionStrength` reproduce useful variations while remaining editor-friendly.
   - Alternative considered: Expose all PCA values. Rejected because it would overwhelm the config panel and serialized component data.

4. Decision: Keep one generated mesh and rebuild a reusable triangle index from the upstream `componentId` metadata.
   - Rationale: This retains visibility controls for eyes, teeth/gums, and tongue without copying anatomical-region inspection UI or duplicating vertex buffers. Skin remains present and is controlled through skin opacity.
   - Alternative considered: Split the anatomy into multiple meshes. Rejected because all regions share one dynamic position buffer and a filtered index is simpler to update and dispose.

5. Decision: Keep one shared dynamic position buffer and vertex-color palette, with separate skin and anatomy materials assigned through geometry groups.
   - Rationale: Identity/expression changes update 17,821 vertices once, material IDs retain distinct colors, and `skinOpacity` can affect only skin triangles while eyes, teeth, gums, and tongue remain opaque.
   - Alternative considered: Duplicate geometry per anatomical group. Rejected because it would increase memory and update cost.

6. Decision: Recompute vertex normals after semantic or pose changes, not continuously.
   - Rationale: The component changes only when props change. Avoiding a per-frame forward pass keeps the host scene inexpensive.
   - Alternative considered: Continuous recomputation in the render loop. Rejected because the requested component has no built-in animation driver.

7. Decision: Extend the upstream fetch helper with `AbortSignal`.
   - Rationale: Component unmounts and URL changes must stop large in-flight transfers and prevent stale models from being mounted.
   - Alternative considered: Ignore results after completion only. Rejected because it would continue wasting bandwidth and memory.

8. Decision: Keep upstream source and license attribution component-local.
   - Rationale: The numerical implementation is derived from Apache-2.0 XR Blocks code and the provenance should travel with the component.

## Risks / Trade-offs

- Risk: A CDN without CORS or accurate `Content-Length` can block loading or make progress indeterminate.
  - Mitigation: The loader supports chunk aggregation when the header is absent or inaccurate, reports a zero/indeterminate total when necessary, and surfaces failures through events and console warnings.

- Risk: Parsing and initial vertex computation still occur on the main thread.
  - Mitigation: A lightweight loading object is rendered first, the request starts only after mount, sampler loading is staged, and subsequent updates are prop-driven rather than continuous. A Web Worker remains a possible future optimization if device testing shows a measurable stall.

- Risk: Changing semantic props before the sampler is ready could be lost.
  - Mitigation: Props are read again when the sampler completes, so the latest settings are applied.

- Risk: Rapid URL changes can interleave asynchronous completion.
  - Mitigation: Abort the previous controller and guard every load with a monotonically increasing generation token.

- Risk: Repeated visibility or skin-opacity changes could allocate GPU resources.
  - Mitigation: Reuse one dynamic index buffer and two persistent materials; update draw groups and material properties in place.

## Migration Plan

- Add the OpenSpec contract and implementation tasks.
- Port the two dependency-free GNM numerical modules with abortable progress fetching.
- Add the runtime builder and Vue lifecycle wrapper.
- Register defaults, transform, description, and config controls in `src/dcsConfig.ts`.
- Add a dedicated preview asset and Apache-2.0 notice.
- Perform read-only source and diff review; do not run build/debug commands under the project rule.

## Open Questions

- None for the current scope.
