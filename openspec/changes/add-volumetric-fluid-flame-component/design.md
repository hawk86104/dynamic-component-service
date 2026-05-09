## Context

The project renders dynamic components inside a shared TresJS preview scene. New visual components are expected to live under `src/components`, keep shader sources under `src/shader/<component-name>/`, and expose defaults plus config-panel controls through `src/dcsConfig.ts`. The source example is a standalone native Three.js page with its own renderer, camera, controls, post-processing, DOM UI, and debug geometry, so the port must separate the reusable fire effect from those page-level concerns.

## Goals / Non-Goals

**Goals:**

- Provide a reusable `volumetricFluidFlameComponent` that mounts into the existing TresJS scene.
- Keep the GPU fluid simulation and volumetric ray marching behavior from the reference while adapting it to Vue props and the shared render loop.
- Externalize shader code into the component shader folder.
- Use existing config-panel schema for user controls.
- Improve default performance by lowering simulation cost, pressure iterations, and ray-march work while keeping higher quality available through props.

**Non-Goals:**

- Do not add component-specific visible scene, camera, renderer, controls, DOM UI, FPS counters, debug wireframes, or post-processing. Internal offscreen fullscreen passes are allowed for GPU simulation.
- Do not change generic preview views.
- Do not introduce new runtime dependencies.
- Do not integrate the listed 3D Tiles URLs into this fire component; they are scene data references outside this component scope.

## Decisions

- Use a self-contained Three.js object managed by Vue and inserted with `<primitive>`. This keeps the simulation passes and render targets imperative enough for GPU ping-pong rendering while still following TresJS scene ownership.
- Store the 3D fluid volume as a 2D atlas render target. Three.js render-to-3D-texture workflows are less portable in this project, while the atlas approach matches the reference and works with standard `WebGLRenderTarget`.
- Split shader code by pass: shared atlas helpers, fullscreen pass vertex, advection, divergence, pressure solve, gradient subtract, volume vertex, volume fragment, and ground shaders. This keeps the large native shader code maintainable under the project shader convention.
- Remove bloom and output post-processing. The component uses additive transparent volume shading and a ground glow mesh so it can coexist with the shared scene without taking over the renderer.
- Default to a performance preset around 32³ simulation, 8 pressure iterations, and 64 ray-march steps. Props expose `simulationResolution`, `pressureIterations`, and `rayMarchSteps` so users can trade quality for FPS.
- Recreate simulation render targets only when structural quality props change. Ordinary appearance props update uniforms without reallocating GPU resources.

## Risks / Trade-offs

- Lower default simulation resolution may look softer than the 64³ reference -> expose quality controls and tune defaults for preview FPS.
- Float render targets may be limited on older devices -> detect renderer capabilities and fall back to half-float when appropriate.
- Atlas shader size is large -> split files and keep shared code centralized.
- Additive transparent volume can sort differently with other transparent objects -> keep render order high and depth write disabled.

## Migration Plan

1. Add component and shader files.
2. Register the component through `src/dcsConfig.ts`.
3. Confirm source-level integration by inspecting imports, props, defaults, and cleanup paths.
4. Roll back by deleting the new component/shader files and removing its `dcsConfig.ts` entry.

## Open Questions

- None for the initial implementation.
