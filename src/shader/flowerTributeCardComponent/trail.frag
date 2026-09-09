precision mediump float;

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uOpacity;

varying float vLife;
varying float vSeed;
varying float vTrail;
varying float vOutside;

void main() {
  if (vOutside < 0.5) discard;
  vec2 centered = gl_PointCoord - vec2(0.5);
  float dist = length(centered);

  // 柔和圆形边缘
  float alpha = (1.0 - smoothstep(0.05, 0.5, dist));

  // 生命周期淡入淡出
  float fadeIn = smoothstep(0.0, 0.12, vLife);
  float fadeOut = 1.0 - smoothstep(0.55, 1.0, vLife);
  alpha *= fadeIn * fadeOut;

  // 拖尾粒子整体比头部粒子弱
  float trailFade = mix(1.0, 0.55, vTrail);
  alpha *= trailFade;
  alpha *= uOpacity;

  if (alpha < 0.01) {
    discard;
  }

  // 三色渐变：生命中段用 B 色，末端偏 C 色
  float gradient = clamp(vLife * 1.15 + vSeed * 0.1, 0.0, 1.0);
  vec3 color = mix(uColorA, uColorB, smoothstep(0.0, 0.55, gradient));
  color = mix(color, uColorC, smoothstep(0.55, 1.0, gradient));

  csm_DiffuseColor = vec4(color, alpha);
}
