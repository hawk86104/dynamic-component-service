## Why

The requested Vulcan Fire reference combines textured billboard flames with rising smoke, a different appearance and cost profile from the existing fluid-volume fire and horizontal flame jet. Add it as a reusable dynamic component for ordinary Three.js and GIS scenes.

## What Changes

- Add `vulcanFireComponent` (火山火焰), with animated procedural fire-volume particles, independent smoke particles, and optional local glow, ground, and fire light.
- Expose safe particle, motion, palette, smoke, and procedural-volume controls through shared defaults and the existing configuration schema.
- Support parent transforms, camera-facing billboards, transparent particle sorting, logarithmic depth, and full resource cleanup.
- Generate textures locally with existing Three.js utilities; do not add runtime dependencies or request reference-site assets.
- Add component-scoped shaders, source notes, and OpenSpec artifacts. Retain the initial illustrative SVG and provide a real 600×400 animated catalog preview with a matching poster following the user's recording request.

## Capabilities

### New Capabilities

- `vulcan-fire-component`: A configurable, self-contained billboard fire and smoke effect inspired by the supplied Vulcan Fire source and demo.

### Modified Capabilities

None.

## Impact

- New component and helpers: `src/components/vulcanFireComponent.vue` and `src/components/vulcanFireComponent/`.
- New shaders: `src/shader/vulcanFireComponent/`.
- Registration: `src/dcsConfig.ts`; the existing Vite federation map automatically exposes registered components.
- Catalog image: `public/preview/vulcanFireComponent.svg`, labeled as an illustration rather than a captured render.
- Existing components, dependencies, and generic preview views remain unchanged.
- Rollback: remove the new config import and registration, then delete the new component, helpers, shaders, catalog asset, and this change directory.
- Validation: targeted ESLint and read-only source/diff review. Build, server startup, browser debugging, and screenshots are excluded by the current project instruction.
