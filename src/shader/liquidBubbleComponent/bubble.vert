precision mediump float;

attribute vec3 aJitter;
attribute float aLifeOffset;
attribute float aSeed;
attribute float aSizeFactor;

uniform float uBubbleSize;
uniform float uBubbleSpeed;
uniform float uBubbleSpread;
uniform float uDepth;
uniform float uHalfWidth;
uniform float uHeight;
uniform float uRadius;
uniform float uShapeType;
uniform float uTime;

varying float vLife;
varying float vPointSize;
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

void main() {
  float life = fract((uTime * uBubbleSpeed * mix(0.72, 1.26, aSeed)) + aLifeOffset);
  float easedLife = smoothstep(0.0, 1.0, life);

  float halfDepth = uDepth * 0.5;
  vec3 particlePosition = vec3(0.0);

  if (uShapeType < 0.5) {
    particlePosition.x = position.x * uHalfWidth * 0.86;
    particlePosition.z = position.z * halfDepth * 0.86;
  }
  else {
    particlePosition.x = position.x * uRadius * 0.82;
    particlePosition.z = position.z * uRadius * 0.82;
  }

  float bottom = -uHeight * 0.5 + uHeight * 0.06;
  float top = uHeight * 0.5 - uHeight * 0.08;
  float travel = max(top - bottom, 0.0001);

  float driftScaleX = mix(uHalfWidth, uRadius, step(0.5, uShapeType)) * uBubbleSpread;
  float driftScaleZ = mix(halfDepth, uRadius, step(0.5, uShapeType)) * uBubbleSpread;
  float wobblePhase = uTime * mix(0.8, 1.55, aSeed) + aJitter.z * 6.2831;
  float turbulence = noise1(aSeed * 29.0 + uTime * 0.55 + easedLife * 11.0) * 2.0 - 1.0;

  particlePosition.x += sin(wobblePhase + easedLife * 8.0) * driftScaleX * (0.08 + easedLife * 0.16);
  particlePosition.z += cos(wobblePhase * 0.87 + easedLife * 7.0) * driftScaleZ * (0.08 + easedLife * 0.15);
  particlePosition.x += aJitter.x * driftScaleX * 0.06 + turbulence * driftScaleX * 0.08;
  particlePosition.z += aJitter.y * driftScaleZ * 0.06 - turbulence * driftScaleZ * 0.06;
  particlePosition.y = bottom + position.y * 0.08 * uHeight + easedLife * travel;

  if (uShapeType < 0.5) {
    particlePosition.x = clamp(particlePosition.x, -uHalfWidth * 0.9, uHalfWidth * 0.9);
    particlePosition.z = clamp(particlePosition.z, -halfDepth * 0.9, halfDepth * 0.9);
  }
  else {
    float radialLength = length(particlePosition.xz);
    float radialLimit = uRadius * 0.88;
    if (radialLength > radialLimit) {
      particlePosition.xz *= radialLimit / max(radialLength, 0.0001);
    }
  }

  vec4 modelViewPosition = modelViewMatrix * vec4(particlePosition, 1.0);
  float perspective = clamp(80.0 / max(1.0, -modelViewPosition.z), 0.45, 10.0);
  float pointSize = uBubbleSize * mix(0.78, 1.22, easedLife) * aSizeFactor * perspective;

  csm_Position = particlePosition;
  csm_PointSize = clamp(pointSize, 1.0, 18.0);

  vLife = easedLife;
  vPointSize = pointSize;
  vSeed = aSeed;
}
