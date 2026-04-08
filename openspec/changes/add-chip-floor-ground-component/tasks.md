## 1. Change Scaffold

- [x] 1.1 Create a new OpenSpec change for `chipFloorGroundComponent`.
- [x] 1.2 Document that the component ports `chip-floor-codepen.js` into a floor-ready circular shader component.

## 2. Component Implementation

- [x] 2.1 Add `src/components/chipFloorGroundComponent.vue` with safe prop clamping, shader setup, and time-driven updates.
- [x] 2.2 Add `src/shader/chipFloorGroundComponent/panel.vert` and `panel.frag` while preserving the reference shader structure as closely as practical.
- [x] 2.3 Remove exposed `Camera & Zoom` and `Quality & Performance` controls and switch the shader to a top-down floor implementation driven by the outer scene camera.

## 3. Service Integration

- [x] 3.1 Register the new component in `src/dcsConfig.ts` with defaults, object transform, and config controls.
- [x] 3.2 Add a preview asset for the new component under `public/preview/`.

## 4. Floor Adaptation

- [x] 4.1 Render the component with a circular visible footprint instead of a fullscreen quad.
- [x] 4.2 Fade the floor edge smoothly so the visible boundary feels softer and larger than the mesh itself.

## 5. Validation

- [ ] 5.1 Run `npm run build` and confirm the new component integrates cleanly.
- [x] 5.2 Keep existing components and preview infrastructure untouched while adding the new component.
