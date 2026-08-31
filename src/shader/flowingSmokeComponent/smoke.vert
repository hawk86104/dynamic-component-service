precision mediump float;

attribute vec3 aJitter;
attribute float aLifeOffset;
attribute float aSeed;
attribute float aSizeFactor;

uniform vec3 uDirection;
uniform float uEmitterRadius;
uniform float uFlowRate;
uniform float uLifeRange;
uniform float uParticleSize;
uniform float uSizeGrowth;
uniform float uSpread;
uniform float uTime;
uniform float uTurbulence;

varying float vLife;
varying float vSeed;

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
  vec3 direction = normalize(uDirection);
  float life = fract((uTime * uFlowRate * (0.35 + aSeed * 0.9)) + aLifeOffset);
  float easedLife = smoothstep(0.0, 1.0, life);

  vec3 tangentA = orthogonal(direction);
  vec3 tangentB = normalize(cross(direction, tangentA));

  vec3 sourceOffset = tangentA * position.x * uEmitterRadius;
  sourceOffset += tangentB * position.z * uEmitterRadius;
  sourceOffset += direction * position.y * uEmitterRadius;

  float spreadDistance = uSpread * pow(easedLife, 0.72);
  vec3 lateral = tangentA * aJitter.x * spreadDistance;
  lateral += tangentB * aJitter.z * spreadDistance;

  float turbulenceA = noise1(aSeed * 23.0 + uTime * 0.75 + easedLife * 9.0) * 2.0 - 1.0;
  float turbulenceB = noise1(aSeed * 41.0 + uTime * 0.58 + easedLife * 11.0) * 2.0 - 1.0;
  float turbulenceC = noise1(aSeed * 59.0 + uTime * 0.43 + easedLife * 13.0) * 2.0 - 1.0;
  float turbulenceEnvelope = uTurbulence * (0.18 + easedLife * 0.82);
  lateral += tangentA * (
    sin((uTime * 0.8) + aSeed * 12.0 + easedLife * 8.0) * 0.55
    + turbulenceA * 0.45
  ) * turbulenceEnvelope;
  lateral += tangentB * (
    cos((uTime * 0.65) + aJitter.y * 6.2831 + easedLife * 7.0) * 0.55
    + turbulenceB * 0.45
  ) * turbulenceEnvelope;

  float upwardDrift = max(0.0, 1.0 - abs(direction.y)) * easedLife * uTurbulence * 0.35;
  float forwardJitter = turbulenceC * uTurbulence * (0.08 + easedLife * 0.2);

  vec3 particlePosition = sourceOffset;
  particlePosition += direction * (easedLife * uLifeRange + forwardJitter);
  particlePosition += lateral;
  particlePosition += vec3(0.0, upwardDrift, 0.0);

  csm_Position = particlePosition;
  csm_PointSize = uParticleSize * mix(1.0, uSizeGrowth, easedLife) * aSizeFactor;

  vLife = easedLife;
  vSeed = aSeed;
}
