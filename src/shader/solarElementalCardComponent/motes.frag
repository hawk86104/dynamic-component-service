#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
uniform vec3 uColor;
uniform vec3 uCoronaColor;
uniform float uIntensity;
uniform float uOpacity;
varying float vFade;
varying float vRing;
varying float vLife;

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  vec2 p = gl_PointCoord - 0.5;
  float r = length(p);
  float shape;
  if (vRing > 0.5) {
    float edge = abs(r - 0.275);
    float aa = max(fwidth(r), 0.009);
    shape = 1.0 - smoothstep(0.02, 0.02 + aa, edge);
    shape += exp(-edge * 27.0) * 0.12;
  } else {
    shape = exp(-dot(p, p) * 60.0) + exp(-dot(p, p) * 15.0) * 0.12;
  }
  float alpha = shape * vFade * uIntensity * uOpacity;
  if (alpha < 0.004) { discard; }
  vec3 color = mix(uCoronaColor, uColor, 0.18 + vLife * 0.45 + vRing * 0.15);
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
