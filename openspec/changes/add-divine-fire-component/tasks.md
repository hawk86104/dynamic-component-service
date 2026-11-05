## 1. Context and contract

- [x] 1.1 Inspect the supplied view, actual effect helpers/shaders, and repository integration rules. Verifiable: design identifies the overlay algorithm and excluded scene features.
- [x] 1.2 Create proposal, design, scenarios, and task artifacts. Verifiable: OpenSpec recognizes the change as apply-ready.

## 2. Implementation

- [x] 2.1 Add shared props/defaults and bounded numeric settings. Verifiable: Vue and registry share the defaults module.
- [x] 2.2 Add surface overlay geometry and external fire/noise shaders. Verifiable: static, skinned, morph, and instanced geometry paths preserve required attributes; shaders include clipping and log depth.
- [x] 2.3 Add subject lifecycle and abortable online model loading. Verifiable: default cube, model fitting, replacement identity, stale result disposal, error retention, and resource ownership are explicit in source.
- [x] 2.4 Wire Vue reactivity, burning transitions, playback, host events, and public methods. Verifiable: tuning does not reload the subject and unmount cancels pending work.

## 3. Integration and review

- [x] 3.1 Register the component and Chinese controls, and add an illustrative catalog asset. Verifiable: every public prop has a panel control and generic preview views are unchanged.
- [x] 3.2 Document usage, model URL requirements, editor ownership, source attribution, and validation limits. Verifiable: component README matches the final implementation.
- [x] 3.3 Run targeted ESLint and read-only diff/schema review, recording results. Verifiable: new files pass lint and introduced registry diagnostics are absent; build/debug validation is explicitly skipped under AGENTS.md.
