uniform vec3 uStart;
uniform vec3 uMiddle;
uniform vec3 uEnd;
uniform float uOpacity;
uniform float uGlow;
varying vec2 vChart;
varying vec3 vNormal;
varying vec3 vView;

void main() {
  float x = clamp(vChart.x, 0.0, 1.0);
  vec3 pigment = x < 0.5 ? mix(uStart, uMiddle, x * 2.0) : mix(uMiddle, uEnd, (x - 0.5) * 2.0);
  float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.0);
  float light = 0.55 + 0.45 * max(dot(normalize(vNormal), normalize(vec3(-0.2, 0.8, 0.7))), 0.0);
  float heightFade = mix(0.28, 1.0, pow(clamp(vChart.y, 0.0, 1.0), 0.45));
  vec3 color = pigment * light * heightFade + pigment * fresnel * uGlow * 0.65;
  gl_FragColor = vec4(color, uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
