#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
uniform vec3 uColor;
uniform float uTime;
uniform float uLayer;
uniform float uRimIntensity;
uniform float uIntensity;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  float facing = pow(max(0.0, dot(normalize(vNormal), normalize(vViewPosition))), mix(0.8, 2.4, uLayer));
  float current = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(vUv.x * 31.4159 - uTime * 2.6), 3.0);
  float alpha = facing * current * mix(0.65, 0.16, uLayer) * uRimIntensity * uIntensity * uOpacity;
  if (alpha < 0.003) { discard; }
  gl_FragColor = vec4(mix(uColor, vec3(0.8, 1.0, 0.94), (1.0 - uLayer) * 0.28), alpha);
  #include <colorspace_fragment>
}
