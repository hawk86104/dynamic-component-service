#include <common>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
attribute vec3 aOrigin;
attribute vec3 aDirection;
attribute vec4 aStyle;
attribute vec4 aSeed;
uniform float uTime;
uniform float uCardWidth;
uniform float uRayLength;
uniform float uRayWidth;
uniform float uPulse;
uniform float uRayDepth;
uniform float uSoft;
varying vec2 vUv;
varying float vLight;
varying float vMicro;

void main() {
  vUv = uv;
  float phase = aSeed.z * 6.283185;
  float pulse = 1.0 + sin(uTime * 1.7 + phase) * uPulse * 0.16;
  float along = uv.x;
  float beamLength = uRayLength * uCardWidth * aStyle.x * pulse;
  vec3 direction = normalize(vec3(aDirection.xy, aDirection.z * uRayDepth));
  vec3 across = vec3(-aDirection.y, aDirection.x, 0.0);
  vec3 p = aOrigin + direction * (uCardWidth * 0.004 + beamLength * along);
  float sharpWidth = (0.7 + sin(along * 3.14159265) * 0.3) * (1.0 - along * 0.8);
  float softWidth = 1.8 + along * 9.0;
  float width = uRayWidth * aStyle.y * mix(sharpWidth, softWidth, uSoft);
  p += across * position.y * width;
  p += across * sin(along * 5.0 + uTime * 0.6 + phase) * along * uCardWidth * 0.002;
  p.z += sin(along * 3.14159265) * aDirection.z * uCardWidth * uRayDepth * 0.12;
  vLight = aStyle.z * (1.0 + uPulse * (sin(uTime * 2.3 + phase) * 0.65 + sin(uTime * 4.1 + phase * 1.7) * 0.35));
  vMicro = aStyle.w;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
