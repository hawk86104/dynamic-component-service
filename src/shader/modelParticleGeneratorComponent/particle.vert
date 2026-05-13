precision mediump float;

attribute float aSeed;
attribute float aLifeOffset;
attribute float aTrailOffset;
attribute float aSizeFactor;

uniform float uTime;
uniform vec3 uWindDir;
uniform float uParticleSpeed;
uniform float uTrailLength;
uniform float uParticleSize;
uniform float uTurbulence;
uniform float uWorldScale;

varying float vLife;
varying float vSeed;
varying float vTrail;

float hash11(float value) {
  return fract(sin(value * 127.1) * 43758.5453123);
}

float noise1(float value) {
  float base = floor(value);
  float fraction = fract(value);
  float smoothFraction = fraction * fraction * (3.0 - 2.0 * fraction);
  return mix(hash11(base), hash11(base + 1.0), smoothFraction);
}

vec3 orthogonal(vec3 value) {
  vec3 reference = abs(value.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  return normalize(cross(value, reference));
}

void main() {
  vec3 windDir = normalize(uWindDir);
  vec3 tangentA = orthogonal(windDir);
  vec3 tangentB = normalize(cross(windDir, tangentA));

  float baseSpeed = 0.3 * (0.4 + aSeed * 0.9);
  float life = fract(uTime * uParticleSpeed * baseSpeed + aLifeOffset + aTrailOffset);
  float eased = smoothstep(0.0, 1.0, life);

  float turbPhaseA = aSeed * 23.0 + uTime * 0.75 + eased * 9.0;
  float turbPhaseB = aSeed * 41.0 + uTime * 0.58 + eased * 11.0;
  float turbPhaseC = aSeed * 59.0 + uTime * 0.43 + eased * 13.0;
  float turbA = noise1(turbPhaseA) * 2.0 - 1.0;
  float turbB = noise1(turbPhaseB) * 2.0 - 1.0;
  float turbC = noise1(turbPhaseC) * 2.0 - 1.0;

  float lateralScale = uTurbulence * (0.08 + eased * 0.55);
  vec3 lateral = tangentA * turbA * lateralScale;
  lateral += tangentB * turbB * lateralScale;
  lateral += tangentA * sin(uTime * 0.9 + aSeed * 12.0 + eased * 6.0) * uTurbulence * 0.12;
  lateral += tangentB * cos(uTime * 0.75 + aSeed * 8.0 + eased * 5.0) * uTurbulence * 0.12;
  lateral += windDir * turbC * uTurbulence * 0.08 * eased;

  // 拖尾长度直接控制粒子沿风向的推进距离，与速度解耦
  float distance = eased * uTrailLength;

  vec3 particlePosition = position + windDir * distance + lateral;

  vec4 modelViewPosition = modelViewMatrix * vec4(particlePosition, 1.0);
  // uWorldScale 用于补偿父级 world scale（例如 gisPlaneEditor 里 scaleFactor=200 的父级）
  // 父级放大会让相机空间 -mvZ 同比变大，pointSize 因此变成亚像素而被 fragment discard
  float perspective = clamp(220.0 / max(1.0, -modelViewPosition.z), 0.0, 220.0);
  csm_Position = particlePosition;
  csm_PointSize = uParticleSize * uWorldScale * mix(1.35, 0.35, eased) * aSizeFactor * perspective;

  vLife = eased;
  vSeed = aSeed;
  vTrail = aTrailOffset;
}
