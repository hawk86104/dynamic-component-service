uniform vec3 uBottomColor;
uniform vec3 uTopColor;
uniform float uBottomOpacity;
uniform float uGradientProgress;
uniform float uTopOpacity;

varying float vHeightProgress;

void main() {
  float gradientProgress = max(uGradientProgress, 0.0001);
  float t = clamp(vHeightProgress / gradientProgress, 0.0, 1.0);
  vec3 color = mix(uBottomColor, uTopColor, t);
  float alpha = mix(uBottomOpacity, uTopOpacity, t);

  if (alpha <= 0.001) {
    discard;
  }

  csm_DiffuseColor = vec4(color, alpha);
}
