#include <common>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
uniform float uTime;
uniform float uWidth;
uniform float uTurbulence;
varying vec2 vUv;
varying float vHeight;

void main() {
  float flicker = sin(uv.x * 42.0 - uTime * 4.0) * sin(uv.x * 17.0 + uTime * 2.1);
  vec3 p = position + normal * flicker * uWidth * uTurbulence * 0.003;
  vUv = uv;
  vHeight = position.y;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
