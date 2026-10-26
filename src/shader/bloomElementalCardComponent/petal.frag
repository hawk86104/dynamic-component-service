#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
uniform vec3 uColor;
uniform vec3 uTipColor;
uniform float uTime;
uniform float uIndex;
uniform float uIntensity;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  vec3 n = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
  vec3 viewDirection = normalize(vViewPosition);
  float fresnel = pow(1.0 - abs(dot(n, viewDirection)), 1.7);
  float across = abs(vUv.y * 2.0 - 1.0);
  float rim = pow(across, 5.0) + pow(vUv.x, 12.0);
  float spine = exp(-pow(across * 18.0, 2.0));
  float veins = pow(max(0.0, cos(vUv.y * 52.0 + vUv.x * 8.0)), 14.0) * 0.055;
  float shimmer = pow(max(0.0, sin(vUv.x * 8.0 + vUv.y * 3.0 - uTime * 0.6 + uIndex)), 12.0);
  vec3 color = mix(uColor * 0.65, uTipColor, clamp(fresnel * 0.5 + rim * 0.68 + spine * 0.18 + shimmer * 0.17, 0.0, 1.0));
  color += uTipColor * (veins + fresnel * 0.18) * uIntensity;
  float alpha = uOpacity * (0.45 + fresnel * 0.3 + rim * 0.35);
  alpha *= smoothstep(0.0, 0.06, vUv.x) * (1.0 - smoothstep(0.96, 1.0, across));
  if (alpha < 0.005) { discard; }
  gl_FragColor = vec4(color * (0.75 + uIntensity * 0.28), alpha);
  #include <colorspace_fragment>
}
