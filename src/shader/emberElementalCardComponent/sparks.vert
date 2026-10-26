#include <common>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#include <elemental_common>
attribute vec4 aSeed;
uniform vec2 uCardSize;
uniform float uThickness;
uniform float uTime;
uniform float uFlameHeight;
uniform float uFlameDepth;
uniform float uTriangleRatio;
uniform float uParticleSize;
uniform float uPointScale;
uniform float uPerspective;
varying float vFade;
varying float vTriangle;
varying float vRotation;
varying float vSeed;

void main() {
  float life = fract(aSeed.x + uTime * (0.16 + aSeed.w * 0.09));
  bool perimeter = aSeed.z < 0.18;
  vec3 p;
  vTriangle = !perimeter && aSeed.w < uTriangleRatio ? 1.0 : 0.0;
  if (perimeter) {
    float phase = aSeed.y + uTime * 0.014;
    p = ecCapsulePoint(phase, uCardSize);
    p += ecCapsuleNormal(p, uCardSize) * uCardSize.x * (0.008 + aSeed.x * 0.025 + life * 0.012);
    p.y += sin(life * 6.283185 + aSeed.w * 20.0) * uCardSize.x * 0.025;
    p.z = uThickness * 0.5 + (aSeed.w - 0.25) * uCardSize.x * 0.12;
  } else {
    float rootX = (aSeed.y - 0.5) * 0.98;
    float rootY = sqrt(max(0.0, 0.25 - rootX * rootX));
    float drift = sin(life * 5.5 + aSeed.z * 19.0 + uTime * 0.3) * (0.015 + life * 0.045);
    p.x = (rootX + drift + rootX * life * 0.16) * uCardSize.x;
    p.y = (uCardSize.y - uCardSize.x) * 0.5 + (rootY + 0.025 + life * (0.36 + aSeed.z * 0.22) * uFlameHeight) * uCardSize.x;
    p.z = -uThickness * 0.5 + (aSeed.z - 0.5) * uCardSize.x * uFlameDepth * 0.65;
  }
  float twinkle = 0.72 + sin(uTime * (5.0 + aSeed.y * 8.0) + aSeed.w * 31.0) * 0.28;
  vFade = smoothstep(0.0, 0.09, life) * (1.0 - smoothstep(0.72, 1.0, life)) * twinkle;
  vRotation = aSeed.y * 6.283185 + uTime * (0.10 + aSeed.z * 0.12);
  vSeed = aSeed.w;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float worldScale = max(length(modelMatrix[0].xyz), max(length(modelMatrix[1].xyz), length(modelMatrix[2].xyz)));
  float distanceScale = mix(1.0, max(0.1, -mvPosition.z), uPerspective);
  float shapeScale = mix(0.55 + aSeed.w * 0.9, 3.4, vTriangle);
  gl_PointSize = clamp(uParticleSize * worldScale * uPointScale / distanceScale * shapeScale, 1.0, 64.0);
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
