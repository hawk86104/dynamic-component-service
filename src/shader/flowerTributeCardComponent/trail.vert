attribute float aSeed;
attribute float aTrailOffset;
attribute float aSizeFactor;
uniform mat4 uHistory[32];
uniform float uPhase;
uniform float uParticleSize;
uniform float uWorldScale;
uniform float uAmplitude;
uniform float uTurbulence;
uniform float uCardWidth;
uniform float uCornerRadius;
uniform float uTrailLength;
varying float vLife;
varying float vSeed;
varying float vTrail;
varying float vOutside;

float hash(float value) {
  return fract(sin(value * 127.1 + 311.7) * 43758.5453);
}

// Smooth random targets, independently sampled for each particle and axis.
float noise(float value) {
  float cell = floor(value);
  float blend = fract(value);
  blend = blend * blend * (3.0 - 2.0 * blend);
  return mix(hash(cell), hash(cell + 1.0), blend) * 2.0 - 1.0;
}

void main() {
  float life = fract(uPhase * (0.4 + aSeed * 0.9) + aSeed + aTrailOffset);
  float historyIndex = life * 31.0;
  int index = int(floor(historyIndex));
  vec3 previousA = (uHistory[index] * vec4(position, 1.0)).xyz;
  vec3 previousB = (uHistory[min(index + 1, 31)] * vec4(position, 1.0)).xyz;
  vec3 historical = mix(previousA, previousB, fract(historyIndex));
  vec3 displacement = historical - position;
  // Emit outward even with identity history; actual motion is added on top.
  vec2 radial = position.xy / vec2(uCardWidth, uCardWidth * 1672.0 / 941.0);
  float seedAngle = aSeed * 6.28318531;
  vec2 fallback = vec2(cos(seedAngle), sin(seedAngle));
  radial = length(radial) > 0.0001 ? normalize(radial) : fallback;
  radial = normalize(radial + fallback * 0.28);
  // Both sides receive particles, avoiding a coplanar cloud hidden by the card.
  float depth = mix(0.15, 0.4, fract(aSeed * 17.3)) * (aSeed < 0.5 ? -1.0 : 1.0);
  vec3 emissionDirection = normalize(vec3(radial, depth));
  float emissionDistance = uCardWidth * uTrailLength * 0.2 * life * (0.7 + aSeed * 0.6);
  displacement += emissionDirection * emissionDistance;
  float distanceMoved = length(displacement);
  vec3 direction = distanceMoved > 0.00001 ? displacement / distanceMoved : emissionDirection;
  vec3 reference = abs(direction.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 crossDirection = cross(direction, reference);
  vec3 tangentA = crossDirection / max(length(crossDirection), 0.00001);
  vec3 tangentB = cross(direction, tangentA);
  float phase = aSeed * 731.0 + uPhase * (1.2 + aSeed) + aTrailOffset * 19.0;
  float spread = min(distanceMoved, 2.0) * uTurbulence * sqrt(life) * 0.35;
  vec3 turbulence = (tangentA * noise(phase)
    + tangentB * noise(phase * 1.37 + 83.0)
    + direction * noise(phase * 0.73 + 157.0) * 0.25) * spread;
  vec3 particlePosition = position + (displacement + turbulence) * uAmplitude;
  // Keep the current card interior clear even when historical paths cross it.
  float radius = uCornerRadius * uCardWidth;
  vec2 halfSize = vec2(uCardWidth, uCardWidth * 1672.0 / 941.0) * 0.5;
  vec2 q = abs(particlePosition.xy) - halfSize + radius;
  float cardDistance = length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - radius;
  vOutside = step(0.00001, cardDistance);
  vec4 viewPosition = modelViewMatrix * vec4(particlePosition, 1.0);
  float perspective = clamp(220.0 / max(1.0, -viewPosition.z), 0.0, 220.0);
  csm_Position = particlePosition;
  csm_PointSize = uParticleSize * uWorldScale * mix(1.35, 0.35, life) * aSizeFactor * perspective;
  vLife = life;
  vSeed = aSeed;
  vTrail = aTrailOffset;
}
