precision highp sampler3D;
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

uniform sampler3D uFireVolume;
uniform vec3 uColorLow;
uniform vec3 uColorMid;
uniform vec3 uColorHigh;
uniform float uIntensity;
varying vec2 vUv;
varying vec3 vParticle;

void main() {
  vec4 diffuseColor = vec4(1.0);
  #include <clipping_planes_fragment>
  float density = texture(uFireVolume, vec3(vUv, fract(vParticle.z))).r;
  float ageFade = smoothstep(0.0, 0.15, vParticle.x) * (1.0 - smoothstep(0.55, 1.0, vParticle.x));
  float heat = density * ageFade;
  float opacity = heat * vParticle.y;
  if (opacity < 0.005) { discard; }

  vec3 warmColor = mix(uColorLow, uColorMid, smoothstep(0.12, 0.55, heat));
  vec3 hotColor = mix(warmColor, uColorHigh, smoothstep(0.55, 0.92, heat));
  gl_FragColor = vec4(hotColor * uIntensity, opacity * diffuseColor.a);
  #include <logdepthbuf_fragment>
  #include <colorspace_fragment>
}
