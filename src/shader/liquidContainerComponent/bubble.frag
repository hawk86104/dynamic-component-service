precision mediump float;

uniform vec3 uColor;
uniform float uOpacity;

varying float vSeed;
varying float vOpacity;

void main() {
  vec2 centered = gl_PointCoord * 2.0 - vec2(1.0);
  float stretchX = mix(0.88, 1.08, fract(vSeed * 17.13));
  float stretchY = mix(0.92, 1.12, fract(vSeed * 11.41));
  vec2 warped = vec2(centered.x * stretchX, centered.y * stretchY);
  float dist = length(warped);

  if (dist > 1.0) {
    discard;
  }

  float shell = smoothstep(1.0, 0.68, dist) * (1.0 - smoothstep(0.62, 0.18, dist));
  float core = 1.0 - smoothstep(0.0, 0.48, dist);
  float highlight = smoothstep(0.2, 0.0, length(warped - vec2(-0.28, 0.24)));
  float caustic = smoothstep(0.17, 0.0, length(warped - vec2(0.14, -0.08)));
  float alpha = (shell * 0.92 + highlight * 0.24 + caustic * 0.12 + core * 0.03) * uOpacity * vOpacity * (0.92 + vSeed * 0.06);

  if (alpha <= 0.01) {
    discard;
  }

  vec3 color = mix(uColor * 0.72, vec3(1.0), highlight * 0.72 + shell * 0.18 + caustic * 0.1);
  csm_DiffuseColor = vec4(color, min(alpha, 1.0));
}
