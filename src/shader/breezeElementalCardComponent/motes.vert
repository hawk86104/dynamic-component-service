#include <common>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
attribute vec4 aSeed;
attribute float aLife;
uniform float uTime;
uniform float uParticleSize;
uniform float uPointScale;
uniform float uPerspective;
uniform float uCurlRatio;
varying float vCurl;
varying float vFade;
varying float vAngle;

void main() {
  vCurl = aSeed.w < uCurlRatio ? 1.0 : 0.0;
  vFade = (0.7 + 0.3 * sin(uTime * 1.5 + aSeed.x * 19.0)) * (0.5 + aSeed.y * 0.5);
  vFade *= smoothstep(0.0, 0.065, aLife) * (1.0 - smoothstep(0.9, 1.0, aLife));
  vAngle = aSeed.z * 6.283185 + sin(uTime * 0.55 + aSeed.x * 9.0) * 0.35;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float worldScale = max(length(modelMatrix[0].xyz), max(length(modelMatrix[1].xyz), length(modelMatrix[2].xyz)));
  float attenuation = mix(1.0, max(0.1, -mvPosition.z), uPerspective);
  float shapeScale = mix(0.6 + aSeed.y * 0.5, 3.8 + aSeed.y * 1.6, vCurl);
  gl_PointSize = clamp(uParticleSize * worldScale * uPointScale / attenuation * shapeScale, 1.0, 64.0);
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
