#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
uniform vec3 uColor;
uniform vec3 uCoronaColor;
uniform float uIntensity;
uniform float uOpacity;
uniform float uSoft;
uniform float uShaftOpacity;
varying vec2 vUv;
varying float vLight;
varying float vMicro;

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  float across = vUv.y * 2.0 - 1.0;
  float core = exp(-across * across * mix(9.0, 3.0, uSoft));
  float axial = mix(pow(1.0 - vUv.x, 1.5), exp(-vUv.x * 3.2), uSoft);
  axial *= 1.0 - smoothstep(0.65, 1.0, vUv.x);
  float alpha = core * axial * vLight * uIntensity * uOpacity;
  alpha *= mix(mix(0.84, 0.65, vMicro), uShaftOpacity, uSoft);
  if (alpha < 0.003) { discard; }
  vec3 color = mix(uColor, uCoronaColor, pow(1.0 - vUv.x, 5.0) * (1.0 - uSoft * 0.7));
  gl_FragColor = vec4(color * (0.9 + uIntensity * 0.15), alpha);
  #include <colorspace_fragment>
}
