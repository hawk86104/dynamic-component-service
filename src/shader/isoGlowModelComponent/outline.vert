#include <common>
#include <batching_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

uniform vec2 isoViewport;
uniform float isoOutlineWidth;

void main() {
  #include <batching_vertex>
  #include <morphinstance_vertex>
  #include <beginnormal_vertex>
  #include <morphnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <morphtarget_vertex>
  #include <skinning_vertex>
  #include <project_vertex>

  vec3 isoNormal = transformedNormal;
  #ifdef FLIP_SIDED
    isoNormal = -isoNormal;
  #endif
  vec2 isoDirection = (projectionMatrix * vec4(isoNormal, 0.0)).xy;
  isoDirection /= max(length(isoDirection), 0.00001);
  gl_Position.xy += isoDirection * isoOutlineWidth * 2.0 / max(isoViewport, vec2(1.0)) * gl_Position.w;

  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
