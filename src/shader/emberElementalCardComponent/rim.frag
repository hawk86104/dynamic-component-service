#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
uniform vec3 uColor;
uniform vec3 uCoreColor;
uniform float uShoulder;
uniform float uWidth;
uniform float uTime;
uniform float uIntensity;
uniform float uOpacity;
uniform float uSoft;
varying vec2 vUv;
varying float vHeight;

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  float upper = smoothstep(uShoulder - uWidth * 0.1, uShoulder + uWidth * 0.4, vHeight);
  float flicker = 0.78 + sin(vUv.x * 37.0 - uTime * 5.0) * 0.12 + sin(vUv.x * 91.0 + uTime * 2.8) * 0.10;
  float alpha = uOpacity * uIntensity * flicker * mix(0.78, 0.19, uSoft);
  vec3 color = mix(uColor, uCoreColor, upper * (1.0 - uSoft) * 0.8);
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
