#include <common>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

attribute vec3 aCenter;
attribute vec4 aData;
attribute vec3 aFlipbook;
uniform float uTime;
uniform float uPlaybackSpeed;
varying vec2 vUv;
varying vec3 vParticle;

void main() {
  vUv = mix(uv, 1.0 - uv, step(aFlipbook.yz, vec2(0.0)));
  vParticle = vec3(aData.z, aData.w, uTime * uPlaybackSpeed + aFlipbook.x);

  vec2 parentScale = vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
  vec2 corner = position.xy * aData.x * parentScale;
  float cosine = cos(aData.y);
  float sine = sin(aData.y);
  corner = mat2(cosine, sine, -sine, cosine) * corner;
  vec4 mvPosition = modelViewMatrix * vec4(aCenter, 1.0);
  mvPosition.xy += corner;
  gl_Position = projectionMatrix * mvPosition;

  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
