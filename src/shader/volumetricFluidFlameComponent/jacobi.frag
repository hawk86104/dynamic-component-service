precision highp float;

varying vec2 vUv;

uniform sampler2D uPressure;
uniform sampler2D uDivergence;

#include <atlas_common>

void main() {
  vec3 uvw = atlasToUvw(vUv);
  float e = 1.0 / uGrid;

  float pxp = sampleVolume(uPressure, uvw + vec3(e, 0.0, 0.0)).r;
  float pxn = sampleVolume(uPressure, uvw - vec3(e, 0.0, 0.0)).r;
  float pyp = sampleVolume(uPressure, uvw + vec3(0.0, e, 0.0)).r;
  float pyn = sampleVolume(uPressure, uvw - vec3(0.0, e, 0.0)).r;
  float pzp = sampleVolume(uPressure, uvw + vec3(0.0, 0.0, e)).r;
  float pzn = sampleVolume(uPressure, uvw - vec3(0.0, 0.0, e)).r;
  float div = sampleVolume(uDivergence, uvw).r;
  float p = (pxp + pxn + pyp + pyn + pzp + pzn - div) / 6.0;

  gl_FragColor = vec4(p, 0.0, 0.0, 1.0);
}
