#include <common>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
attribute vec3 aOrigin;
attribute vec4 aSeed;
attribute float aUpper;
uniform float uTime;
uniform float uWidth;
uniform float uHeight;
uniform float uSpread;
uniform float uReveal;
uniform float uHeartRatio;
uniform float uParticleSize;
uniform float uPointScale;
uniform float uPerspective;
varying float vHeart;
varying float vFade;
varying float vAngle;
varying float vTurn;

void main() {
  float life = fract(aSeed.x + uTime * (0.075 + aSeed.y * 0.045));
  vec3 p = aOrigin;
  p.x *= mix(uSpread, 1.0, aUpper);
  p.x += (aSeed.y - 0.5) * life * uWidth * 0.2 + sin(life * 4.0 + aSeed.z * 19.0) * uWidth * 0.025;
  p.y += mix(-0.045, 0.17, aUpper) * uHeight * life;
  p.z += sin(life * 3.14159265 + aSeed.z * 7.0) * uWidth * 0.07;
  vHeart = aSeed.w < uHeartRatio ? 1.0 : 0.0;
  vFade = smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.62, 1.0, life)) * uReveal;
  vAngle = aSeed.z * 6.283185 + uTime * mix(0.65, 0.16, vHeart) * (aSeed.y - 0.5);
  vTurn = 0.42 + 0.58 * abs(sin(aSeed.x * 17.0 + uTime * 0.7));
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float worldScale = max(length(modelMatrix[0].xyz), max(length(modelMatrix[1].xyz), length(modelMatrix[2].xyz)));
  float attenuation = mix(1.0, max(0.1, -mvPosition.z), uPerspective);
  float shapeScale = mix(1.8 + aSeed.y * 1.3, 3.7 + aSeed.y * 1.5, vHeart);
  gl_PointSize = clamp(uParticleSize * worldScale * uPointScale / attenuation * shapeScale, 1.0, 64.0);
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
