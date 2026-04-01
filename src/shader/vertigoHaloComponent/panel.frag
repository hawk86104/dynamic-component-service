precision highp float;

uniform vec3 uAccentColor;
uniform vec3 uBaseColor;
uniform float uEdgeGlow;
uniform float uFlashIntensity;
uniform float uGradientSpeed;
uniform vec3 uHighlightColor;
uniform float uOpacity;
uniform float uPulseIntensity;
uniform float uRingFrequency;
uniform float uRotationSpeed;
uniform float uSegmentCount;
uniform float uTime;
uniform float uTunnelSpeed;
uniform vec3 uVoidColor;

varying vec2 vUv;

#define TAU 6.28318530718

float hash21(vec2 value) {
  value = fract(value * vec2(233.34, 851.73));
  value += dot(value, value + 23.45);
  return fract(value.x * value.y);
}

void main() {
  vec2 centeredUv = vUv * 2.0 - 1.0;
  float radius = length(centeredUv);
  float theta = atan(centeredUv.y, centeredUv.x);
  float timeValue = uTime;
  float gradientPhase = timeValue * uTunnelSpeed * 2.4;
  float ringDrift = timeValue * uGradientSpeed * 0.9;
  float radialFade = 1.0 - smoothstep(0.76, 0.96, radius);

  float depth = 1.0 / (radius + 0.05);
  float swirl = sin(depth * 0.22 - timeValue * 0.45) * 0.08 * (0.5 + uPulseIntensity * 0.5);
  float rotAngle = timeValue * uRotationSpeed * 0.08 + sin(timeValue * 0.07) * 0.15 + swirl;
  float thetaRot = theta + rotAngle;

  float tunnelU = thetaRot / TAU;
  float tunnelV = depth + ringDrift;

  float ringCoord = tunnelV * uRingFrequency / TAU;
  float ringPhase = fract(ringCoord);
  float ringId = floor(ringCoord);

  float ring = smoothstep(0.0, 0.06, ringPhase) * smoothstep(0.52, 0.44, ringPhase);
  float ringPhase2 = fract(ringCoord * 2.0 + 0.18);
  float ring2 = smoothstep(0.0, 0.03, ringPhase2) * smoothstep(0.5, 0.47, ringPhase2);

  float angPhase = fract(tunnelU * max(uSegmentCount, 1.0));
  float angLine = smoothstep(0.0, 0.025, angPhase) * smoothstep(1.0, 0.975, angPhase);

  float structure = max(ring * angLine, ring2 * 0.28 * angLine);

  float wave1 = sin(ringId * 0.5 - timeValue * (0.8 + uPulseIntensity * 0.2)) * 0.5 + 0.5;
  wave1 = pow(wave1, 3.0);

  float wave2 = sin(ringId * 0.3 + timeValue * (0.5 + uPulseIntensity * 0.16)) * 0.5 + 0.5;
  wave2 = pow(wave2, 4.0);

  float wave3 = sin(ringId * 0.15 - timeValue * (0.35 + uPulseIntensity * 0.12)) * 0.5 + 0.5;
  wave3 = pow(wave3, 2.0);

  float ringBrightness = 0.14 + wave1 * 0.55 + wave2 * 0.35 + wave3 * 0.25;
  float flash = pow(max(0.0, sin(ringId * 7.3 - timeValue * 1.2)), 12.0) * uFlashIntensity;
  ringBrightness += flash * 0.8;

  float depthFade = exp(-radius * 3.0);
  float voidFade = smoothstep(0.0, 0.12, radius);
  structure *= clamp(ringBrightness, 0.0, 1.8) * depthFade * voidFade;

  float edgeHighlight = smoothstep(0.06, 0.02, abs(ringPhase - 0.01));
  edgeHighlight += smoothstep(0.06, 0.02, abs(ringPhase - 0.48));
  edgeHighlight *= angLine * depthFade * voidFade * radialFade * uEdgeGlow;

  float colorSel = fract(ringId * 0.618033);
  float colorShift = sin(ringId * 1.7 + gradientPhase) * 0.5 + 0.5;
  float gradientBand = sin(radius * 8.0 - thetaRot * 2.0 + gradientPhase * 1.4) * 0.5 + 0.5;
  float colorDepth = smoothstep(0.0, 0.5, radius);

  vec3 tunnelColor = mix(uVoidColor, uBaseColor, colorDepth);
  vec3 magenta = mix(uBaseColor, uAccentColor, 0.55);
  vec3 burntAccent = mix(uHighlightColor, uBaseColor, 0.4);

  tunnelColor = mix(tunnelColor, magenta, colorSel * 0.3);
  tunnelColor = mix(tunnelColor, uBaseColor * 1.2, colorShift * 0.22);
  tunnelColor = mix(tunnelColor, mix(magenta, uHighlightColor, gradientBand), 0.08 + abs(uGradientSpeed) * 0.08);

  float amberAmount = wave1 * wave3;
  tunnelColor = mix(tunnelColor, uHighlightColor * 0.85, amberAmount * 0.35);
  tunnelColor = mix(tunnelColor, burntAccent, flash * 0.45);

  vec3 edgeColor = mix(uAccentColor, uHighlightColor, wave2 * 0.4);
  edgeColor = mix(edgeColor, magenta * 1.4, flash * 0.25);
  edgeColor = mix(edgeColor, uHighlightColor, gradientBand * 0.12);

  vec3 color = vec3(0.0);
  color += tunnelColor * structure;
  color += edgeColor * edgeHighlight * 0.55;
  color += uHighlightColor * wave1 * structure * 0.3;
  color += mix(uHighlightColor, vec3(1.0, 0.92, 0.76), 0.5) * flash * structure * 0.55;

  float ambientGlow = exp(-radius * 5.2) * (1.0 - smoothstep(0.0, 0.08, radius));
  color += uVoidColor * ambientGlow * 0.12;

  float haze = exp(-radius * 6.0) * 0.03;
  color += mix(uVoidColor, uBaseColor * 0.5, 0.3) * haze;

  float haloGlow = (1.0 - smoothstep(0.08, 0.92, radius)) * exp(-radius * 2.8);
  color += edgeColor * haloGlow * 0.08;

  float vignette = 1.0 - smoothstep(0.3, 1.1, radius);
  color *= 0.55 + 0.45 * vignette;
  color *= radialFade;

  float grain = (hash21(gl_FragCoord.xy + floor(timeValue * 24.0)) - 0.5) * 0.02;
  color += grain;
  color = pow(max(color, vec3(0.0)), vec3(0.95, 0.98, 1.02));

  float alpha = radialFade * uOpacity;

  if (alpha < 0.02) {
    discard;
  }

  csm_DiffuseColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
