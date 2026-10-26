#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
uniform vec3 uColor;
uniform vec3 uTipColor;
uniform float uIntensity;
uniform float uOpacity;
varying float vHeart;
varying float vFade;
varying float vAngle;
varying float vTurn;

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  vec2 p = gl_PointCoord - 0.5;
  float c = cos(vAngle);
  float s = sin(vAngle);
  p = mat2(c, -s, s, c) * p;
  float shape;
  if (vHeart > 0.5) {
    p *= vec2(3.1, -3.1);
    float a = dot(p, p) - 1.0;
    float f = a * a * a - p.x * p.x * p.y * p.y * p.y;
    vec2 gradient = vec2(6.0 * p.x * a * a - 2.0 * p.x * p.y * p.y * p.y, 6.0 * p.y * a * a - 3.0 * p.x * p.x * p.y * p.y);
    float distance = abs(f) / max(length(gradient), 0.08);
    float aa = max(fwidth(distance), 0.025);
    shape = 1.0 - smoothstep(0.045, 0.045 + aa, distance);
  } else {
    p.x /= vTurn;
    float leaf = length(p * vec2(2.9, 1.6)) + p.y * p.y * 0.65;
    float aa = max(fwidth(leaf), 0.025);
    shape = (1.0 - smoothstep(0.55, 0.55 + aa, leaf)) * (0.65 + p.y * 0.5);
  }
  float alpha = shape * vFade * uIntensity * uOpacity;
  if (alpha < 0.004) { discard; }
  gl_FragColor = vec4(mix(uColor, uTipColor, 0.4 + vHeart * 0.35), alpha);
  #include <colorspace_fragment>
}
