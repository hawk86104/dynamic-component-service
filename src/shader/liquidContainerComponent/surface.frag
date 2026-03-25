precision mediump float;

uniform vec3 uTopColor;
uniform vec3 uEdgeColor;
uniform float uOpacity;
uniform float uIsCircular;

varying vec2 vUv;
varying float vWaveStrength;

void main() {
  vec2 centeredUv = vUv - vec2(0.5);
  float dist = length(centeredUv) * 2.0;

  if (uIsCircular > 0.5 && dist > 1.0) {
    discard;
  }

  float edgeMix = uIsCircular > 0.5
    ? smoothstep(0.45, 1.0, dist)
    : max(abs(centeredUv.x), abs(centeredUv.y)) * 2.0;

  float shimmer = clamp(0.5 + vWaveStrength * 0.5, 0.0, 1.0);
  vec3 color = mix(uTopColor, uEdgeColor, clamp(edgeMix + shimmer * 0.18, 0.0, 1.0));
  float alpha = uOpacity * (0.9 - clamp(edgeMix, 0.0, 1.0) * 0.18);

  if (alpha <= 0.01) {
    discard;
  }

  csm_DiffuseColor = vec4(color, min(alpha, 1.0));
}
