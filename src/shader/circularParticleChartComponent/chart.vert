precision highp float;

attribute float aAngle;
attribute float aBand;
attribute float aRadius;
attribute float aSeed;
attribute float aSizeFactor;

uniform float uParticleSize;
uniform float uScanSpeed;
uniform float uTime;

varying float vAlpha;
varying float vBand;
varying float vScan;
varying float vSeed;

const float TAU = 6.28318530718;
const float SCAN_ANGULAR_SPEED = 2.25;

void main() {
  float speedMagnitude = abs(uScanSpeed);
  float direction = uScanSpeed < 0.0 ? -1.0 : 1.0;
  float sweepAngle = mod(uTime * speedMagnitude * SCAN_ANGULAR_SPEED * direction, TAU);
  float trailDelta = mod((sweepAngle - aAngle) * direction + TAU, TAU);
  float scanTrail = exp(-trailDelta * 1.55) * (1.0 - smoothstep(1.95, 2.85, trailDelta));
  float ringSpark = 0.5 + 0.5 * sin(aRadius * 58.0 - trailDelta * 9.5 + aSeed * 19.0);
  float scan = scanTrail * (0.48 + ringSpark * 0.34);

  float idleWave = 0.5 + 0.5 * sin(uTime * (0.42 + speedMagnitude * 0.5) + aSeed * TAU + aRadius * 22.0);
  float pulse = smoothstep(0.0, 1.0, scan) * (0.82 + idleWave * 0.18);
  float driftAngle = aAngle + sin(uTime * 0.18 + aSeed * 17.0) * 0.006;
  float driftRadius = aRadius + sin(uTime * 0.23 + aSeed * 23.0 + aBand * 2.4) * 0.004;
  float radius = clamp(driftRadius, 0.0, 1.06);

  vec3 particlePosition = position;
  particlePosition.x = cos(driftAngle) * radius * length(position.xz) / max(aRadius, 0.001);
  particlePosition.z = sin(driftAngle) * radius * length(position.xz) / max(aRadius, 0.001);
  particlePosition.y += pulse * (0.055 + aBand * 0.035) + idleWave * 0.008;

  vec4 modelViewPosition = modelViewMatrix * vec4(particlePosition, 1.0);
  float perspective = clamp(10.0 / max(1.0, -modelViewPosition.z), 0.55, 2.5);
  gl_Position = projectionMatrix * modelViewPosition;
  gl_PointSize = uParticleSize * aSizeFactor * perspective * (0.52 + idleWave * 0.22 + pulse * 1.68 + aBand * 0.14);

  vAlpha = mix(0.12, 0.52, smoothstep(0.1, 1.0, aRadius)) + scan * 0.72 + aBand * 0.08;
  vBand = aBand;
  vScan = scan;
  vSeed = aSeed;
}
