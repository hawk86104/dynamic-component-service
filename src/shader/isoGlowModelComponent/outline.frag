#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

uniform vec3 isoOutlineColor;
uniform float isoOutlineOpacity;

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  gl_FragColor = vec4(isoOutlineColor, isoOutlineOpacity);
  #include <colorspace_fragment>
}
