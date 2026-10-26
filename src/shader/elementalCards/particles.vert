#include <common>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#include <elemental_common>
attribute vec4 aSeed;
uniform vec2 uCardSize;
uniform float uTime;
uniform float uKind;
uniform float uParticleSize;
uniform float uPointScale;
uniform float uPerspective;
varying float vFade;
varying float vSeed;

void main() {
  float life = fract(aSeed.x + uTime * (0.14 + aSeed.w * 0.12));
  vec3 p = vec3(0.0);
  if (uKind < 0.5) {
    p.x = (aSeed.y - 0.5) * uCardSize.x * 1.5;
    p.y = uCardSize.y * (0.2 + life * 0.95);
    p.z = (aSeed.z - 0.5) * uCardSize.x * 0.85;
    p.x += sin(life * 10.0 + aSeed.w * 20.0) * life * uCardSize.x * 0.15;
  } else {
    float phase = aSeed.y + uTime * (0.025 + aSeed.w * 0.018);
    p = ecCapsulePoint(phase, uCardSize);
    vec3 outward = ecCapsuleNormal(p, uCardSize);
    p += outward * uCardSize.x * (0.06 + aSeed.z * 0.48 + life * 0.14);
    p.z = sin(phase * 6.283185 + aSeed.x * 14.0) * uCardSize.x * 0.48;
    if (uKind > 2.5) { p.y += life * uCardSize.y * 0.28; }
  }
  vFade = smoothstep(0.0, 0.15, life) * (1.0 - smoothstep(0.6, 1.0, life));
  vSeed = aSeed.w;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float worldScale = max(length(modelMatrix[0].xyz), max(length(modelMatrix[1].xyz), length(modelMatrix[2].xyz)));
  float attenuation = mix(1.0, max(0.1, -mvPosition.z), uPerspective);
  gl_PointSize = clamp(uParticleSize * worldScale * uPointScale / attenuation * (0.6 + aSeed.w), 1.0, 72.0);
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
