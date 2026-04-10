uniform float uTubeRadius;
uniform float uGradientAngle;

varying float vBlastRingBlend;

void main() {
  float radialDistance = length(vec2(position.x, position.z));
  float localRadial = radialDistance - 1.0;
  float localVertical = -position.y;

  float cosAngle = cos(uGradientAngle);
  float sinAngle = sin(uGradientAngle);
  float projected = localRadial * cosAngle + localVertical * sinAngle;

  vBlastRingBlend = clamp(abs(projected) / max(0.001, uTubeRadius), 0.0, 1.0);
  csm_Position = position;
}
