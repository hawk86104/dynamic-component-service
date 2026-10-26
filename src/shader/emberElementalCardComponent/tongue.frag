#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
#include <elemental_common>
uniform vec3 uColor;
uniform vec3 uCoreColor;
uniform float uTime;
uniform float uIntensity;
uniform float uOpacity;
uniform float uCoreBrightness;
uniform float uTurbulence;
varying vec2 vUv;
varying float vSeed;
varying float vLayer;

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  float u = vUv.x;
  float across = vUv.y * 2.0 - 1.0;
  float flow = ecFbm(vec3(across * 2.8 + vSeed * 15.0, u * 2.2 - uTime * 2.4, vSeed * 7.0));
  float filament = ecNoise(vec3(across * 7.0, u * 3.0 - uTime * 3.2, vSeed * 23.0));
  float irregularSide = abs(across + (flow - 0.5) * 0.4 * uTurbulence);
  float edge = 1.0 - smoothstep(0.48 + flow * 0.21, 1.0, irregularSide);
  float holes = smoothstep(0.10 + u * 0.24, 0.64, flow + (1.0 - u) * 0.19);
  float rootFade = smoothstep(0.0, 0.075, u);
  float tipFade = 1.0 - smoothstep(0.75, 1.0, u);
  float alpha = edge * holes * rootFade * tipFade * (0.22 + filament * 0.32);
  alpha *= uIntensity * uOpacity * vLayer;
  if (alpha < 0.003) { discard; }
  float heat = pow(1.0 - u, 5.5) * (0.8 + filament * 0.2);
  vec3 color = mix(uColor * (0.7 + flow * 0.38), uCoreColor * uCoreBrightness, heat);
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
