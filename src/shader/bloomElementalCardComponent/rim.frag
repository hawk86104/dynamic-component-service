#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
uniform vec3 uTipColor;
uniform vec3 uColor;
uniform float uTime;
uniform float uLayer;
uniform float uEdgeBrightness;
uniform float uIntensity;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  float facing = pow(max(0.0, dot(normalize(vNormal), normalize(vViewPosition))), mix(1.0, 2.0, uLayer));
  float pearl = 0.72 + sin(vUv.x * 6.283185 + uTime * 0.35) * 0.12;
  float alpha = facing * pearl * mix(0.46, 0.13, uLayer) * uEdgeBrightness * uIntensity * uOpacity;
  if (alpha < 0.003) { discard; }
  gl_FragColor = vec4(mix(uTipColor, uColor, uLayer * 0.55), alpha);
  #include <colorspace_fragment>
}
