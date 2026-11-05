# Validation record — 2026-11-05

## Initial completed static checks

- Targeted ESLint on `vulcanFireComponent.vue`, `defaults.ts`, `particles.ts`, and `textures.ts`: zero errors and zero warnings.
- ESLint on `src/dcsConfig.ts`: 208 pre-existing formatting errors. Linting its `HEAD` version and the working version produced exactly the same diagnostic signatures (rule, message, column): 208 before, 208 after. The new import/entry introduces no lint errors. Unrelated formatting was not changed.
- Read-only TypeScript AST inspection: all 34 public props match shared defaults and the 34 registry panel controls; all 24 numeric props have bounds.
- Relative import inspection: all 13 relative component/helper/shader imports resolve.
- Registry asset inspection: both preview fields resolve to the new local SVG; the component file exists.
- Shader source inspection: all five shader files reference existing Three.js chunks and include logarithmic-depth and clipping paths. Fragment shaders provide the diffuse alpha variable used by the alpha-to-coverage clipping branch.
- SVG parsed successfully as XML; its title and description identify it as an illustration.
- Reviewed timer cancellation, texture replacement/disposal, owned geometry/material/light cleanup, warmed particle traits, transformed depth sorting, and pause behavior in source.
- Generic preview files and dependency/lock files have no changes.

## Initially skipped

During initial implementation, per the user's project instruction and `AGENTS.md`, no build, dev/serve/preview command, server startup, browser debugging, or screenshots were run. The initial catalog asset was an illustrative SVG. The later explicitly requested recording is documented below.

The fire-volume noise, analytical particle motion, and local halo are independently implemented equivalents of the reference techniques; exact visual parity has not been verified.

## Requested catalog recording — 2026-11-05

- Reused the existing local service at `http://localhost:5173/`; no build/dev/serve command or server startup was performed. The user explicitly requested the recording and browser verification.
- Opened a dedicated preview tab with default component parameters. Only the recording camera and debug/helper visibility were changed temporarily; the original user preview tab was preserved. Temporary state and viewport were restored after capture.
- Captured the real Tres-rendered WebGL canvas at 900×600: 40 distinct frames, measured intervals of 82–84 ms, fixed camera, native fire/smoke animation. The preview console contained no warnings or errors during this capture.
- Encoded `public/preview/animated/vulcanFireComponent.webp`: 600×400, 40 decoded frames, 3333 ms, infinite loop, quality 82, 112286 bytes. `vulcanFireComponent.poster.webp` is 3240 bytes and matches the decoded first animation frame exactly.
- Reviewed the decoded contact sheet for complete motion bounds and absence of debug overlays. Verified the homepage poster loads at 600×400; hovering produces `data-preview-state="playing"`, a fully loaded 600×400 animation and opacity 1; pointer leave returns to `poster` with only the poster image mounted.
- Raw frames, measured capture manifest, decoded contact sheet, encoding report, and homepage screenshot are under `.cache/preview-capture/vulcanFireComponent-20261105-run2/` (ignored capture artifacts).
- Created and exercised the user skill `tvt-dc-preview-capture`, including real rendered-canvas capture, measured playback timing, exact poster extraction, and single-component homepage registration. Schema validation and JavaScript syntax checks passed; the encoder was also checked for overwrite protection and rejection of identical frames.
- Additional build/debug validation remains skipped per `AGENTS.md`. This focused recording does not establish cross-driver GPU compatibility, live GIS editor integration, or exact visual parity with the reference site.
