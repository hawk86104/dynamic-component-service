#include <common>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
attribute vec3 aCenter;
uniform float uCoronaWidth;
uniform float uLayerScale;
uniform float uTime;
uniform float uPulse;
varying vec3 vLocal;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

void main() {
  float ripple = 1.0 + sin(uv.x * 81.0 + uTime * 1.1) * uPulse * 0.02;
  vec3 p = aCenter + (position - aCenter) * (uCoronaWidth / 0.014) * uLayerScale * ripple;
  vLocal = p;
  vUv = uv;
  vViewNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
