precision highp float;

varying vec2 vGroundPos;

uniform int uColorMode;
uniform float uGroundOpacity;

vec3 glowColorForMode() {
  if (uColorMode == 1) {
    return vec3(0.2, 0.5, 1.0);
  }
  if (uColorMode == 2) {
    return vec3(0.2, 1.0, 0.3);
  }
  if (uColorMode == 3) {
    return vec3(0.6, 0.6, 0.7);
  }
  if (uColorMode == 4) {
    return vec3(0.8, 0.2, 0.7);
  }

  return vec3(1.0, 0.4, 0.1);
}

void main() {
  float dist = length(vGroundPos);
  vec2 gridUv = vGroundPos;
  vec2 gridLine = abs(fract(gridUv - 0.5) - 0.5);
  float grid = 1.0 - smoothstep(0.0, 0.03, min(gridLine.x, gridLine.y));
  float glow = exp(-dist * dist * 2.0) * 0.3;
  float fade = 1.0 - smoothstep(2.0, 5.0, dist);
  vec3 color = vec3(grid * fade * 0.075) + glowColorForMode() * glow * fade;
  float alpha = max(grid * fade * 0.075, glow * fade) * uGroundOpacity;

  csm_DiffuseColor = vec4(color, alpha);
}
