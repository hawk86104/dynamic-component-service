#include <common>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

varying vec2 vUv;

void main() {
  vUv = uv;
  vec2 size = vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
  vec4 mvPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  mvPosition.xy += position.xy * size;
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
