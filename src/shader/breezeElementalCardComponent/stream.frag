#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
uniform vec3 uColor;
uniform float uTime;
uniform float uIntensity;
uniform float uOpacity;
varying vec2 vUv;
varying float vLight;

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  float across = vUv.y * 2.0 - 1.0;
  float edge = exp(-across * across * 7.0);
  float envelope = smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.7, 1.0, vUv.x));
  float flow = pow(max(0.0, sin(vUv.x * 18.0 - uTime * 3.0 + vLight * 11.0)), 10.0);
  float alpha = edge * envelope * (0.28 + flow * 0.72) * vLight * uIntensity * uOpacity;
  if (alpha < 0.003) { discard; }
  gl_FragColor = vec4(mix(uColor, vec3(0.88, 1.0, 0.97), flow * 0.5), alpha);
  #include <colorspace_fragment>
}
