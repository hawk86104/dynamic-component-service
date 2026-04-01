## 1. Change Scaffold

- [x] 1.1 Create a new OpenSpec change for `vertigoHaloComponent`.
- [x] 1.2 Document that the component ports `vertigo.html` into a square shader plane without page-level interaction.

## 2. Component Implementation

- [x] 2.1 Add `src/components/vertigoHaloComponent.vue` with safe prop clamping, shader setup, and time-driven uniform updates.
- [x] 2.2 Add `src/shader/vertigoHaloComponent/panel.vert` and `panel.frag` for the vertigo tunnel halo effect.
- [x] 2.3 Remove mouse drag, touch drag, and other page-level interaction from the ported behavior.

## 3. Service Integration

- [x] 3.1 Register the new component in `src/dcsConfig.ts` with defaults, object transform, and config controls.
- [x] 3.2 Add a preview asset for the new component under `public/preview/`.

## 4. Validation

- [x] 4.1 Run `npm run build` and confirm the new component integrates cleanly.
- [x] 4.2 Keep existing panel components untouched while adding the new component.

## 5. Fine Tuning

- [x] 5.1 Fade the visible rings out before the square border becomes visible.
- [x] 5.2 Add a `gradientSpeed` control with a `-1` to `1` range for reversible gradient flow.
- [x] 5.3 Make `gradientSpeed` drive the radial ring expansion and shrink direction instead of only changing color flow.
