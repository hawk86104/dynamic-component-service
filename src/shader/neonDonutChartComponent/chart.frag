uniform vec3 uColor;
uniform float uOpacity;
uniform float uGlow;
uniform float uReflectionStrength;
uniform float uRoughness;
uniform float uThickness;
varying float vHeight;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLocalPosition;

#include <common>
#include <logdepthbuf_pars_fragment>

float glassNoise(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

// Analytic softboxes keep reflections visible without an environment texture or lights.
float reflectionPanel(vec3 ray, vec3 direction, vec3 tangent, vec2 size, float blur) {
  float forward = dot(ray, direction);
  vec2 offset = vec2(dot(ray, tangent), dot(ray, cross(direction, tangent))) / max(forward, 0.05);
  vec2 mask = 1.0 - smoothstep(size, size + vec2(blur), abs(offset));
  return mask.x * mask.y * smoothstep(0.0, 0.12, forward);
}

void main() {
  #include <logdepthbuf_fragment>
  vec3 n = inverseTransformDirection(normalize(vNormal), viewMatrix);
  n *= gl_FrontFacing ? 1.0 : -1.0;
  vec3 view = inverseTransformDirection(isOrthographic ? vec3(0.0, 0.0, 1.0) : normalize(vView), viewMatrix);

  vec3 grainCell = floor(vLocalPosition * 180.0);
  vec3 footprint = fwidth(vLocalPosition * 180.0);
  float grainVisibility = 1.0 - smoothstep(0.75, 2.0, max(footprint.x, max(footprint.y, footprint.z)));
  vec3 grain = vec3(glassNoise(grainCell), glassNoise(grainCell + 17.7), glassNoise(grainCell + 43.3)) - 0.5;
  n = normalize(n + grain * (uRoughness * 0.14 * grainVisibility));

  float facing = clamp(dot(n, view), 0.0, 1.0);
  float fresnel = 0.04 + 0.96 * pow(1.0 - facing, 5.0);
  vec3 ray = reflect(-view, n);
  float blur = 0.035 + uRoughness * 0.32;
  float key = reflectionPanel(ray, normalize(vec3(-0.8, 0.25, 1.0)), normalize(vec3(1.0, 0.0, 0.8)), vec2(0.12, 1.1), blur);
  float fill = reflectionPanel(ray, normalize(vec3(1.0, 0.15, 0.55)), normalize(vec3(0.55, 0.0, -1.0)), vec2(0.07, 0.85), blur);
  float overhead = reflectionPanel(ray, normalize(vec3(0.2, 1.0, -0.25)), normalize(vec3(1.0, -0.2, 0.0)), vec2(0.65, 0.32), blur * 1.5);
  vec3 reflection = vec3(0.025, 0.045, 0.075) + vec3(0.1, 0.16, 0.23) * smoothstep(-0.25, 0.85, ray.y);
  reflection += vec3(1.0, 0.98, 0.92) * key * 1.45;
  reflection += vec3(0.7, 0.86, 1.0) * fill * 1.15;
  reflection += vec3(0.92, 0.98, 1.0) * overhead * 0.85;

  float opticalDepth = clamp(uThickness, 0.05, 2.0) * (0.45 + 0.55 / (facing + 0.35));
  vec3 absorption = exp(-(vec3(1.0) - uColor) * opticalDepth * 0.65);
  vec3 pigment = mix(uColor * 0.28, mix(uColor, vec3(1.0), 0.12) * 0.85, pow(vHeight, 0.55));
  float light = 0.72 + 0.34 * max(dot(n, normalize(vec3(-0.3, 0.8, 0.7))), 0.0);
  vec3 color = pigment * absorption * light;
  color += reflection * uReflectionStrength * mix(0.32, 0.95, fresnel) * (1.0 - uRoughness * 0.35);
  color += mix(uColor, vec3(1.0), 0.22) * pow(1.0 - facing, 3.0) * uGlow * 0.5;
  color += grain.x * uRoughness * 0.06 * grainVisibility;

  float highlight = clamp((key + fill + overhead) * uReflectionStrength, 0.0, 1.0);
  float thicknessOpacity = 1.0 - exp(-opticalDepth * 0.45);
  float alpha = uOpacity * (0.28 + 0.17 * vHeight + 0.28 * fresnel + 0.16 * thicknessOpacity + 0.2 * highlight + 0.1 * uRoughness);
  if (!gl_FrontFacing) {
    color *= 0.66;
    alpha *= 0.42;
  }
  alpha = uOpacity >= 1.0 ? 1.0 : clamp(alpha, 0.02, 0.96);
  gl_FragColor = vec4(max(color, vec3(0.0)), alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
