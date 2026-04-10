uniform float uBandWidth;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uFresnelColor;
uniform float uFresnelEmission;
uniform float uFresnelPower;
uniform float uGradientSpeed;
uniform float uTailY;
uniform float uTime;
uniform float uTipY;

varying float vBlastPosY;
varying vec3 vBlastNormal;

void main() {
  float travel = (uTipY - vBlastPosY) / max(0.001, uTipY - uTailY);
  float scrolled = fract(travel - uTime * uGradientSpeed);

  float wave = sin(scrolled * 3.14159265);
  float blend = pow(max(0.0, wave), max(0.01, 1.0 / uBandWidth));
  float stageOne = clamp(blend * 2.0, 0.0, 1.0);
  float stageTwo = clamp(blend * 2.0 - 1.0, 0.0, 1.0);
  vec3 color = mix(mix(uColorA, uColorC, stageOne), uColorB, stageTwo);

  float fresnel = pow(1.0 - abs(dot(normalize(vBlastNormal), vec3(0.0, 0.0, 1.0))), uFresnelPower);
  color += uFresnelColor * fresnel * uFresnelEmission;

  csm_DiffuseColor = vec4(color, 1.0);
}
