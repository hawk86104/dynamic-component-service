## 1. Change Scaffold

- [x] 1.1 Create the `add-pie-chart-art-component` OpenSpec change and document the component scope.
- [x] 1.2 Capture requirements for WebGL rendering, JSON data transitions, limited controls, and service integration.

## 2. Component Implementation

- [x] 2.1 Add `src/components/PieChartArt/` with typed defaults, JSON parsing, palette resolution, geometry helpers, label helpers, and safe prop clamping.
- [x] 2.2 Add `src/shader/PieChartArt/slice.vert` and `slice.frag` for gradient coloring on WebGL standard materials.
- [x] 2.3 Rebuild the chart directly when chart JSON changes to avoid low-FPS geometry transition work.
- [x] 2.4 Dispose geometries, materials, textures, and groups cleanly on rebuild and unmount.

## 3. Service Integration

- [x] 3.1 Register `PieChartArt` in `src/dcsConfig.ts` with defaults, object transform, and only the requested controls.
- [x] 3.2 Add a preview asset under `public/preview/`.

## 4. Validation

- [x] 4.1 Inspect changed source and diffs for integration mistakes.
- [x] 4.2 Skip build/dev/browser validation unless explicitly requested by the user in this conversation.
