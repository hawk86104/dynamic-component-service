## 1. Change Scaffold

- [x] 1.1 Create the `add-advanced-dynamic-grass-component` OpenSpec change.
- [x] 1.2 Document the upstream architecture, retained component settings, removed scene settings, impact, and rollback plan.

## 2. Rendering Core

- [x] 2.1 Port deterministic terrain generation and meadow-only sampling geometry.
- [x] 2.2 Port deterministic area-weighted surface sampling.
- [x] 2.3 Port the instanced grass layer with blade geometry, wind uniforms, appearance updates, and disposal.
- [x] 2.4 Port the optional procedural wildflower layer with synchronized wind and disposal.
- [x] 2.5 Externalize grass and wildflower vertex/fragment shaders under the component shader directory.

## 3. Vue Component

- [x] 3.1 Add the Vue/tresjs component wrapper with clamped flat props and lifecycle ownership.
- [x] 3.2 Coalesce structural prop changes and update wind/appearance props without a component remount.
- [x] 3.3 Add the upstream MIT third-party notice.

## 4. Service Integration

- [x] 4.1 Register the component defaults, transform, description, and config controls in `src/dcsConfig.ts`.
- [x] 4.2 Add a dedicated preview asset.
- [x] 4.3 Keep Sun, background, environment, camera, renderer, and generic preview settings out of the component and service config.

## 5. Validation

- [x] 5.1 Review changed TypeScript/Vue/GLSL sources and inspect the final diff.
- [x] 5.2 Confirm generic preview files and existing components remain unchanged.
- [x] 5.3 Record that build/debug validation was skipped because the project rule forbids automatic execution.
