#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
uniform vec3 uColor;
uniform float uIntensity;
uniform float uOpacity;
varying float vCurl;
varying float vFade;
varying float vAngle;

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  return length(p - a - ab * clamp(dot(p - a, ab) / max(dot(ab, ab), 0.00001), 0.0, 1.0));
}

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  vec2 p = gl_PointCoord - 0.5;
  float c = cos(vAngle);
  float s = sin(vAngle);
  p = mat2(c, -s, s, c) * p;
  float shape;
  if (vCurl > 0.5) {
    float distance = 1.0;
    vec2 previous = vec2(0.0, -0.31);
    for (int i = 1; i <= 12; i++) {
      float t = float(i) / 12.0;
      vec2 next = vec2(sin(t * 6.283185) * 0.12, (t - 0.5) * 0.62);
      distance = min(distance, segmentDistance(p, previous, next));
      previous = next;
    }
    float aa = max(fwidth(distance), 0.012);
    shape = 1.0 - smoothstep(0.022, 0.022 + aa, distance);
    shape += exp(-distance * 30.0) * 0.18;
  } else {
    shape = exp(-dot(p * vec2(1.3, 0.7), p * vec2(1.3, 0.7)) * 65.0);
  }
  float alpha = shape * vFade * uIntensity * uOpacity;
  if (alpha < 0.004) { discard; }
  gl_FragColor = vec4(mix(uColor, vec3(0.82, 1.0, 0.95), 0.25), alpha);
  #include <colorspace_fragment>
}
