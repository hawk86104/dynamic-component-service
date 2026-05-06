uniform float uTime;
uniform float uProgress;
uniform float uPulseSpeed;
uniform float uPulseIntensity;

varying vec3 vCoreNormal;
varying vec3 vCoreObjPos;
varying vec3 vCoreViewDir;

void main() {
  float progress = smoothstep(0.0, 1.0, uProgress);
  float breathe = sin(uTime * uPulseSpeed * 6.2831853) * uPulseIntensity * 0.05;
  float startup = mix(0.22, 1.0, progress);
  vec3 displaced = position * startup * (1.0 + breathe * progress);

  vCoreObjPos = displaced;
  vCoreNormal = normalize(normalMatrix * normal);
  vec4 viewPosition = modelViewMatrix * vec4(displaced, 1.0);
  vCoreViewDir = normalize(-viewPosition.xyz);

  csm_Position = displaced;
}
