# Third-Party Notice

The Three.js projector and shader approach in this component is adapted from:

- Project: `hh-hang/vid3d-projection`
- Source: https://github.com/hh-hang/vid3d-projection
- Files reviewed: `src/three-video-projection.ts`, `src/shaders/three-video-projection.vert.glsl`, `src/shaders/three-video-projection.frag.glsl`
- Revision: `4984b709aac73a3a6f9163c1162898d841999f94`
- License: MIT

The adaptation uses the host Three.js renderer, Vue/Tres lifecycle, non-destructive receiver proxies, alpha-aware depth materials, dynamic target discovery, and the existing 2D component's orientation conventions. It does not bundle Cesium or the camera calibration tools.

---

MIT License

Copyright (c) 2026 屈航

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
