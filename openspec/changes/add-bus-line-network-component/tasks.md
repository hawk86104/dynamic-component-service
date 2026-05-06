## 1. Reference and Contract

- [x] 1.1 Inspect the Mars3D reference code and confirm the data URL and route style.
- [x] 1.2 Inspect the GeoJSON enough to confirm feature count, geometry type, and coordinate volume.

## 2. Component

- [x] 2.1 Add `src/components/busLineNetworkComponent.vue` with remote GeoJSON loading, coordinate projection, route sampling, line creation, and cleanup.
- [x] 2.2 Add style controls for line width, opacity, color theme, height buckets, and pulse animation.

## 3. Service Integration

- [x] 3.1 Register the component in `src/dcsConfig.ts` with defaults, Object3D placement, and config-panel schema.
- [x] 3.2 Add a preview asset for the new component card.

## 4. Validation

- [x] 4.1 Run the project build or report any environment/repo-wide blocker.
- [x] 4.2 Confirm no generic preview views were modified.

## 5. Follow-up Data Source Refinement

- [x] 5.1 Download the Mars3D Beijing bus GeoJSON to `public/data/bj-bus.json`.
- [x] 5.2 Change defaults to load the local GeoJSON asset.
- [x] 5.3 Replace the data source selector with URL text input plus a confirm generation action.
