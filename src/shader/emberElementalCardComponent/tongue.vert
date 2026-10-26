#include <common>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
attribute vec3 aRoot;
attribute vec4 aShape;
uniform vec2 uCardSize;
uniform float uThickness;
uniform float uFlameHeight;
uniform float uFlameWidth;
uniform float uFlameDepth;
uniform float uTime;
uniform float uTurbulence;
varying vec2 vUv;
varying float vSeed;
varying float vLayer;

void main() {
  float u = uv.x;
  float t = uTime;
  float phase = aShape.z * 6.283185;
  float growth = 0.91 + sin(t * 5.1 + phase) * 0.12 + sin(t * 2.7 + phase * 1.7) * 0.08;
  float rise = u * aShape.x * uFlameHeight * growth;
  float curl = sin(rise * 6.5 - t * 3.7 + phase) * (0.045 + rise * 0.07);
  curl += sin(rise * 12.0 - t * 5.2 + phase * 2.3) * 0.017;
  curl *= uTurbulence * pow(u, 0.8);
  float flare = aRoot.x * sin(u * 3.14159265) * 0.24 * uFlameWidth;
  float taper = pow(max(1.0 - u, 0.0), 1.15);
  float bladeWidth = aShape.y * (0.8 + sin(u * 3.14159) * 0.2) * taper * uFlameWidth;
  vec3 p = vec3(aRoot.x + flare + curl + position.y * bladeWidth, aRoot.y + rise, aRoot.z * uFlameDepth);
  p.z += sin(u * 5.0 - t * 2.1 + phase) * u * uFlameDepth * 0.13;
  p *= uCardSize.x;
  p.y += (uCardSize.y - uCardSize.x) * 0.5;
  p.z -= uThickness * 0.5 + uCardSize.x * 0.055;
  vUv = uv;
  vSeed = aShape.z;
  vLayer = aShape.w;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
