## 1. Change Scaffold

- [x] 1.1 Create a new OpenSpec change for `giltMosaicGroundPanelComponent` without reusing the older dreamy fluid panel change.
- [x] 1.2 Document that the new component is an independent square ground panel based on `gilt-mosaic.html`.

## 2. Component Implementation

- [x] 2.1 Add `src/components/giltMosaicGroundPanelComponent.vue` with safe prop clamping, shader setup, and time-driven updates.
- [x] 2.2 Add `src/shader/giltMosaicGroundPanelComponent/panel.vert` and `panel.frag` for the mosaic ground effect.
- [x] 2.3 Remove click, touch, hover, and pointer interaction from the ported shader behavior.

## 3. Service Integration

- [x] 3.1 Register the new component in `src/dcsConfig.ts` with defaults, object transform, and config controls.
- [x] 3.2 Add a preview asset for the new component under `public/preview/`.

## 4. Validation

- [x] 4.1 Run `npm run build` and confirm the new component integrates cleanly.
- [x] 4.2 Keep the original `dreamyFluidPanelComponent` untouched while adding the new component.
