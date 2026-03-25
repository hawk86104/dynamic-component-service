precision mediump float;

uniform vec3 uBaseColor;
uniform vec3 uTopColor;
uniform vec3 uEdgeColor;
uniform float uOpacity;
uniform float uDensity;
uniform float uFillLevel;
uniform float uHalfHeight;
uniform float uTime;

varying vec3 vLocalPosition;
varying vec3 vWorldPosition;

float hash21(vec2 value) {
  return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise2(vec2 value) {
  vec2 base = floor(value);
  vec2 fraction = fract(value);
  vec2 smoothFraction = fraction * fraction * (3.0 - 2.0 * fraction);
  float a = hash21(base);
  float b = hash21(base + vec2(1.0, 0.0));
  float c = hash21(base + vec2(0.0, 1.0));
  float d = hash21(base + vec2(1.0, 1.0));
  return mix(mix(a, b, smoothFraction.x), mix(c, d, smoothFraction.x), smoothFraction.y);
}

void main() {
  float totalHeight = max(0.0001, uHalfHeight * 2.0);
  float normalizedHeight = clamp((vLocalPosition.y + uHalfHeight) / totalHeight, 0.0, 1.0);

  if (normalizedHeight > uFillLevel) {
    discard;
  }

  float filledHeightRatio = clamp(normalizedHeight / max(0.0001, uFillLevel), 0.0, 1.0);
  float swirl = noise2(vWorldPosition.xz * 1.4 + vec2(uTime * 0.18, -uTime * 0.12));
  float ribbon = sin(vWorldPosition.x * 2.8 + uTime * 1.1) * 0.5 + 0.5;
  vec3 gradientColor = mix(uBaseColor, uTopColor, clamp(filledHeightRatio * 0.92 + swirl * 0.12, 0.0, 1.0));
  float topEdge = smoothstep(max(uFillLevel - 0.08, 0.0), uFillLevel, normalizedHeight);
  vec3 color = mix(gradientColor, uEdgeColor, topEdge * 0.62 + ribbon * 0.08);

  float alpha = uOpacity * mix(0.48, 1.0, uDensity);
  alpha *= mix(0.92, 1.08, swirl);
  alpha *= 0.78 + filledHeightRatio * 0.22;

  if (alpha <= 0.01) {
    discard;
  }

  csm_DiffuseColor = vec4(color, min(alpha, 1.0));
}
