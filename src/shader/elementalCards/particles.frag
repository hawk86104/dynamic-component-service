#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
uniform vec3 uColor;
uniform float uOpacity;
uniform float uIntensity;
uniform float uKind;
varying float vFade;
varying float vSeed;

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  vec2 p = gl_PointCoord - 0.5;
  float r = length(p);
  float shape = exp(-dot(p, p) * 45.0);
  if (uKind > 0.5 && uKind < 1.5 && vSeed > 0.6) {
    shape = exp(-pow((r - 0.26) * 27.0, 2.0));
  } else {
    shape += exp(-abs(p.x) * 65.0 - abs(p.y) * 12.0) * 0.45;
    shape += exp(-abs(p.y) * 65.0 - abs(p.x) * 12.0) * 0.45;
  }
  float alpha = shape * vFade * uOpacity * min(uIntensity, 2.0);
  if (alpha < 0.005) { discard; }
  gl_FragColor = vec4(mix(uColor, vec3(1.0), vSeed * 0.4), alpha);
  #include <colorspace_fragment>
}
