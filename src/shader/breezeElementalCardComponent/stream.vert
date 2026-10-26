#include <common>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#include <elemental_common>
attribute vec4 aSeed;
uniform vec2 uCardSize;
uniform float uTime;
uniform float uStreamWidth;
uniform float uOrbitSpread;
uniform float uTurbulence;
uniform float uDepthSpread;
varying vec2 vUv;
varying float vLight;

vec3 streamPosition(float phase) {
  vec3 p = ecCapsulePoint(phase, uCardSize * vec2(1.05, 1.025));
  vec3 outward = ecCapsuleNormal(p, uCardSize * vec2(1.05, 1.025));
  float wave = sin(phase * 19.0 + uTime * 1.4 + aSeed.z * 24.0);
  float offset = uCardSize.x * (0.045 + aSeed.y * uOrbitSpread + wave * uTurbulence * 0.08);
  p += outward * offset;
  p.z = sin(phase * 6.283185 + aSeed.z * 6.283185) * uCardSize.x * uDepthSpread * (0.18 + aSeed.y * 0.6);
  return p;
}

void main() {
  vUv = uv;
  float phase = aSeed.x + uv.x * (0.18 + aSeed.w * 0.55) + uTime * (0.045 + aSeed.y * 0.035);
  vec3 p = streamPosition(phase);
  vec3 tangent = normalize(streamPosition(phase + 0.001) - p);
  vec3 across = normalize(vec3(-tangent.y, tangent.x, 0.0001));
  float taper = pow(max(sin(uv.x * 3.14159265), 0.0), 0.45);
  p += across * position.y * uStreamWidth * (0.35 + aSeed.w) * taper;
  vLight = 0.4 + aSeed.z * 0.6;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
