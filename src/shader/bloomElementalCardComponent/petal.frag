#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
#include <elemental_common>
uniform vec3 uColor;
uniform vec3 uTipColor;
uniform float uTime;
uniform float uIndex;
uniform float uOpen;
uniform float uGlowPass;
uniform float uEdgeBrightness;
uniform float uVeinStrength;
uniform float uIntensity;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  vec3 surface = cross(dFdx(vViewPosition), dFdy(vViewPosition));
  vec3 n = surface * inversesqrt(max(dot(surface, surface), 0.0000000001));
  vec3 viewDirection = normalize(vViewPosition);
  float fresnel = pow(clamp(1.0 - abs(dot(n, viewDirection)), 0.0, 1.0), 1.8);
  float across = abs(vUv.y * 2.0 - 1.0);
  float broadRim = pow(across, 4.5) * 0.8 + pow(vUv.x, 16.0) * 0.48;
  float fineRim = smoothstep(0.88, 0.995, across) + pow(vUv.x, 28.0);
  float fan = (vUv.y * 2.0 - 1.0) * 20.0 + sin(vUv.x * 3.14159265) * 1.6;
  float veins = pow(0.5 + 0.5 * cos(fan), 18.0) * (0.06 + vUv.x * 0.11);
  veins += pow(0.5 + 0.5 * cos(fan * 3.1 + vUv.x * 2.0), 24.0) * 0.035;
  veins *= uVeinStrength;
  float grain = ecHash(vec3(floor(vUv * vec2(480.0, 190.0)), uIndex * 3.17)) - 0.5;
  float shimmer = 0.96 + 0.04 * sin(uTime * 0.65 + vUv.x * 4.0 + uIndex);
  float root = smoothstep(0.0, 0.085, vUv.x) * smoothstep(0.015, 0.13, uOpen);
  vec3 color;
  float alpha;
  if (uGlowPass > 0.5) {
    float band = pow(across, 3.5) * 0.6 + pow(vUv.x, 18.0) * 0.45;
    alpha = band * 0.21 * uEdgeBrightness * uOpacity * root;
    color = uTipColor;
  } else {
    float pearl = clamp((broadRim * 0.75 + fresnel * 0.38 + veins) * uEdgeBrightness, 0.0, 1.0);
    color = mix(uColor * (0.58 + vUv.x * 0.15 + grain * 0.12), uTipColor, pearl);
    color += uTipColor * (fineRim * 0.5 + veins * 0.5) * uEdgeBrightness;
    color *= shimmer * (0.8 + uIntensity * 0.23);
    alpha = uOpacity * (0.5 + broadRim * 0.32 + fresnel * 0.18 + grain * 0.07) * root;
  }
  alpha *= 1.0 - smoothstep(0.985, 1.0, across);
  if (alpha < 0.005) { discard; }
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
