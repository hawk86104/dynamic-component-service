precision mediump float;

uniform float uCameraTilt;
uniform vec3 uDeepColor;
uniform float uFresnelStrength;
uniform vec3 uMoonColor;
uniform float uMoonGlow;
uniform float uOpacity;
uniform float uPanelSize;
uniform float uRippleSpeed;
uniform vec3 uShallowColor;
uniform float uTime;
uniform float uWaveIntensity;

varying vec2 vUv;
varying vec3 vViewBitangent;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
varying vec3 vViewTangent;

vec3 tangentToView(vec3 localNormal) {
  return normalize(
    vViewTangent * localNormal.x
    + vViewBitangent * localNormal.y
    + vViewNormal * localNormal.z
  );
}

float waveHeight(vec2 p, float timeValue) {
  float wave = 0.0;
  float waveMix = 0.45 + uWaveIntensity * 0.55;

  wave += sin(p.x * 6.0 + timeValue * 1.35) * 0.12;
  wave += sin(p.y * 8.2 - timeValue * 1.05) * 0.09;
  wave += sin((p.x + p.y) * 7.0 - timeValue * 1.2) * 0.075;
  wave += sin((p.x - p.y) * 9.6 + timeValue * 1.65) * 0.05;

  float radialA = length(p - vec2(0.16, -0.12));
  float radialB = length(p - vec2(-0.18, 0.24));
  wave += sin(radialA * 15.5 - timeValue * 1.9) * 0.08;
  wave += sin(radialB * 12.0 - timeValue * 1.45) * 0.06;

  return wave * waveMix;
}

vec3 calcNormal(vec2 p, float timeValue) {
  float eps = 0.003;
  float center = waveHeight(p, timeValue);
  float hx = waveHeight(p + vec2(eps, 0.0), timeValue);
  float hy = waveHeight(p + vec2(0.0, eps), timeValue);

  return normalize(vec3(
    -(hx - center) / eps,
    -(hy - center) / eps,
    1.0
  ));
}

float fresnelTerm(vec3 normalDirection, vec3 viewDirection) {
  float cosine = max(dot(normalDirection, viewDirection), 0.0);
  return pow(1.0 - cosine, 1.8 + uFresnelStrength * 1.7);
}

void main() {
  vec2 centeredUv = vUv * 2.0 - 1.0;
  float tiltAmount = clamp((uCameraTilt + 0.3) / 1.3, 0.0, 1.0);
  float timeValue = uTime * (0.75 + uRippleSpeed * 1.85);
  float patternScale = max(uPanelSize * 0.85, 0.001);
  vec2 waterUv = centeredUv * patternScale;
  waterUv.y *= mix(0.72, 1.28, tiltAmount);
  waterUv.y -= mix(0.22, -0.04, tiltAmount);

  float heightValue = waveHeight(waterUv, timeValue);
  vec3 localNormal = calcNormal(waterUv, timeValue);
  vec3 normalDirection = tangentToView(localNormal);
  vec3 viewDirection = normalize(-vViewPosition);
  float fresnel = fresnelTerm(normalDirection, viewDirection);

  float depthMix = clamp(0.42 + heightValue * 0.8 + centeredUv.y * 0.12, 0.0, 1.0);
  vec3 color = mix(uDeepColor, uShallowColor, depthMix);

  vec2 moonCenter = vec2(0.2, mix(0.96, 0.44, tiltAmount));
  float moonDistance = length(centeredUv - moonCenter);
  float moonDisc = smoothstep(0.14, 0.0, moonDistance);
  float moonGlow = smoothstep(0.72, 0.0, moonDistance) * uMoonGlow;

  vec2 reflectionCenter = vec2(moonCenter.x * 0.55, mix(0.28, -0.18, tiltAmount));
  float reflectionPath = abs(centeredUv.x - reflectionCenter.x + heightValue * 0.55);
  float reflectionBand = smoothstep(0.42, 0.0, reflectionPath);
  float reflectionFade = smoothstep(-0.95, 0.4, centeredUv.y);
  float reflectionPulse = 0.55 + 0.45 * sin(timeValue * 1.45 + heightValue * 18.0);
  float reflection = reflectionBand * reflectionFade * reflectionPulse;

  float crest = smoothstep(0.05, 0.2, abs(heightValue));
  float rippleLight = smoothstep(-0.08, 0.18, localNormal.z);
  float rim = pow(1.0 - max(dot(normalDirection, viewDirection), 0.0), 4.0);

  color += uMoonColor * moonGlow * 0.18;
  color += uMoonColor * moonDisc * 0.68;
  color += mix(uShallowColor, uMoonColor, 0.65) * reflection * (0.4 + 0.6 * uMoonGlow);
  color += uShallowColor * crest * rippleLight * 0.2;
  color += mix(uShallowColor, uMoonColor, 0.45) * fresnel * (0.14 + 0.24 * uFresnelStrength);
  color += uMoonColor * rim * 0.08 * uMoonGlow;
  color *= 0.88 + 0.12 * (1.0 - smoothstep(0.0, 1.2, length(centeredUv)));

  float vignette = 1.0 - smoothstep(0.4, 1.15, length(centeredUv));
  float edgeFade = 1.0 - smoothstep(0.95, 1.02, max(abs(centeredUv.x), abs(centeredUv.y)));

  color *= 0.84 + vignette * 0.16;
  color = color / (color + vec3(1.15));
  color = pow(max(color, vec3(0.0)), vec3(0.9));

  float alpha = edgeFade * uOpacity;

  if (alpha < 0.02) {
    discard;
  }

  csm_DiffuseColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
