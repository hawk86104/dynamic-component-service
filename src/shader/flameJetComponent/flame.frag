precision highp float;

uniform vec3 uCoreColor;
uniform vec3 uMidColor;
uniform vec3 uOuterColor;
uniform float uIntensity;
uniform float uJetSpeed;
uniform float uNoiseScale;
uniform float uTaperPower;
uniform float uTime;
uniform float uTurbulence;

varying vec2 vFlameUv;

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
  const mat2 rotation = mat2(0.8, 0.6, -0.6, 0.8);
  float result = 0.0;
  float amplitude = 0.5;

  for (int index = 0; index < 5; index += 1) {
    result += amplitude * noise2(value);
    value = rotation * value * 2.02;
    amplitude *= 0.5;
  }

  return result;
}

void main() {
  // x: 0 = 喷嘴根部, 1 = 火尖；y: -0.5..0.5 (中心 0)
  float axial = vFlameUv.x;
  float radial = vFlameUv.y - 0.5;

  // 火焰外轮廓：根部宽 -> 顶部尖
  float baseWidth = 0.55;
  float taper = baseWidth * (1.0 - pow(clamp(axial, 0.0, 1.0), max(uTaperPower, 0.05)) * 0.9);
  float r = abs(radial) / max(taper, 0.001);

  // 域扭曲：随 axial 越往后越剧烈，并整体随时间向 +x 滚动
  vec2 q = vec2(
    axial * 3.2 * uNoiseScale - uTime * uJetSpeed,
    radial * 4.0 * uNoiseScale + sin(uTime * 0.7) * 0.15
  );
  float n = fbm(q);
  float n2 = fbm(q * 2.1 + vec2(uTime * 0.6, 0.0));

  float turbZone = smoothstep(0.0, 1.0, axial);
  float displacedR = r - (n - 0.5) * turbZone * 1.7 * uTurbulence;

  // 火焰本体密度
  float density = 1.0 - smoothstep(0.15, 1.0, displacedR);
  density *= smoothstep(1.05, 0.55, axial);
  density *= smoothstep(0.0, 0.04, axial);
  density *= 0.78 + 0.42 * n2;

  // 热度（颜色映射用）—— 中心 + 靠近喷嘴最热
  float heat = density;
  heat *= mix(1.55, 0.42, axial);
  heat *= 1.0 - smoothstep(0.0, 1.0, abs(radial) / max(taper * 1.1, 0.001)) * 0.35;

  // 颜色梯度: 暗红(外) -> 橙(中) -> 黄(核) -> 近白
  vec3 nearWhite = mix(uCoreColor, vec3(1.0, 0.96, 0.82), 0.6);

  vec3 col = vec3(0.0);
  col = mix(col, uOuterColor, smoothstep(0.00, 0.30, heat));
  col = mix(col, uMidColor, smoothstep(0.30, 0.55, heat));
  col = mix(col, uCoreColor, smoothstep(0.55, 0.85, heat));
  col = mix(col, nearWhite, smoothstep(0.90, 1.25, heat));

  col *= uIntensity;

  float alpha = clamp(density, 0.0, 1.0);
  if (alpha < 0.01) {
    discard;
  }

  csm_DiffuseColor = vec4(col, alpha);
}
