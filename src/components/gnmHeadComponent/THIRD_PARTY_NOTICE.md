# Third-Party Notice

This component contains a TypeScript-integrated port derived from Google's
XR Blocks GNM browser demo and consumes model data from the Google GNM
ecosystem.

- Upstream demo: https://github.com/google/xrblocks
- XR Blocks revision reviewed: `9af0f8b7ff60547a078d71a71586d31c921214ab`
- Relevant upstream sources:
  - `demos/gnm/GNMModel.js`
  - `demos/gnm/SemanticSampler.js`
  - `demos/gnm/GNMScene.js`
- Model project: https://github.com/google/GNM
- GNM revision reviewed: `0adc2cb53b21eb5f504810dc7fd5c7977fe08a3a`
- License: Apache License 2.0
- Port changes: AbortSignal support, staged Vue lifecycle loading, Three.js
  resource ownership, compact deterministic parameters, and component-local
  visibility/material controls.

The port intentionally excludes XR Blocks renderer setup, cameras, controls,
lights, backgrounds, desktop/XR panels, keyboard shortcuts, animation drivers,
inspection overlays, and export utilities.

---

Copyright 2026 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
