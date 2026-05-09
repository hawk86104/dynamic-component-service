## 1. Shader Structure

- [x] 1.1 Create `src/shader/volumetricFluidFlameComponent/` with shared atlas helpers and fullscreen pass vertex shader.
- [x] 1.2 Add advection, divergence, Jacobi pressure, and gradient subtraction fragment shaders for the GPU fluid simulation.
- [x] 1.3 Add volume ray-march and ground glow vertex/fragment shaders.

## 2. Component Implementation

- [x] 2.1 Create `src/components/volumetricFluidFlameComponent.vue` with Tres-compatible primitive mounting.
- [x] 2.2 Implement fluid render target allocation, ping-pong simulation passes, pressure projection, and volume mesh updates inside the shared render loop.
- [x] 2.3 Expose clamped props and uniform sync for fire shape, color preset, simulation behavior, render quality, and ground glow.
- [x] 2.4 Remove standalone sample concerns by not creating renderer, visible scene/camera, controls, post-processing, DOM UI, or debug wireframe logic.
- [x] 2.5 Dispose all component-owned render targets, scenes, materials, and geometries on unmount or structural quality changes.

## 3. Service Integration

- [x] 3.1 Register the component in `src/dcsConfig.ts` with defaults, default Object3D placement, preview path, and config schema.
- [x] 3.2 Confirm the config schema covers all public controls required by the spec.

## 4. Review

- [x] 4.1 Inspect source and diffs for project convention alignment and absence of generic preview changes.
- [x] 4.2 Record validation status, including skipped build/debug commands per project rules.
