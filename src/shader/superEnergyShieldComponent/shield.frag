#define MAX_HITS 6

uniform float uTime;
uniform vec3 uColor;
uniform float uLife;
uniform float uHexScale;
uniform float uEdgeWidth;
uniform float uFresnelPower;
uniform float uFresnelStrength;
uniform float uOpacity;
uniform float uReveal;
uniform float uFlashSpeed;
uniform float uFlashIntensity;
uniform float uNoiseScale;
uniform vec3 uNoiseEdgeColor;
uniform float uNoiseEdgeWidth;
uniform float uNoiseEdgeIntensity;
uniform float uNoiseEdgeSmoothness;
uniform float uHexOpacity;
uniform float uShowHex;
uniform float uFlowScale;
uniform float uFlowSpeed;
uniform float uFlowIntensity;
uniform vec3 uHitPos[MAX_HITS];
uniform float uHitTime[MAX_HITS];
uniform float uHitRingSpeed;
uniform float uHitRingWidth;
uniform float uHitMaxRadius;
uniform float uHitDuration;
uniform float uHitIntensity;
uniform float uHitImpactRadius;
uniform float uFadeStart;

varying vec3 vShieldNormal;
varying vec3 vShieldViewDir;
varying vec3 vShieldObjPos;

vec3 mod289v3(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289v4(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289v4(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 c = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 d = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, c.yyy));
  vec3 x0 = v - i + dot(i, c.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + c.xxx;
  vec3 x2 = x0 - i2 + c.yyy;
  vec3 x3 = x0 - d.yyy;
  i = mod289v3(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * d.wyz - d.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

vec3 lifeColor(float life) {
  return mix(vec3(1.0, 0.08, 0.04), uColor, life);
}

float hexPattern(vec2 p) {
  p *= uHexScale;
  const vec2 s = vec2(1.0, 1.7320508);
  vec4 hC = floor(vec4(p, p - vec2(0.5, 1.0)) / s.xyxy) + 0.5;
  vec4 h = vec4(p - hC.xy * s, p - (hC.zw + 0.5) * s);
  vec2 cell = (dot(h.xy, h.xy) < dot(h.zw, h.zw)) ? h.xy : h.zw;
  cell = abs(cell);
  float d = max(dot(cell, s * 0.5), cell.x);
  return smoothstep(0.5 - uEdgeWidth, 0.5, d);
}

vec2 hexCellId(vec2 p) {
  p *= uHexScale;
  const vec2 s = vec2(1.0, 1.7320508);
  vec4 hC = floor(vec4(p, p - vec2(0.5, 1.0)) / s.xyxy) + 0.5;
  vec4 h = vec4(p - hC.xy * s, p - (hC.zw + 0.5) * s);
  return (dot(h.xy, h.xy) < dot(h.zw, h.zw)) ? hC.xy : hC.zw + 0.5;
}

float cellFlash(vec2 cellId) {
  float rnd = fract(sin(dot(cellId, vec2(127.1, 311.7))) * 43758.5453);
  float phase = rnd * 6.2831;
  float speed = 0.5 + rnd * 1.5;
  return smoothstep(0.6, 1.0, sin(uTime * uFlashSpeed * speed + phase)) * uFlashIntensity;
}

void main() {
  float fresnel = pow(1.0 - dot(vShieldNormal, vShieldViewDir), uFresnelPower) * uFresnelStrength;

  vec3 noiseSamplePos = vShieldObjPos * uNoiseScale + vec3(uTime * 0.18, -uTime * 0.13, uTime * 0.11);
  float noise = snoise(noiseSamplePos) * 0.5 + 0.5;
  float noiseWidth = max(0.002, uNoiseEdgeWidth);
  float noiseSoftness = mix(0.01, 0.22, uNoiseEdgeSmoothness);
  float noiseStrength = clamp(uNoiseEdgeIntensity / 10.0, 0.0, 1.0);
  float noiseContour = 1.0 - smoothstep(noiseWidth, noiseWidth + noiseSoftness, abs(noise - 0.5));
  float noiseBreakup = mix(1.0, mix(0.72, 1.0, noise), noiseStrength * 0.45);
  float noiseEdgeMask = noiseContour * smoothstep(0.08, 0.9, fresnel);

  float t = uTime * uFlowSpeed;
  float fn1 = snoise(vShieldObjPos * uFlowScale + vec3(t, t * 0.6, t * 0.4));
  float fn2 = snoise(vShieldObjPos * uFlowScale * 2.1 + vec3(-t * 0.5, t * 0.9, t * 0.3));
  float flowNoise = (fn1 * 0.6 + fn2 * 0.4) * 0.5 + 0.5;

  vec3 absN = abs(normalize(vShieldObjPos));
  float dominance = max(absN.x, max(absN.y, absN.z));
  float hexFade = smoothstep(0.65, 0.85, dominance);

  vec2 faceUV;
  if (absN.x >= absN.y && absN.x >= absN.z) {
    faceUV = vShieldObjPos.yz;
  } else if (absN.y >= absN.z) {
    faceUV = vShieldObjPos.xz;
  } else {
    faceUV = vShieldObjPos.xy;
  }

  float hex = hexPattern(faceUV) * hexFade;
  vec2 cId = hexCellId(faceUV);
  float flash = cellFlash(cId) * hexFade;

  vec3 normPos = normalize(vShieldObjPos);
  float ringContrib = 0.0;
  float hexHitBoost = 0.0;

  for (int i = 0; i < MAX_HITS; i++) {
    float ht = uHitTime[i];
    float elapsed = uTime - ht;
    float isActive = step(0.0, ht) * step(0.0, elapsed) * step(elapsed, uHitDuration);
    float dist = acos(clamp(dot(normPos, normalize(uHitPos[i])), -1.0, 1.0));

    float ringR = min(elapsed * uHitRingSpeed, uHitMaxRadius);
    float noiseD = snoise(normPos * 5.0 + vec3(elapsed * 2.0)) * 0.05;
    float ring = smoothstep(uHitRingWidth, 0.0, abs(dist + noiseD - ringR));
    float fade = 1.0 - smoothstep(uHitDuration * 0.5, uHitDuration, elapsed);
    float radialFade = 1.0 - smoothstep(uHitMaxRadius * 0.75, uHitMaxRadius, ringR);
    ringContrib += ring * fade * radialFade * isActive;

    float zone = smoothstep(uHitImpactRadius, 0.0, dist);
    float zoneFade = 1.0 - smoothstep(0.0, uHitDuration * 0.35, elapsed);
    hexHitBoost += zone * zoneFade * isActive;
  }

  ringContrib = min(ringContrib, 2.0);
  hexHitBoost = min(hexHitBoost, 1.0);

  vec3 lColor = lifeColor(uLife);
  float effectiveHexOpacity = (uHexOpacity + hexHitBoost * uHitIntensity) * uShowHex;
  float intensity = hex * effectiveHexOpacity * (0.3 + fresnel * 0.7) + fresnel * 0.4 + flash * uShowHex;

  vec3 shieldColor = lColor * intensity * 2.0;
  shieldColor += lColor * (flowNoise * fresnel * uFlowIntensity);
  shieldColor += lColor * ringContrib * uHitIntensity;
  shieldColor += uNoiseEdgeColor * noiseEdgeMask * noiseStrength * (0.35 + fresnel * 0.65);

  float alpha = clamp(intensity * uOpacity * noiseBreakup + noiseEdgeMask * noiseStrength * 0.45, 0.0, 1.0);
  float normY = vShieldObjPos.y / 1.8;
  alpha *= smoothstep(-1.0, uFadeStart, normY);

  csm_DiffuseColor = vec4(shieldColor, alpha);
}
