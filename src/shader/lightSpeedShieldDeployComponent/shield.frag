uniform float uTime;
uniform float uProgress;
uniform float uRadius;
uniform vec3 uShellColor;
uniform vec3 uHexColor;
uniform vec3 uRimColor;
uniform float uOpacity;
uniform float uHexScale;
uniform float uHexWidth;
uniform float uHexOpacity;
uniform float uFresnelStrength;
uniform float uSweepWidth;
uniform float uSweepIntensity;
uniform float uNoiseScale;
uniform float uNoiseSpeed;

varying vec3 vShieldNormal;
varying vec3 vShieldObjPos;
varying vec3 vShieldViewDir;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

float hexDistance(vec2 p) {
  p *= uHexScale;
  const vec2 s = vec2(1.0, 1.7320508);
  vec4 hC = floor(vec4(p, p - vec2(0.5, 1.0)) / s.xyxy) + 0.5;
  vec4 h = vec4(p - hC.xy * s, p - (hC.zw + 0.5) * s);
  vec2 cell = (dot(h.xy, h.xy) < dot(h.zw, h.zw)) ? h.xy : h.zw;
  cell = abs(cell);
  return max(dot(cell, s * 0.5), cell.x);
}

vec2 hexCellId(vec2 p) {
  p *= uHexScale;
  const vec2 s = vec2(1.0, 1.7320508);
  vec4 hC = floor(vec4(p, p - vec2(0.5, 1.0)) / s.xyxy) + 0.5;
  vec4 h = vec4(p - hC.xy * s, p - (hC.zw + 0.5) * s);
  return (dot(h.xy, h.xy) < dot(h.zw, h.zw)) ? hC.xy : hC.zw + 0.5;
}

void main() {
  vec3 normal = normalize(vShieldNormal);
  vec3 viewDir = normalize(vShieldViewDir);
  float viewFacing = clamp(dot(normal, viewDir), 0.0, 1.0);
  float fresnel = pow(1.0 - viewFacing, 2.15) * uFresnelStrength;

  float progress = smoothstep(0.0, 1.0, uProgress);
  float centerDistance = clamp(1.0 - viewFacing, 0.0, 1.0);
  float revealHead = progress * (1.0 + uSweepWidth * 0.8) - 0.02;
  float reveal = smoothstep(centerDistance - uSweepWidth, centerDistance + uSweepWidth, revealHead);
  float sweep = 1.0 - smoothstep(0.0, max(0.001, uSweepWidth), abs(centerDistance - revealHead));

  vec2 frontUv = vShieldObjPos.xy / max(0.001, uRadius);
  vec2 flowUv = frontUv * uNoiseScale + vec2(uTime * uNoiseSpeed, -uTime * uNoiseSpeed * 0.62);
  float flow = fbm(flowUv + fbm(flowUv + 2.7));
  float shimmer = 0.72 + flow * 0.48;

  float dist = hexDistance(frontUv);
  float hexLine = smoothstep(0.5 - uHexWidth, 0.5, dist);
  float hexFill = 1.0 - smoothstep(0.34, 0.5, dist);
  vec2 cellId = hexCellId(frontUv);
  float cellRand = hash(cellId);
  float cellFlash = smoothstep(0.72, 1.0, sin(uTime * (1.2 + cellRand * 1.8) + cellRand * 6.2831853) * 0.5 + 0.5);

  float frontGlow = pow(viewFacing, 3.2);
  float deploySpark = sweep * (0.45 + hexLine * 0.95 + cellFlash * 0.35);
  float tileAlpha = (hexFill * (0.18 + cellRand * 0.14) + hexLine * uHexOpacity) * reveal;
  float shellAlpha = (frontGlow * 0.16 + tileAlpha + fresnel * 0.42 + deploySpark * uSweepIntensity * 0.28) * uOpacity;

  vec3 color = uShellColor * (frontGlow * 0.55 + hexFill * 0.2 * reveal);
  color += uHexColor * (hexLine * uHexOpacity * (1.2 + cellFlash * 0.5) * reveal);
  color += uRimColor * (fresnel * (0.85 + flow * 0.35) + deploySpark * uSweepIntensity);
  color *= shimmer;

  csm_DiffuseColor = vec4(color, clamp(shellAlpha, 0.0, 1.0));
}
