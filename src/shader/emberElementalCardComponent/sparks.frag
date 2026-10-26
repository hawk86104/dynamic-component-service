#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
uniform vec3 uColor;
uniform vec3 uCoreColor;
uniform float uOpacity;
uniform float uIntensity;
varying float vFade;
varying float vTriangle;
varying float vRotation;
varying float vSeed;

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 delta = b - a;
  return length(p - a - delta * clamp(dot(p - a, delta) / dot(delta, delta), 0.0, 1.0));
}

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  vec2 p = gl_PointCoord - 0.5;
  float shape;
  if (vTriangle > 0.5) {
    p = mat2(cos(vRotation), -sin(vRotation), sin(vRotation), cos(vRotation)) * p;
    vec2 a = vec2(0.0, -0.31);
    vec2 b = vec2(0.27, 0.16);
    vec2 c = vec2(-0.27, 0.16);
    float edgeDistance = min(segmentDistance(p, a, b), min(segmentDistance(p, b, c), segmentDistance(p, c, a)));
    float aa = max(fwidth(edgeDistance), 0.007);
    shape = 1.0 - smoothstep(0.018, 0.018 + aa, edgeDistance);
    shape += exp(-edgeDistance * 28.0) * 0.12;
  } else {
    shape = exp(-dot(p, p) * 62.0);
    shape += exp(-dot(p, p) * 13.0) * 0.16;
  }
  float alpha = shape * vFade * uOpacity * min(uIntensity, 1.6);
  if (alpha < 0.004) { discard; }
  vec3 color = mix(uColor, uCoreColor, mix(0.62 + vSeed * 0.38, 0.95, vTriangle));
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
