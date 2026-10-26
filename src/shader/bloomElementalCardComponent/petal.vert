#include <common>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
uniform vec3 uCenter;
uniform vec3 uSortCenter;
uniform vec3 uCardSize;
attribute vec3 aClosed;
attribute vec3 aHalo;
uniform float uOpen;
uniform float uTime;
uniform float uSway;
uniform float uBreath;
uniform float uGlowPass;
uniform float uIndex;
varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
  vUv = uv;
  vec3 rootPosition = mix(aClosed, position, uOpen) + uCenter;
  rootPosition += aHalo * uGlowPass * uOpen;
  float breath = sin(uTime * 0.75 + uIndex * 0.22) * uBreath * uv.x * uv.x * uOpen;
  rootPosition.x *= 1.0 + breath;
  rootPosition.y += (rootPosition.y + uCardSize.y * 0.46) * breath * 0.22;
  float sway = sin(uTime * 0.85 + uIndex * 1.7 + uv.x * 2.5) * uSway * uv.x * uv.x * uCardSize.x * 0.045 * uOpen;
  rootPosition += normal * sway;
  // Roots and partially opened petals remain behind the opaque capsule face.
  float shoulder = (uCardSize.y - uCardSize.x) * 0.5;
  float distance = length(vec2(rootPosition.x, rootPosition.y - clamp(rootPosition.y, -shoulder, shoulder))) - uCardSize.x * 0.5;
  float forward = smoothstep(0.0, uCardSize.x * 0.04, distance);
  rootPosition.z = mix(min(rootPosition.z, -uCardSize.z * 0.55 - uCardSize.x * 0.01), rootPosition.z, forward);
  vec4 mvPosition = modelViewMatrix * vec4(rootPosition - uSortCenter, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
