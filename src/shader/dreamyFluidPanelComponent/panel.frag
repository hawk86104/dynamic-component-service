precision mediump float;

uniform vec3 uBaseColor;
uniform vec3 uSheenColor;
uniform vec3 uHighlightColor;
uniform float uPanelLength;
uniform float uPanelWidth;
uniform float uOpacity;
uniform float uTileDensity;
uniform float uSequinSize;
uniform float uWaveSpeed;
uniform float uWaveIntensity;
uniform float uShimmerSpeed;
uniform float uSparkleIntensity;
uniform float uTime;

varying vec2 vUv;
varying vec3 vViewBitangent;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
varying vec3 vViewTangent;

#define TAU 6.28318530718
#define SQRT3 1.7320508

float hash21(vec2 value) {
  value = fract(value * vec2(233.34, 851.73));
  value += dot(value, value + 23.45);
  return fract(value.x * value.y);
}

vec2 hash22(vec2 value) {
  float n = hash21(value);
  return vec2(n, hash21(value + n * 47.0));
}

vec4 hexTile(vec2 value, float scale) {
  value *= scale;

  vec2 stride = vec2(1.0, SQRT3);
  vec2 halfStride = stride * 0.5;

  vec2 baseA = floor(value / stride);
  vec2 localA = mod(value, stride) - halfStride;

  vec2 valueOffset = value - halfStride;
  vec2 baseB = floor(valueOffset / stride);
  vec2 localB = mod(valueOffset, stride) - halfStride;

  float distA = dot(localA, localA);
  float distB = dot(localB, localB);
  float useA = step(distA, distB);

  vec2 localCoord = mix(localB, localA, useA);
  vec2 cellId = mix(baseB + vec2(0.5), baseA, useA);

  return vec4(localCoord, cellId);
}

float waveField(vec2 cellPosition, float timeValue) {
  float wave = 0.0;

  wave += sin(dot(cellPosition, vec2(0.7, 0.5)) * 3.5 - timeValue * 2.8) * 0.35;
  wave += sin(cellPosition.x * 4.2 + timeValue * 1.9) * 0.25;

  float radiusA = length(cellPosition - vec2(-0.3, 0.2));
  wave += sin(radiusA * 6.0 - timeValue * 3.2) * 0.2 * smoothstep(1.2, 0.0, radiusA);

  wave += sin(dot(cellPosition, vec2(-0.4, 0.8)) * 2.8 - timeValue * 1.5) * 0.2;

  float radiusB = length(cellPosition - vec2(0.4, -0.3));
  wave += sin(radiusB * 5.0 - timeValue * 2.4) * 0.15 * smoothstep(1.0, 0.0, radiusB);

  return wave * uWaveIntensity;
}

float sequinSpecular(float tiltAngle, float tiltDirection, vec3 viewDirection) {
  float cosTilt = cos(tiltAngle);
  float sinTilt = sin(tiltAngle);
  float cosDirection = cos(tiltDirection);
  float sinDirection = sin(tiltDirection);

  vec3 localNormal = vec3(sinTilt * cosDirection, sinTilt * sinDirection, cosTilt);
  vec3 normalDirection = normalize(
    vViewTangent * localNormal.x
    + vViewBitangent * localNormal.y
    + vViewNormal * localNormal.z
  );

  vec3 lightDirection = normalize(vec3(0.4, 0.6, 0.9));
  vec3 reflectionDirection = reflect(-lightDirection, normalDirection);
  float reflected = max(dot(reflectionDirection, viewDirection), 0.0);

  float spec = pow(reflected, 48.0);
  float sheen = pow(reflected, 8.0) * 0.15;

  return spec + sheen;
}

void main() {
  vec2 rectUv = vUv * 2.0 - 1.0;
  float minPanelSize = max(min(uPanelLength, uPanelWidth), 0.0001);
  vec2 panelScale = vec2(uPanelLength, uPanelWidth) / minPanelSize;
  vec2 panelUv = rectUv * panelScale;
  float timeValue = uTime * uWaveSpeed;
  vec3 viewDirection = normalize(-vViewPosition);

  vec4 hex = hexTile(panelUv, uTileDensity);
  vec2 localPosition = hex.xy;
  vec2 cellId = hex.zw;
  vec2 randomValue = hash22(cellId);

  float sizeVariation = 0.82 + randomValue.x * 0.34;
  float baseTilt = (randomValue.y - 0.5) * 0.15;
  float reflectivityVariation = 0.72 + randomValue.x * 0.28;
  float phaseOffset = randomValue.y * TAU;

  float discRadius = uSequinSize * sizeVariation;
  float distanceToCenter = length(localPosition);
  float discMask = smoothstep(discRadius, discRadius - 0.06, distanceToCenter);
  float bevel = smoothstep(discRadius, discRadius - 0.04, distanceToCenter)
    - smoothstep(discRadius - 0.04, discRadius - 0.08, distanceToCenter);

  vec2 cellPosition = cellId / max(uTileDensity, 0.0001);
  float wave = waveField(cellPosition, timeValue);
  float shimmer = sin(uTime * uShimmerSpeed * 3.0 + phaseOffset) * 0.04;
  float tiltAngle = wave * 0.85 + baseTilt + shimmer;

  float waveX = waveField(cellPosition + vec2(0.01, 0.0), timeValue);
  float waveY = waveField(cellPosition + vec2(0.0, 0.01), timeValue);
  float tiltDirection = atan(waveY - wave, waveX - wave);

  float spec = sequinSpecular(tiltAngle, tiltDirection, viewDirection);
  spec *= reflectivityVariation * uSparkleIntensity;

  float facing = clamp(cos(tiltAngle) * 0.5 + 0.5, 0.0, 1.0);
  vec3 darkBase = uBaseColor * 0.08;
  vec3 gapColor = mix(uBaseColor * 0.1, darkBase, 0.55);
  vec3 sequinColor = mix(darkBase, uBaseColor, facing * 0.72 + 0.16);

  float sheenAmount = pow(max(facing, 0.0), 3.0) * 0.24 * reflectivityVariation;
  sequinColor += uSheenColor * sheenAmount;

  float flashLow = smoothstep(0.0, 0.28, spec);
  float flashHigh = smoothstep(0.24, 0.82, spec);
  float flashPeak = smoothstep(0.72, 1.0, spec);
  sequinColor += uSheenColor * flashLow * 0.45;
  sequinColor += mix(uSheenColor, uHighlightColor, 0.55) * flashHigh * 0.72;
  sequinColor += uHighlightColor * flashPeak * 1.18;
  sequinColor += uSheenColor * bevel * facing * 0.24;

  float edgeDistance = max(abs(rectUv.x), abs(rectUv.y));
  float edgeFade = 1.0 - smoothstep(0.92, 1.0, edgeDistance);
  float vignette = 1.0 - smoothstep(0.42, 1.22, length(panelUv));
  float glow = smoothstep(0.68, 0.0, length(panelUv - vec2(0.1, -0.08))) * 0.12;

  vec3 color = mix(gapColor, sequinColor, discMask);
  color *= 0.8 + 0.2 * vignette;
  color += uSheenColor * glow;
  color = pow(max(color, vec3(0.0)), vec3(0.95, 0.98, 1.02));

  float alpha = mix(0.7, 1.0, discMask);
  alpha *= edgeFade;
  alpha *= uOpacity;

  if (alpha < 0.02) {
    discard;
  }

  csm_DiffuseColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
