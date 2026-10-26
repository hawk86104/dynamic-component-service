uniform float uWidth;
uniform float uHeight;
uniform float uDepth;
attribute vec2 surface;
varying vec3 vChart;
varying vec2 vSurface;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLocalPosition;

#include <common>
#include <logdepthbuf_pars_vertex>

void main() {
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vChart = vec3(position.x / max(uWidth, 0.001) + 0.5, position.y / max(uHeight, 0.001), position.z / max(uDepth * 0.5, 0.001));
  vSurface = surface;
  vNormal = normalize(normalMatrix * normal);
  vView = -viewPosition.xyz;
  vLocalPosition = position;
  gl_Position = projectionMatrix * viewPosition;
  #include <logdepthbuf_vertex>
}
