precision mediump float;

uniform vec3 uBaseColor;
uniform vec3 uCurrentColor;
uniform float uFlowSpeed;
uniform float uGridDensity;
uniform vec3 uHighlightColor;
uniform float uOpacity;
uniform float uPanelLength;
uniform float uPanelWidth;
uniform float uPulseFrequency;
uniform float uPulseIntensity;
uniform float uRippleScale;
uniform float uShimmerIntensity;
uniform float uTime;
uniform float uWireWidth;

varying vec2 vUv;
varying vec3 vViewBitangent;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
varying vec3 vViewTangent;

const float CRP_TAU = 6.28318530718;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float currentNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec4 pulseData(float t, float pulseFrequency) {
  float period = 1.0 / max(pulseFrequency, 0.01);
  float phase = t / period;
  float beatFrac = fract(phase);
  float envelope = exp(-beatFrac * 3.5);
  float prevEnv = exp(-(beatFrac + 1.0) * 3.5);
  float prevEnv2 = exp(-(beatFrac + 2.0) * 3.5);

  return vec4(beatFrac, envelope, prevEnv, prevEnv2);
}

float displacement(vec2 p, float t, float pulseFrequency, float pulseIntensity) {
  vec4 pulse = pulseData(t, pulseFrequency);
  float beatFrac = pulse.x;
  float envelope = pulse.y;
  float prevEnv = pulse.z;
  float prevEnv2 = pulse.w;

  float dist = length(p);
  float angle = atan(p.y, p.x);

  float wave1 = sin(dist * 14.0 - beatFrac * 22.0) * envelope;
  float wave2 = sin(dist * 9.0 - (beatFrac + 1.0) * 16.0) * prevEnv * 0.6;
  float wave3 = sin(dist * 6.0 - (beatFrac + 2.0) * 12.0) * prevEnv2 * 0.3;

  float standing = sin(p.x * 18.0 + sin(t * 0.21) * 0.5)
    * sin(p.y * 18.0 - cos(t * 0.17) * 0.5)
    * envelope * 0.28;

  float radialMode = sin(dist * 22.0 - t * 0.2) * cos(angle * 3.0) * envelope * 0.2;
  radialMode += sin(dist * 16.0 + t * 0.15) * cos(angle * 5.0 + 1.0) * prevEnv * 0.11;

  vec2 offCenter = vec2(0.3 * sin(t * 0.2), 0.25 * cos(t * 0.25));
  float dist2 = length(p - offCenter);
  float wave6 = sin(dist2 * 12.0 - beatFrac * 18.0) * envelope * 0.35;

  float dome = (1.0 - smoothstep(0.0, 1.15, dist)) * envelope * 0.75;

  float idle = sin(dist * 8.0 + t * 3.0) * 0.03 * (1.0 - envelope);
  idle += sin((p.x - p.y) * 5.0 - t * 1.5) * 0.015 * (1.0 - envelope);

  return (wave1 + wave2 + wave3 + standing + radialMode + wave6 + dome + idle) * pulseIntensity;
}

vec3 calcNormal(vec2 p, float t, float pulseFrequency, float pulseIntensity, float hCenter) {
  float eps = 0.0025;
  float hx = displacement(p + vec2(eps, 0.0), t, pulseFrequency, pulseIntensity);
  float hy = displacement(p + vec2(0.0, eps), t, pulseFrequency, pulseIntensity);

  return normalize(vec3(
    -(hx - hCenter) / eps * 0.35,
    -(hy - hCenter) / eps * 0.35,
    1.0
  ));
}

vec3 hexGrid(vec2 p, float scale) {
  p *= scale;

  vec2 r = vec2(1.0, 1.7320508);
  vec2 h = r * 0.5;
  vec2 a = mod(p, r) - h;
  vec2 b = mod(p - h, r) - h;
  vec2 g = a;

  if (dot(a, a) >= dot(b, b)) {
    g = b;
  }

  float edgeDist = 0.5 - max(abs(g.x) + abs(g.y) * 0.577, abs(g.y) * 1.155);
  vec2 cellId = p - g;

  return vec3(edgeDist, cellId);
}

float fresnel(float cosTheta, float f0) {
  return f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
}

vec3 tangentToView(vec3 localNormal) {
  return normalize(
    vViewTangent * localNormal.x
    + vViewBitangent * localNormal.y
    + vViewNormal * localNormal.z
  );
}

void main() {
  vec2 centeredUv = vUv * 2.0 - 1.0;
  float minPanelSize = max(min(uPanelLength, uPanelWidth), 0.0001);
  vec2 panelScale = vec2(uPanelLength, uPanelWidth) / minPanelSize;
  vec2 panelUv = centeredUv * panelScale;
  float timeValue = uTime * uFlowSpeed;
  vec2 rippleUv = panelUv * uRippleScale;

  vec4 pulse = pulseData(timeValue, uPulseFrequency);
  float beatFrac = pulse.x;
  float beatEnvelope = pulse.y;

  float heightValue = displacement(rippleUv, timeValue, uPulseFrequency, uPulseIntensity);
  vec3 localNormal = calcNormal(rippleUv, timeValue, uPulseFrequency, uPulseIntensity, heightValue);
  vec3 normalDirection = tangentToView(localNormal);
  vec3 viewDirection = normalize(-vViewPosition);

  vec3 hex = hexGrid(panelUv + localNormal.xy * 0.02, uGridDensity);
  float edgeDist = hex.x;
  vec2 cellId = hex.yz;
  float wire = 1.0 - smoothstep(0.0, uWireWidth, edgeDist);
  float cellMask = smoothstep(uWireWidth, uWireWidth + 0.08, edgeDist);

  float panelNoiseA = currentNoise(panelUv * 8.0 + 3.0);
  float panelNoiseB = currentNoise(panelUv * 18.0 - 7.0);
  float cellNoise = currentNoise(cellId * 0.19 + rippleUv * 0.6);
  float cellHash = hash(cellId + 17.0);

  float pulseWave = smoothstep(0.08, 0.9, abs(heightValue));
  float currentSweep = pow(max(sin(length(rippleUv) * 11.0 - beatFrac * 20.0), 0.0), 10.0) * beatEnvelope;
  float microSpark = pow(max(sin(cellHash * CRP_TAU + timeValue * 3.4 + heightValue * 5.5), 0.0), 8.0);
  float charge = clamp(pulseWave * 0.85 + beatEnvelope * 0.4 + microSpark * 0.35, 0.0, 1.45);

  vec3 lightColorA = mix(uCurrentColor, uHighlightColor, 0.35);
  vec3 lightColorB = mix(uBaseColor, uCurrentColor, 0.78);
  vec3 lightColorC = mix(uCurrentColor, uHighlightColor, 0.72);

  vec3 lightDirA = normalize(vec3(0.45 + sin(timeValue * 0.33) * 0.25, 0.3 + cos(timeValue * 0.27) * 0.15, 1.0));
  vec3 lightDirB = normalize(vec3(-0.55 + cos(timeValue * 0.19) * 0.2, -0.35, 0.8));
  vec3 lightDirC = normalize(vec3(0.1 + sin(timeValue * 0.41) * 0.1, 0.6, 0.85));

  float ndlA = max(dot(normalDirection, lightDirA), 0.0);
  float ndlB = max(dot(normalDirection, lightDirB), 0.0);
  float ndlC = max(dot(normalDirection, lightDirC), 0.0);

  vec3 halfDirA = normalize(lightDirA + viewDirection);
  vec3 halfDirB = normalize(lightDirB + viewDirection);
  vec3 halfDirC = normalize(lightDirC + viewDirection);

  float specA = pow(max(dot(normalDirection, halfDirA), 0.0), 120.0);
  float specB = pow(max(dot(normalDirection, halfDirB), 0.0), 64.0);
  float specC = pow(max(dot(normalDirection, halfDirC), 0.0), 22.0);

  float ndv = max(dot(normalDirection, viewDirection), 0.0);
  float fres = fresnel(ndv, 0.18 + beatEnvelope * 0.12);

  vec3 basePlate = uBaseColor * (0.42 + panelNoiseA * 0.18 + panelNoiseB * 0.09);
  basePlate += uCurrentColor * (0.025 + beatEnvelope * 0.05);

  vec3 diffuse = basePlate * (ndlA * 0.55 + ndlB * 0.28 + ndlC * 0.16 + 0.24);
  diffuse += uCurrentColor * beatEnvelope * (0.08 + cellNoise * 0.12);

  vec3 specular = specA * lightColorA * 2.1;
  specular += specB * lightColorB * 1.2;
  specular += specC * lightColorC * 0.45;
  specular *= fres * (0.55 + charge * 0.75) * uShimmerIntensity;

  vec3 pulseColor = mix(uCurrentColor, uHighlightColor, smoothstep(0.35, 1.1, charge));

  vec3 grooveColor = basePlate * 0.18 + uCurrentColor * beatEnvelope * 0.08;

  vec3 cellColor = diffuse;
  cellColor += pulseColor * charge * (0.32 + cellNoise * 0.36);
  cellColor += pulseColor * currentSweep * 0.28;
  cellColor += pulseColor * microSpark * 0.18 * uShimmerIntensity;
  cellColor += specular * (0.4 + cellMask * 0.6);

  float conductorPulse = wire * (0.3 + beatEnvelope * 0.8 + pulseWave * 0.65);
  vec3 wireColor = mix(basePlate * 0.22, mix(uCurrentColor, uHighlightColor, 0.42), conductorPulse);
  wireColor += pulseColor * conductorPulse * 0.9;
  wireColor += specular * 0.78;

  float rim = pow(1.0 - ndv, 4.0);
  vec3 color = mix(grooveColor, cellColor, cellMask);
  color = mix(color, wireColor, wire);
  color += pulseColor * rim * 0.12;

  float vignette = 1.0 - smoothstep(0.45, 1.25, length(panelUv));
  float edgeFade = 1.0 - smoothstep(0.92, 1.02, max(abs(centeredUv.x), abs(centeredUv.y)));
  color *= 0.72 + vignette * 0.28;
  color += uCurrentColor * beatEnvelope * 0.08 * vignette;

  color = color / (color + vec3(1.2));
  color = pow(max(color, vec3(0.0)), vec3(0.92, 0.95, 1.02));

  float alpha = mix(0.82, 1.0, cellMask) * edgeFade * uOpacity;

  if (alpha < 0.02) {
    discard;
  }

  csm_DiffuseColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
