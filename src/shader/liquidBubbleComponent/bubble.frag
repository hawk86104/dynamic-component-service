precision mediump float;

uniform vec3 uBubbleColor;
uniform float uBubbleOpacity;

varying float vLife;
varying float vPointSize;
varying float vSeed;

void main() {
  float pointScale = smoothstep(0.0, 2.2, vPointSize);
  float virtualScale = mix(3.1, 1.0, pointScale);
  vec2 centered = (gl_PointCoord - vec2(0.5)) * virtualScale;
  float dist = length(centered);

  if (dist > 0.5) {
    discard;
  }

  float fadeIn = smoothstep(0.0, 0.08, vLife);
  float fadeOut = 1.0 - smoothstep(0.82, 1.0, vLife);
  float outerMask = 1.0 - smoothstep(0.38, 0.5, dist);
  float innerMask = 1.0 - smoothstep(0.1, 0.28, dist);
  float ring = clamp(outerMask - innerMask * 0.84, 0.0, 1.0);
  float innerGlow = (1.0 - smoothstep(0.0, 0.26, dist)) * 0.3;

  vec2 highlightOffset = centered + vec2(0.15, 0.17);
  float highlight = 1.0 - smoothstep(0.0, 0.18, length(highlightOffset));
  float highlightArc = (1.0 - smoothstep(0.21, 0.39, length(centered + vec2(0.08, 0.08)))) * ring;
  float sparkle = highlight * mix(0.45, 0.9, vSeed);

  float alpha = ring * 0.72 + innerGlow * 0.24 + sparkle * 0.46 + highlightArc * 0.22;
  alpha *= fadeIn * fadeOut;
  alpha *= uBubbleOpacity;
  alpha *= clamp(vPointSize, 0.0, 1.0) * 0.88 + pointScale * 0.12;

  if (alpha < 0.02) {
    discard;
  }

  vec3 bubbleColor = mix(uBubbleColor * 0.78, vec3(1.0), sparkle * 0.72 + highlightArc * 0.28);
  bubbleColor += uBubbleColor * ring * 0.12;

  csm_DiffuseColor = vec4(bubbleColor, clamp(alpha, 0.0, 1.0));
}
