precision mediump float;

uniform vec3 uColor;
uniform float uOpacity;

varying float vSeed;
varying float vOpacity;

void main() {
  vec2 centered = gl_PointCoord - vec2(0.5);
  float dist = length(centered);
  float outer = 1.0 - smoothstep(0.43, 0.5, dist);
  float inner = 1.0 - smoothstep(0.0, 0.28, dist);
  float rim = outer * (1.0 - inner);
  float sparkle = smoothstep(0.18, 0.0, length(centered - vec2(-0.14, 0.16)));
  float alpha = (rim * 0.72 + inner * 0.08 + sparkle * 0.24) * uOpacity * vOpacity * (0.9 + vSeed * 0.08);

  if (alpha <= 0.01) {
    discard;
  }

  vec3 color = mix(uColor * 0.76, vec3(1.0), sparkle * 0.48 + rim * 0.24);
  gl_FragColor = vec4(color, min(alpha, 1.0));
}
