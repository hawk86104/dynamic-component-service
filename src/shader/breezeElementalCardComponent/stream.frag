#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
uniform vec3 uColor;
uniform float uTime;
uniform float uTrailLength;
uniform float uTrailGlow;
uniform float uLayer;
uniform float uIntensity;
uniform float uOpacity;
varying vec2 vUv;
varying vec4 vSeed;
varying float vLane;

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  float across = vUv.y * 2.0 - 1.0;
  float head = fract(vSeed.x + uTime * (0.14 + vSeed.y * 0.065));
  float behind = fract(head - vUv.x + 1.0);
  float length = uTrailLength * (0.65 + vSeed.z * 0.7);
  float packet = smoothstep(0.0, 0.014, behind) * (1.0 - smoothstep(length * 0.45, length, behind));
  float bright = pow(max(0.0, 1.0 - behind / max(length, 0.001)), 2.0) * packet;
  float envelope = smoothstep(0.0, 0.09, vUv.x) * (1.0 - smoothstep(0.84, 1.0, vUv.x));
  float ripple = 0.72 + 0.28 * sin(vUv.x * 21.0 - uTime * 1.3 + vSeed.w * 24.0);
  float alpha;
  vec3 color;
  if (uLayer > 0.5) {
    float edge = exp(-across * across * 4.8) * (1.0 - smoothstep(0.78, 1.0, abs(across)));
    alpha = edge * (0.065 + packet * 0.22) * ripple * uTrailGlow * (1.2 - vLane * 0.45);
    color = uColor * 0.86;
  } else {
    float aa = max(fwidth(across), 0.04);
    float edge = 1.0 - smoothstep(0.3, 0.72 + aa, abs(across));
    float nearCurrent = (1.0 - smoothstep(0.02, 0.2, vLane)) * 0.12;
    alpha = edge * (packet * (0.35 + bright * 0.65) + nearCurrent * ripple) * (0.55 + vSeed.z * 0.45);
    color = mix(uColor, vec3(0.87, 1.0, 0.96), 0.28 + bright * 0.67);
  }
  alpha *= envelope * uIntensity * uOpacity;
  if (alpha < 0.003) { discard; }
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
