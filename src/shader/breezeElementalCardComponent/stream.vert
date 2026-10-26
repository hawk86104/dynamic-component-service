#include <common>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
attribute vec3 aAcross;
attribute vec4 aSeed;
attribute float aLane;
uniform float uTime;
uniform float uWidth;
uniform float uStreamWidth;
uniform float uTurbulence;
uniform float uLayer;
varying vec2 vUv;
varying vec4 vSeed;
varying float vLane;

void main() {
  vUv = uv;
  vSeed = aSeed;
  vLane = aLane;
  float wave = sin(uv.x * 15.0 - uTime * 1.15 + aSeed.w * 21.0) + sin(uv.x * 29.0 - uTime * 0.8 + aSeed.x * 9.0) * 0.25;
  vec3 p = position + aAcross * wave * uTurbulence * uWidth * 0.006;
  float scale = mix(0.48 + aSeed.y * 0.65, 6.0 + aSeed.y * 8.0, uLayer);
  float taper = 0.35 + 0.65 * pow(max(sin(uv.x * 3.14159265), 0.0), 0.4);
  p += aAcross * (uv.y * 2.0 - 1.0) * uStreamWidth * scale * taper;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
