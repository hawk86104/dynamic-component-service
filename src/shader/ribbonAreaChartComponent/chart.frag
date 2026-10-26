uniform vec3 uStart;
uniform vec3 uMiddle;
uniform vec3 uEnd;
uniform vec3 uSideColor;
uniform float uSideGradient;
uniform float uSideOpacity;
uniform float uOpacity;
uniform float uGlow;
uniform float uReflectionStrength;
uniform float uRoughness;
varying vec3 vChart;
varying vec2 vSurface;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLocalPosition;

#include <common>
#include <logdepthbuf_pars_fragment>

float surfaceNoise(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float softbox(vec3 ray, vec3 direction, vec3 tangent, vec2 size, float blur) {
  float forward = dot(ray, direction);
  vec2 projected = vec2(dot(ray, tangent), dot(ray, cross(direction, tangent))) / max(forward, 0.05);
  vec2 mask = 1.0 - smoothstep(size, size + vec2(blur), abs(projected));
  return mask.x * mask.y * smoothstep(0.0, 0.1, forward);
}

void main() {
  #include <logdepthbuf_fragment>
  float x = clamp(vChart.x, 0.0, 1.0);
  vec3 pigment = x < 0.5
    ? mix(uStart, uMiddle, smoothstep(0.0, 1.0, x * 2.0))
    : mix(uMiddle, uEnd, smoothstep(0.0, 1.0, (x - 0.5) * 2.0));
  float roofWeight = smoothstep(0.05, 0.95, vSurface.x);
  float profile = clamp(vSurface.y, 0.0, 1.0);
  vec3 n = inverseTransformDirection(normalize(vNormal), viewMatrix);
  n *= gl_FrontFacing ? 1.0 : -1.0;
  vec3 view = inverseTransformDirection(isOrthographic ? vec3(0.0, 0.0, 1.0) : normalize(vView), viewMatrix);

  vec3 cell = floor(vLocalPosition * 145.0);
  vec3 footprint = fwidth(vLocalPosition * 145.0);
  float grainVisibility = 1.0 - smoothstep(0.7, 2.0, max(footprint.x, max(footprint.y, footprint.z)));
  vec3 grain = vec3(surfaceNoise(cell), surfaceNoise(cell + 27.3), surfaceNoise(cell + 51.9)) - 0.5;
  n = normalize(n + grain * uRoughness * grainVisibility * 0.1);

  float facing = clamp(dot(n, view), 0.0, 1.0);
  float fresnel = 0.04 + 0.96 * pow(1.0 - facing, 5.0);
  vec3 ray = reflect(-view, n);
  float blur = 0.035 + uRoughness * 0.32;
  // Wide studio panels create crosswise reflections as the curve normal changes.
  float key = softbox(ray, normalize(vec3(-0.6, 1.2, 1.0)), normalize(vec3(1.0, 0.5, 0.0)), vec2(1.8, 0.095), blur);
  float strip = softbox(ray, normalize(vec3(0.15, 1.0, -0.65)), normalize(vec3(1.0, -0.15, 0.0)), vec2(1.4, 0.035), blur * 0.65);
  float rim = softbox(ray, normalize(vec3(-1.0, 0.2, 0.8)), normalize(vec3(0.8, 0.0, 1.0)), vec2(0.12, 1.7), blur);
  vec3 reflection = vec3(0.035, 0.055, 0.1) + vec3(0.11, 0.15, 0.22) * smoothstep(-0.1, 0.9, ray.y);
  reflection += vec3(0.85, 0.94, 1.0) * key * 1.4;
  reflection += vec3(1.0, 0.96, 0.92) * strip * 1.1;
  reflection += vec3(0.6, 0.78, 1.0) * rim * 0.9;
  reflection *= uReflectionStrength * (1.0 - uRoughness * 0.3);

  float light = max(dot(n, normalize(vec3(-0.25, 0.9, 0.5))), 0.0);
  float across = 1.0 - 0.14 * pow(abs(vChart.z), 1.8);
  vec3 milkyTint = mix(pigment, vec3(0.82, 0.9, 1.0), uRoughness * 0.18);
  vec3 roof = milkyTint * (0.58 + light * 0.36) * across;
  roof += reflection * (0.25 + fresnel * 0.65);
  float lip = smoothstep(0.7, 0.98, abs(vChart.z)) * smoothstep(0.08, 0.6, vSurface.x);
  roof += mix(pigment, vec3(1.0), 0.5) * lip * uGlow * 0.38;

  // Preserve all user-selected color channels; grade brightness instead of replacing the hue.
  float sideFade = mix(1.0, mix(0.08, 1.2, smoothstep(0.0, 1.0, profile)), uSideGradient);
  vec3 wall = uSideColor * sideFade * (0.8 + light * 0.2);
  vec3 sideReflectionTint = mix(uSideColor, vec3(1.0), 0.18);
  wall += reflection * sideReflectionTint * (0.06 + fresnel * 0.08);
  wall += uSideColor * pow(1.0 - facing, 3.0) * uGlow * 0.6;
  vec3 color = mix(wall, roof, roofWeight);
  color += grain.x * uRoughness * grainVisibility * mix(0.015, 0.045, roofWeight);

  float surfaceOpacity = uOpacity * mix(uSideOpacity, 1.0, roofWeight);
  float wallResponse = mix(1.0, 0.3 + profile * 0.7, uSideGradient);
  float roofResponse = 0.85 + fresnel * 0.12 + uRoughness * 0.08;
  float alpha = surfaceOpacity * mix(wallResponse, roofResponse, roofWeight);
  if (!gl_FrontFacing) {
    color *= 0.58;
    alpha *= 0.38;
  }
  alpha = surfaceOpacity >= 1.0 ? 1.0 : clamp(alpha, 0.0, 0.98);
  gl_FragColor = vec4(max(color, vec3(0.0)), alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
