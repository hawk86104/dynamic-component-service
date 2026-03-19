uniform vec3 uBottomColor;
uniform vec3 uTopColor;
uniform float uBottomOpacity;
uniform float uTopOpacity;

varying vec2 vUv;

void main() {
  float t = clamp(vUv.y, 0.0, 1.0);
  vec3 color = mix(uBottomColor, uTopColor, t);
  float alpha = mix(uBottomOpacity, uTopOpacity, t);

  if (alpha <= 0.001) {
    discard;
  }

  gl_FragColor = vec4(color, alpha);
}
