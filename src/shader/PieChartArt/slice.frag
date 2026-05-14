uniform vec3 uAccentColor;
uniform vec3 uBottomColor;
uniform float uEndAngle;
uniform float uGradientCurve;
uniform float uGradientDirection;
uniform float uGradientFromY;
uniform float uGradientToY;
uniform float uInnerRadius;
uniform float uMaxY;
uniform float uMinY;
uniform float uRadius;
uniform float uStartAngle;
uniform vec3 uTopColor;

varying vec3 vPieLocalPosition;

const float PC_TAU = 6.28318530718;

float remapGradient(float value) {
  float fromValue = clamp(uGradientFromY, 0.0, 1.0);
  float toValue = clamp(uGradientToY, 0.0, 1.0);
  float rangeValue = max(toValue - fromValue, 0.0001);
  float t = clamp((value - fromValue) / rangeValue, 0.0, 1.0);
  return pow(t, max(uGradientCurve, 0.0001));
}

void main() {
  vec3 localPosition = vPieLocalPosition;
  float heightRange = max(uMaxY - uMinY, 0.0001);
  float vertical = clamp((localPosition.y - uMinY) / heightRange, 0.0, 1.0);
  float radial = clamp(
    (length(localPosition.xz) - uInnerRadius) / max(uRadius - uInnerRadius, 0.0001),
    0.0,
    1.0
  );

  float angle = atan(-localPosition.z, localPosition.x);
  float angular = clamp(
    mod(angle - uStartAngle + PC_TAU, PC_TAU) / max(uEndAngle - uStartAngle, 0.0001),
    0.0,
    1.0
  );

  float source = vertical;

  if (uGradientDirection > 1.5) {
    source = angular;
  }
  else if (uGradientDirection > 0.5) {
    source = radial;
  }

  float t = remapGradient(source);
  vec3 color = mix(uBottomColor, uTopColor, t);

  float topSheen = smoothstep(0.55, 1.0, vertical);
  float outerRim = smoothstep(0.82, 1.0, radial);
  float innerRim = smoothstep(0.08, 0.0, radial) * step(0.001, uInnerRadius);
  float angularEdge = smoothstep(0.08, 0.0, min(angular, 1.0 - angular));
  color += uAccentColor * (topSheen * 0.08 + outerRim * 0.07 + innerRim * 0.05 + angularEdge * 0.035);

  csm_DiffuseColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
