#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
uniform vec3 uColor;
uniform float uIntensity;
uniform float uOpacity;
uniform float uGround;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  float alpha;
  if (uGround > 0.5) {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = dot(p, p);
    alpha = exp(-r * 5.0) * (1.0 - smoothstep(0.6, 1.0, r));
  } else {
    alpha = pow(abs(dot(normalize(vNormal), normalize(vView))), 1.5) * 0.17;
  }
  alpha *= uIntensity * uOpacity;
  if (alpha < 0.001) { discard; }
  gl_FragColor = vec4(uColor, alpha);
  #include <colorspace_fragment>
}
