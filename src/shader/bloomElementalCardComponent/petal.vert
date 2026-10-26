#include <common>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
uniform vec3 uCenter;
uniform float uBaseY;
uniform float uOpen;
uniform float uTime;
uniform float uSway;
uniform float uIndex;
uniform float uWidth;
varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
  vUv = uv;
  vec3 rootPosition = position + uCenter;
  rootPosition.xz *= mix(0.28, 1.0, uOpen);
  rootPosition.y = uBaseY + (rootPosition.y - uBaseY) * mix(0.65, 1.0, uOpen);
  float sway = sin(uTime * 0.85 + uIndex * 1.7 + uv.x * 3.0) * uSway * uv.x * uv.x * uWidth * 0.12;
  rootPosition += normal * sway;
  vec4 mvPosition = modelViewMatrix * vec4(rootPosition - uCenter, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
