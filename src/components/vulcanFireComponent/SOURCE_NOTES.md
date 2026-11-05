# Reference notes

Reviewed on 2026-11-05:

- Demo: https://lab.jaimetorrealba.com/vulcanfire
- Supplied view: https://github.com/JaimeTorrealba/creative-lab/blob/main/src/views/T-Z/VulcanFireView.vue
- Actual effect: https://github.com/JaimeTorrealba/creative-lab/tree/main/src/components/demos/t-z/vulcan-fire
- View blob: `0156a3b931357031e935f92c06b8fb8a99564168`
- Effect component blob: `c1991222d9c168030d93666846bca71120e1065b`
- Volume helper blob: `dbc5bf968fec54b1fd31eaf4d0a15663ba26d88d`

The view is a canvas/camera wrapper. The actual effect uses textured billboard particles, a time-indexed 3D fire-density texture, separate rising smoke, per-layer depth sorting, a dark ground disk, a point light, and scene-wide Bloom. The deployed `VulcanFireView-ba55d429.js` module was inspected as text and agrees with the reviewed source's default counts and palette. The site was not visually rendered during this task.

This implementation independently recreates those techniques within the dynamic component service. No upstream component, shader/helper file, or smoke image was copied. It uses Three.js's existing `ImprovedNoise` module for periodic density generation instead of the reference's `simplex-noise` and `alea` dependencies. Smoke density is generated locally, particle motion is derived from age, transformed camera-space sorting is used, and a local additive halo replaces scene-wide Bloom. Existing Three.js dependency licensing continues to apply to that imported utility.

The reviewed upstream root did not list a license file; no upstream license or redistribution grant is asserted here.
