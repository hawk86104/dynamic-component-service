precision mediump float;

uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;
uniform float uRandomness;
uniform float uSpeed;
uniform float uSurfaceRadius;
uniform float uIsCircular;

varying vec2 vUv;
varying float vWaveStrength;

float hash12(vec2 value) {
  return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vUv = uv;

  vec3 displacedPosition = position;
  float radialFactor = 1.0;

  if (uIsCircular > 0.5) {
    float dist = length(position.xy) / max(0.0001, uSurfaceRadius);
    radialFactor = 1.0 - smoothstep(0.72, 1.0, dist);
  }

  float waveA = sin((position.x + uTime * uSpeed) * uFrequency);
  float waveB = cos((position.y - uTime * uSpeed * 0.82) * uFrequency * 1.17);
  float waveC = sin((position.x * 0.55 - position.y * 0.85) * (uFrequency * 1.58) + uTime * uSpeed * 1.22);
  float randomPhase = hash12(position.xy * 3.7) * 6.2831;
  float randomRipple = sin((position.x * 1.2 + position.y * 1.6) * (uFrequency * 0.92) + uTime * uSpeed * 0.74 + randomPhase);
  float baseWave = (waveA + waveB) * 0.5;
  float layeredWave = mix(baseWave, (baseWave * 0.56 + waveC * 0.24 + randomRipple * 0.2), clamp(uRandomness, 0.0, 1.0));
  displacedPosition.z += layeredWave * uAmplitude * radialFactor;
  vWaveStrength = layeredWave;

  csm_Position = displacedPosition;
}
