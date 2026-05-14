## Context

The reference implementation is a fullscreen three.js WebGPU page with multiple datasets, DOM controls, HDR loading, post-processing, and interaction helpers. This repository needs a reusable dynamic component instead: all visuals should live in the Tres/three WebGL layer, component-specific code should stay in `src/components`, shader code should live under `src/shader/PieChartArt/`, and preview integration should be handled by `src/dcsConfig.ts`.

## Goals / Non-Goals

**Goals:**

- Render the default Market Share dataset from the reference.
- Accept JSON data updates and rebuild the chart directly to avoid per-frame geometry churn.
- Preserve the extruded beveled 3D pie chart feel with labels and leader lines.
- Use WebGL-compatible three.js code rather than WebGPU/TSL/post-processing.
- Expose only Chart, label-size, Gradient, and Material controls plus the required data JSON input.
- Keep code split into focused files because the component has non-trivial geometry, labels, materials, and parsing logic.

**Non-Goals:**

- Do not port HDR environment selection, AO, SSR, rendering, lighting, ground, FPS, dataset buttons, or DOM UI from the reference.
- Do not modify `src/views/previewEntry.vue` or `src/views/templateComponet.vue`.
- Do not add runtime network font or HDR dependencies.
- Do not implement WebGPU-only APIs.

## Decisions

1. Decision: Build the chart imperatively inside a `THREE.Group` exposed through a Tres primitive.
   - Rationale: Pie slices, labels, leader lines, and direct rebuilds are easier to manage and dispose with direct three.js objects while still living inside the Tres scene.

2. Decision: Use `ExtrudeGeometry` for each slice and `three-custom-shader-material` over `MeshStandardMaterial`.
   - Rationale: This keeps bevels, lights, roughness, metalness, and env map intensity compatible with standard WebGL materials while allowing external shader code to drive gradient color.

3. Decision: Store the default dataset as JSON and parse incoming data with `json5`.
   - Rationale: The existing config pane already supports JSON text editing through JSON5, and direct rebuild avoids the frame-rate hit from rebuilding extruded geometry every animation frame.

4. Decision: Use canvas-backed sprite labels instead of WebGPU text geometry or DOM labels.
   - Rationale: Sprites remain inside the WebGL scene, avoid remote font loading, and work in the dynamic component host.

5. Decision: Provide five automatic color schemes and ignore per-slice color controls by default.
   - Rationale: The user requested palette-level automatic options rather than individual color pickers.

## Risks / Trade-offs

- Risk: Direct rebuilds do not animate between datasets.
  - Mitigation: This avoids low FPS during JSON updates and keeps the component simpler.

- Risk: Canvas sprite labels are less crisp than vector text when viewed very close.
  - Mitigation: Render labels at high canvas resolution and keep them billboarded toward the camera.

- Risk: `envMapIntensity` has limited visible impact when the host scene does not provide an environment map.
  - Mitigation: Keep the prop because it is part of the requested Material controls and will work in hosts that do provide an environment map.

## Migration Plan

- Add `src/components/PieChartArt/` with parsing, palette, geometry, label, and component files.
- Add `src/shader/PieChartArt/slice.vert` and `slice.frag`.
- Add a `PieChartArt` entry to `src/dcsConfig.ts`.
- Add a lightweight preview asset under `public/preview/`.
- Perform source/diff inspection only unless the user explicitly asks for build/debug validation.

## Open Questions

- None for the current scope.
