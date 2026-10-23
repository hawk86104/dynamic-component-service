uniform vec3 uColor;
uniform float uOpacity;
uniform float uGlow;
varying float vHeight;
varying vec3 vNormal;
varying vec3 vView;

void main() {
  vec3 n = normalize(vNormal);
  float fresnel = pow(1.0 - abs(dot(n, normalize(vView))), 2.5);
  float light = 0.6 + 0.4 * max(dot(n, normalize(vec3(-0.3, 0.8, 0.7))), 0.0);
  vec3 pigment = uColor * mix(0.38, 1.1, pow(vHeight, 0.6));
  vec3 color = pigment * light + (uColor + vec3(0.16)) * fresnel * uGlow;
  color += vec3(0.18) * pow(vHeight, 12.0) * uGlow;
  gl_FragColor = vec4(color, uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
