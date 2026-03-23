precision mediump float;

uniform vec3 uColor;
uniform float uDensity;
uniform float uOpacity;

varying float vLife;
varying float vSeed;

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

  return mix(
    mix(a, b, smoothFraction.x),
    mix(c, d, smoothFraction.x),
    smoothFraction.y
  );
}

float fbm(vec2 value) {
  float result = 0.0;
  float amplitude = 0.5;

  for (int index = 0; index < 4; index += 1) {
    result += noise2(value) * amplitude;
    value *= 2.02;
    amplitude *= 0.5;
  }

  return result;
}

void main() {
  vec2 centered = gl_PointCoord - vec2(0.5);
  float angle = vSeed * 6.2831;
  mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  vec2 warped = rotation * centered;

  float contourNoise = fbm(warped * 5.5 + vec2(vSeed * 3.7, vLife * 4.2));
  float pocketNoise = fbm(warped * 9.0 - vec2(vLife * 2.8, vSeed * 5.1));
  vec2 irregular = warped;
  irregular.x += (contourNoise - 0.5) * 0.2;
  irregular.y += (pocketNoise - 0.5) * 0.2;

  float dist = length(irregular);
  float edgeRadius = 0.5 + (contourNoise - 0.5) * 0.14;
  float coreRadius = 0.25 + (pocketNoise - 0.5) * 0.12;
  float edge = smoothstep(edgeRadius, 0.1, dist);
  float core = smoothstep(coreRadius, 0.0, dist);

  float fadeIn = smoothstep(0.0, 0.12, vLife);
  float fadeOut = 1.0 - smoothstep(0.58, 1.0, vLife);
  float alpha = edge * core * fadeIn * fadeOut;
  alpha *= mix(0.45, 1.0, uDensity);
  alpha *= uOpacity;

  if (alpha < 0.01) {
    discard;
  }

  vec3 color = mix(uColor * 0.78, uColor * 1.08, clamp(0.95 - vLife * 0.45 + vSeed * 0.08, 0.0, 1.0));
  csm_DiffuseColor = vec4(color, alpha);
}
