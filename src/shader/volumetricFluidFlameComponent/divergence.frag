precision highp float;

varying vec2 vUv;

uniform sampler2D uFluid;

#include <atlas_common>

void main() {
  vec3 uvw = atlasToUvw(vUv);
  float e = 1.0 / uGrid;

  float vxp = sampleVolume(uFluid, uvw + vec3(e, 0.0, 0.0)).x;
  float vxn = sampleVolume(uFluid, uvw - vec3(e, 0.0, 0.0)).x;
  float vyp = sampleVolume(uFluid, uvw + vec3(0.0, e, 0.0)).y;
  float vyn = sampleVolume(uFluid, uvw - vec3(0.0, e, 0.0)).y;
  float vzp = sampleVolume(uFluid, uvw + vec3(0.0, 0.0, e)).z;
  float vzn = sampleVolume(uFluid, uvw - vec3(0.0, 0.0, e)).z;

  float div = 0.5 * ((vxp - vxn) + (vyp - vyn) + (vzp - vzn));

  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
