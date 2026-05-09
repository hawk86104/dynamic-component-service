precision highp float;

varying vec2 vUv;

uniform sampler2D uFluid;
uniform sampler2D uPressure;

#include <atlas_common>

void main() {
  vec3 uvw = atlasToUvw(vUv);
  float e = 1.0 / uGrid;
  vec4 fluid = sampleVolume(uFluid, uvw);

  float pxp = sampleVolume(uPressure, uvw + vec3(e, 0.0, 0.0)).r;
  float pxn = sampleVolume(uPressure, uvw - vec3(e, 0.0, 0.0)).r;
  float pyp = sampleVolume(uPressure, uvw + vec3(0.0, e, 0.0)).r;
  float pyn = sampleVolume(uPressure, uvw - vec3(0.0, e, 0.0)).r;
  float pzp = sampleVolume(uPressure, uvw + vec3(0.0, 0.0, e)).r;
  float pzn = sampleVolume(uPressure, uvw - vec3(0.0, 0.0, e)).r;
  vec3 gradP = 0.5 * vec3(pxp - pxn, pyp - pyn, pzp - pzn);

  fluid.xyz -= gradP;

  gl_FragColor = fluid;
}
