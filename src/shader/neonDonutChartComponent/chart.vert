uniform float uHeight;
varying float vHeight;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLocalPosition;

#include <common>
#include <logdepthbuf_pars_vertex>

void main() {
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vHeight = clamp(position.y / max(uHeight, 0.001), 0.0, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = -viewPosition.xyz;
  vLocalPosition = position;
  gl_Position = projectionMatrix * viewPosition;
  #include <logdepthbuf_vertex>
}
