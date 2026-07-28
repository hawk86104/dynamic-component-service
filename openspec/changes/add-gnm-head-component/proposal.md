## Why

The advanced dynamic component service does not yet provide a reusable parametric human-head component. Google's GNM browser demo already performs the complete GNM Head forward pass and semantic sampling in client-side JavaScript, but the upstream demo also owns its camera, lighting, controls, desktop/XR panels, keyboard shortcuts, animation tours, inspection overlays, and export tools. Those scene and application concerns do not belong inside a regional-scene component.

The reusable capability is the generated head mesh itself: load the published GNM binary containers on demand, compute identity and expression locally, expose a small editor-friendly parameter surface, and return one transformable Three.js object to the host scene.

## What Changes

- Add a new `gnmHeadComponent` derived from the Apache-2.0 `google/xrblocks` GNM browser implementation.
- Render a lightweight component-local Three.js loading placeholder immediately, then load the GNM head container from `https://opensource.cdn.icegl.cn/bin/gnm/gnm_head_web.bin` after mount without blocking dynamic component import.
- Render the neutral head as soon as the main container is ready, then load `gnm_samplers_web.bin` separately so the smaller semantic sampler does not delay first render.
- Expose compact identity, expression, pose, material, visibility, and seed controls as flat Vue props and `src/dcsConfig.ts` entries, with default identity strength `0.58` and expression strength `0.68`.
- Keep skin always present and expose skin-only opacity instead of whole-head opacity or a separate skin-visibility switch.
- Cancel in-flight requests and ignore stale asynchronous results when URLs change or the component unmounts.
- Keep the upstream DOM/XR UI, camera, controls, lights, background, animation tours, landmarks, skeleton, OBJ export, and keyboard handling out of the component.
- Add a component preview asset and upstream Apache-2.0 attribution.

## Capabilities

### New Capabilities

- `gnm-head-component`: Provide a lazily loaded, deterministic, browser-only GNM Head mesh that can be configured and transformed as a normal object inside the existing host scene.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `src/components/gnmHeadComponent/`
  - `src/dcsConfig.ts`
  - `public/preview/gnmHeadComponent.svg`
  - `openspec/changes/add-gnm-head-component/`
- APIs:
  - Adds one dynamic component with resource URLs, semantic seed/strength, basic pose, skin-only opacity, material, and non-skin anatomy visibility props.
- Dependencies:
  - Reuses browser APIs, Vue, tresjs, and Three.js; no new runtime or server dependency is required.
- Network:
  - The component downloads approximately 35 MB for the head and 2.7 MB for semantic samplers from the configured CDN URLs after mount.
- Systems:
  - Adds one registry entry without modifying generic preview or editor infrastructure.
- Rollback strategy:
  - Remove the registry entry, component directory, preview asset, and this OpenSpec change.
