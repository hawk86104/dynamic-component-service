## Why

The component library needs a reusable three-dimensional bus line network component based on the Beijing bus GeoJSON dataset from Mars3D.

## What Changes

- Add `busLineNetworkComponent`, a Vue 3 + TresJS component that loads `https://data.mars3d.cn/file/geojson/bj-bus.json` and renders bus routes as elevated line primitives.
- Convert GeoJSON longitude/latitude coordinates to local Three.js X/Z coordinates with Web Mercator projection, avoiding a new dependency for a small deterministic transform.
- Expose runtime controls for data sampling, route count, map scale, line width, opacity, color theme, height layering, and pulse animation.
- Register the component in `src/dcsConfig.ts` with defaults and configuration controls.
- Add a lightweight preview asset for the component card.

## Impact

- Code: `src/components/busLineNetworkComponent.vue`, `src/dcsConfig.ts`, `public/preview/busLineNetworkComponent.svg`.
- No shared preview view changes are required.
- Runtime network access is required to fetch the remote GeoJSON unless a host provides another compatible URL.
- Rollback: remove the `dcsConfig.ts` entry, then delete the component file, preview asset, and this OpenSpec change directory.
