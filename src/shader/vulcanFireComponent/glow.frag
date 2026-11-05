#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;

void main() {
  vec4 diffuseColor = vec4(1.0);
  #include <clipping_planes_fragment>
  vec2 centered = (vUv - 0.5) * 2.0;
  float radius = length(centered);
  float falloff = exp(-radius * radius * 5.5) * (1.0 - smoothstep(0.6, 1.0, radius));
  float opacity = falloff * uIntensity;
  if (opacity < 0.002) { discard; }
  gl_FragColor = vec4(uColor, opacity * diffuseColor.a);
  #include <logdepthbuf_fragment>
  #include <colorspace_fragment>
}
