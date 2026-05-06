uniform float uTime;
uniform float uProgress;
uniform float uStartScale;
uniform float uPulseSpeed;
uniform float uPulseIntensity;

varying vec3 vShieldNormal;
varying vec3 vShieldObjPos;
varying vec3 vShieldViewDir;

void main() {
  float progress = smoothstep(0.0, 1.0, uProgress);
  float deployScale = mix(uStartScale, 1.0, progress);
  float deployWave = sin((1.0 - progress) * 3.1415926);
  float surfaceRipple = sin((position.y * 2.2 + length(position.xz) * 4.5 - uTime * 5.0) * 4.0);
  float pulse = sin(uTime * uPulseSpeed * 6.2831853) * uPulseIntensity * 0.018 * progress;
  vec3 displaced = position * deployScale + normal * (surfaceRipple * deployWave * 0.035 + pulse);

  vShieldObjPos = displaced;
  vShieldNormal = normalize(normalMatrix * normal);
  vec4 viewPosition = modelViewMatrix * vec4(displaced, 1.0);
  vShieldViewDir = normalize(-viewPosition.xyz);

  csm_Position = displaced;
}
