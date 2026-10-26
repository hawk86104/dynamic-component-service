#include <common>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
attribute vec3 aOrigin;
attribute vec3 aDirection;
attribute vec4 aSeed;
uniform float uTime;
uniform float uCardWidth;
uniform float uRayDepth;
uniform float uParticleSpread;
uniform float uRingRatio;
uniform float uParticleSize;
uniform float uPointScale;
uniform float uPerspective;
varying float vFade;
varying float vRing;
varying float vLife;

void main() {
  float life = fract(aSeed.x + uTime * (0.10 + aSeed.y * 0.065));
  float offset = uCardWidth * (0.012 + pow(life, 1.35) * uParticleSpread);
  vec3 p = aOrigin + vec3(aDirection.xy, 0.0) * offset;
  vec3 tangent = vec3(-aDirection.y, aDirection.x, 0.0);
  p += tangent * sin(life * 4.0 + aSeed.z * 14.0) * uCardWidth * 0.008;
  p.z += aDirection.z * uCardWidth * uRayDepth * 0.6 + sin(life * 3.14159265) * uCardWidth * 0.025;
  float twinkle = 0.8 + sin(uTime * (2.5 + aSeed.y * 5.0) + aSeed.z * 21.0) * 0.2;
  vFade = smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.65, 1.0, life)) * twinkle;
  vRing = aSeed.w < uRingRatio ? 1.0 : 0.0;
  vLife = life;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float worldScale = max(length(modelMatrix[0].xyz), max(length(modelMatrix[1].xyz), length(modelMatrix[2].xyz)));
  float attenuation = mix(1.0, max(0.1, -mvPosition.z), uPerspective);
  float shapeScale = mix(0.5 + aSeed.y, 2.9 + aSeed.z * 1.4, vRing);
  gl_PointSize = clamp(uParticleSize * worldScale * uPointScale / attenuation * shapeScale, 1.0, 64.0);
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
