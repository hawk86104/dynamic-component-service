precision highp float;

uniform vec3 uBaseColor;
uniform vec3 uGlowColor;
uniform vec3 uHighlightColor;
uniform vec3 uCoreColor;
uniform float uTime;              // 这里接收的是组件的 phase (由速度驱动)
uniform float uProgress;
uniform float uBladeCount;
uniform float uSwirlIntensity;
uniform float uNoiseScale;
uniform float uCoreIntensity;
uniform float uSparkleIntensity;
uniform float uOpacity;

varying vec3 vLocal;
varying vec3 vCamLocal;

// ---- 基础噪声工具 ----

float hash13(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

float valueNoise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, u.x);
  float nx10 = mix(n010, n110, u.x);
  float nx01 = mix(n001, n101, u.x);
  float nx11 = mix(n011, n111, u.x);

  return mix(mix(nx00, nx10, u.y), mix(nx01, nx11, u.y), u.z);
}

// 3 层 FBM 增加破碎感
float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * valueNoise3D(p);
    p *= 2.05;
    a *= 0.5;
  }
  return v;
}

// ---- 光线与单位圆柱 (xz^2 <= 1, |y| <= 1) 相交 ----
vec2 rayCylinder(vec3 ro, vec3 rd) {
  vec2 ox = ro.xz;
  vec2 dx = rd.xz;
  float a = dot(dx, dx);
  float b = dot(ox, dx);
  float c = dot(ox, ox) - 1.0;

  float tN = -1e9;
  float tF = 1e9;

  // 侧壁
  if (a > 1e-6) {
    float disc = b * b - a * c;
    if (disc < 0.0) {
      return vec2(1.0, -1.0);
    }
    float sq = sqrt(disc);
    tN = max(tN, (-b - sq) / a);
    tF = min(tF, (-b + sq) / a);
  }
  else {
    // 射线几乎平行 y 轴，起点必须在圆内
    if (c > 0.0) {
      return vec2(1.0, -1.0);
    }
  }

  // 顶底盖
  if (abs(rd.y) > 1e-6) {
    float tTop = (1.0 - ro.y) / rd.y;
    float tBot = (-1.0 - ro.y) / rd.y;
    tN = max(tN, min(tTop, tBot));
    tF = min(tF, max(tTop, tBot));
  }
  else {
    // 射线平行 xz 平面
    if (abs(ro.y) > 1.0) {
      return vec2(1.0, -1.0);
    }
  }

  return vec2(tN, tF);
}

// 圆柱边缘柔化: 侧壁和上下盖都要消退, 避免硬边
float cylinderEdgeFade(vec3 p) {
  float rxz = length(p.xz);
  float fadeSide = smoothstep(1.0, 0.82, rxz);
  float fadeY = smoothstep(1.0, 0.78, abs(p.y));
  return fadeSide * fadeY;
}

// ---- 体积密度场 ----
float densityAt(vec3 p, float progress) {
  float ringY = -0.6;
  float baseRingR = mix(1.05, 0.55, progress);

  float rxz = length(p.xz);
  float theta = atan(p.z, p.x);
  float heightAbove = max(p.y - ringY, 0.0);

  // 用 phase 驱动的旋转
  float rotation = uTime * (0.35 + progress * 1.0);

  // 1) 让能量环不再是完美圆: 低频角向扰动
  float wobble =
      0.14 * sin(theta * 3.0 + uTime * 0.7)
    + 0.08 * sin(theta * 5.0 - uTime * 0.45)
    + 0.05 * sin(theta * 7.0 + uTime * 0.3);
  float ringR = baseRingR + wobble * mix(0.35, 0.55, 1.0 - progress);

  // 呼吸节奏, 让厚度和核心大小一起轻微起伏
  float breath = 0.5 + 0.5 * sin(uTime * 1.1 + progress * 2.5);

  float ringThickness = mix(0.4, 0.12, progress) * (0.8 + breath * 0.35);
  float ringHeight = mix(0.22, 0.1, progress);

  // 螺旋角, 越到外圈弯曲越多
  float bladeAngle = theta + rotation + rxz * uSwirlIntensity * (0.8 + progress * 1.2);

  // 2) 能量环带
  float radialBand = exp(-pow((rxz - ringR) / max(ringThickness, 0.03), 2.0));
  float ringBandY = exp(-pow((p.y - ringY) / max(ringHeight, 0.03), 2.0));
  float ring = radialBand * ringBandY;

  // 3) 旋臂叶片: progress 越大越尖锐
  float bladeCount = max(uBladeCount, 1.0);
  float bladeSharp = mix(1.5, 5.5, progress);
  float bladeSig = pow(max(cos(bladeAngle * bladeCount), 0.0), bladeSharp);

  // 叶片沿高度衰减, 用 smoothstep 削尖火焰头
  float flameLength = mix(0.45, 1.2, progress);
  float flameCut = smoothstep(1.55, 0.0, heightAbove);
  // 让每片叶片在角向有轻微独立的脉动
  float flameFlicker = 1.0 + 0.32 * sin(theta * bladeCount + uTime * 2.2 + rxz * 3.0);
  float flameProfile = exp(-heightAbove / flameLength) * flameCut * flameFlicker;

  float blade = bladeSig * radialBand * (ringBandY * 0.4 + flameProfile * 0.95);

  // 4) progress 早期: 外圈游离的散射碎片
  float scatter = smoothstep(0.0, 0.45, 1.0 - progress);
  float scatterBand = exp(-pow((rxz - 1.12) / 0.3, 2.0));
  float scatterSig = pow(max(cos(bladeAngle * bladeCount * 0.55 - uTime * 1.3), 0.0), 6.0);
  blade += scatter * scatterSig * scatterBand * 0.6;

  // 5) 棱角"能量刺": 在环外侧再加一圈更细更尖的叶片
  float spikeBand = exp(-pow((rxz - ringR - 0.17) / 0.11, 2.0));
  float spikeSig = pow(max(cos(bladeAngle * bladeCount * 2.0), 0.0), 9.0);
  float spikes = spikeSig * spikeBand * smoothstep(0.25, 0.85, progress) * 0.55;
  blade += spikes;

  // 6) FBM 让形状更灵动, 破除规则感
  float n = fbm(vec3(theta * 1.7, p.y * 2.1 + uTime * 0.35, rxz * 3.2) * uNoiseScale);
  blade *= 0.45 + n * 1.15;

  // 7) 中心核心光球
  float coreActivation = smoothstep(0.55, 1.0, progress);
  vec3 corePos = vec3(0.0, ringY + 0.32, 0.0);
  float coreSize = mix(0.22, 0.14, progress) * (0.88 + breath * 0.24);
  float coreDist = length(p - corePos);
  float core = exp(-pow(coreDist / coreSize, 2.0)) * coreActivation * uCoreIntensity;

  // 8) 火花点缀
  float sparkleSeed = hash13(floor(vec3(theta * 9.0, p.y * 8.0, rxz * 9.0))
    + floor(uTime * 3.0));
  float sparkle = pow(sparkleSeed, 16.0) * radialBand * uSparkleIntensity;

  float total = ring * 0.55 + blade * 1.0 + core * 1.6 + sparkle * 0.6;
  total *= cylinderEdgeFade(p);
  total *= mix(0.7, 1.0, progress);

  return max(total, 0.0);
}

vec3 sampleColor(vec3 p, float density, float progress) {
  float rxz = length(p.xz);
  float ringR = mix(1.05, 0.55, progress);
  float ringEdge = exp(-pow((rxz - ringR) / 0.1, 2.0));

  float coreActivation = smoothstep(0.55, 1.0, progress);
  float coreNear = exp(-length(p - vec3(0.0, -0.28, 0.0)) * 5.2) * coreActivation;

  vec3 col = mix(uBaseColor * 0.35, uGlowColor, clamp(density * 1.8, 0.0, 1.0));
  col = mix(col, uHighlightColor, clamp(ringEdge * 0.65, 0.0, 1.0));
  col = mix(col, uCoreColor, clamp(coreNear, 0.0, 1.0));

  return col;
}

const int STEPS = 44;

void main() {
  float p = clamp(uProgress, 0.0, 1.0);

  vec3 ro = vCamLocal;
  vec3 rd = normalize(vLocal - vCamLocal);

  vec2 hit = rayCylinder(ro, rd);
  float tN = max(hit.x, 0.0);
  float tF = hit.y;

  if (tF <= tN) {
    discard;
  }

  float marchLen = tF - tN;
  float stepSize = marchLen / float(STEPS);

  // 抖动起点消除层纹 (用 phase 参与, 速度 0 时抖动也冻结, 但不影响视觉稳定)
  float jitter = hash13(vLocal + uTime * 0.17) * stepSize;

  vec4 accum = vec4(0.0);

  for (int i = 0; i < STEPS; i++) {
    float t = tN + (float(i) + 0.5) * stepSize + jitter;
    if (t > tF) break;

    vec3 pos = ro + rd * t;
    float d = densityAt(pos, p);
    if (d > 0.002) {
      vec3 c = sampleColor(pos, d, p);
      float a = 1.0 - exp(-d * stepSize * 5.0);
      accum.rgb += c * a * (1.0 - accum.a);
      accum.a += a * (1.0 - accum.a);
      if (accum.a > 0.98) break;
    }
  }

  float alpha = clamp(accum.a, 0.0, 1.0) * uOpacity;
  if (alpha < 0.01) {
    discard;
  }

  csm_DiffuseColor = vec4(clamp(accum.rgb, 0.0, 1.5), alpha);
}
