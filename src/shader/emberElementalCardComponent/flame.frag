#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
#include <elemental_common>
uniform mat4 uInverseModel;
uniform vec3 uVolumeSize;
uniform vec3 uVolumeCenter;
uniform vec2 uCardSize;
uniform vec3 uColor;
uniform vec3 uCoreColor;
uniform float uTime;
uniform float uFlameHeight;
uniform float uFlameWidth;
uniform float uFlameDepth;
uniform float uCoreBrightness;
uniform float uTurbulence;
uniform float uIntensity;
uniform float uOpacity;
uniform float uSeed;
uniform vec3 uCameraDirection;
uniform float uOrthographic;
uniform int uSteps;
varying vec3 vLocalPosition;

// A thin crown over a semicircular emitter, with the white root pinned to its arc.
vec2 crownSample(vec3 localPoint) {
  vec3 p = (localPoint * uVolumeSize + uVolumeCenter) / uCardSize.x;
  p.y -= (uCardSize.y / uCardSize.x - 1.0) * 0.5;
  float depth = localPoint.z * 2.0;
  float arcY = sqrt(max(0.0, 0.25 - p.x * p.x));
  float rise = p.y - arcY;
  float h = max(rise, 0.0) / max(uFlameHeight, 0.01);
  float fold = ecNoise(vec3(p.x * 3.8, p.y * 2.5 - uTime * 1.8, depth * 1.7) + uSeed);
  float x = p.x / uFlameWidth + (fold - 0.5) * uTurbulence * (0.08 + h * 0.12);
  float threads = ecFbm(vec3(x * 8.5 + fold * 0.65, p.y * 2.4 - uTime * 2.7, depth * 2.8) + uSeed);
  float crest = 0.39 + sin(x * 11.0 + uTime * 2.3 + uSeed) * 0.065;
  crest += sin(x * 23.0 - uTime * 3.6 + fold * 1.7) * 0.10;
  crest += (threads - 0.45) * 0.32;
  float topMask = 1.0 - smoothstep(crest - 0.055, crest + 0.1, h);
  float sideMask = 1.0 - smoothstep(0.55, 0.73, abs(x) + h * 0.06);
  float radialDistance = length(vec2(p.x, max(p.y, 0.0))) - 0.5;
  float emitterMask = smoothstep(-0.095, 0.015, radialDistance);
  emitterMask *= smoothstep(-0.16, 0.08, p.y);
  float sheet = depth + sin(x * 8.0 - uTime * 1.1 + h * 4.0) * uTurbulence * 0.13;
  float depthMask = exp(-sheet * sheet * 3.4) * (1.0 - smoothstep(0.72, 1.0, abs(depth)));
  float root = 1.0 - smoothstep(0.01, 0.29, max(rise, 0.0));
  float filaments = smoothstep(0.20 + h * 0.26, 0.72, threads + root * 0.28);
  float density = topMask * sideMask * emitterMask * depthMask * (0.35 + filaments * 0.85);
  float heat = root * (0.77 + threads * 0.23) * (1.0 - smoothstep(0.40, 0.76, abs(x)));
  return vec2(density, heat);
}

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  vec3 origin = (uInverseModel * vec4(cameraPosition, 1.0)).xyz;
  vec3 direction = normalize(vLocalPosition - origin);
  if (uOrthographic > 0.5) {
    direction = normalize(mat3(uInverseModel) * uCameraDirection);
    origin = vLocalPosition - direction * 2.0;
  }
  vec3 directionSign = step(vec3(0.0), direction) * 2.0 - 1.0;
  vec3 inverseDirection = directionSign / max(abs(direction), vec3(0.000001));
  vec3 a = (-vec3(0.5) - origin) * inverseDirection;
  vec3 b = (vec3(0.5) - origin) * inverseDirection;
  vec3 nearPlane = min(a, b);
  vec3 farPlane = max(a, b);
  float start = max(0.0, max(nearPlane.x, max(nearPlane.y, nearPlane.z)));
  float end = min(farPlane.x, min(farPlane.y, farPlane.z));
  if (end <= start) { discard; }
  float stepLength = (end - start) / float(uSteps);
  // Optical density stays consistent when a card is resized.
  float opticalStep = length(direction * uVolumeSize / uCardSize.x) * stepLength;
  vec4 accumulated = vec4(0.0);
  for (int i = 0; i < 72; i++) {
    if (i >= uSteps || accumulated.a > 0.985) { break; }
    vec3 p = origin + direction * (start + (float(i) + 0.5) * stepLength);
    vec2 sampleValue = crownSample(p);
    float alpha = 1.0 - exp(-sampleValue.x * opticalStep * 8.0 / max(uFlameDepth, 0.1));
    float heat = pow(clamp(sampleValue.y, 0.0, 1.0), 1.15);
    vec3 color = mix(uColor * 0.83, uCoreColor * uCoreBrightness, heat);
    accumulated.rgb += (1.0 - accumulated.a) * alpha * color;
    accumulated.a += (1.0 - accumulated.a) * alpha;
  }
  float alpha = accumulated.a * uOpacity * min(uIntensity, 1.4);
  if (alpha < 0.003) { discard; }
  gl_FragColor = vec4(accumulated.rgb / max(accumulated.a, 0.0001) * uIntensity, alpha);
  #include <colorspace_fragment>
}
