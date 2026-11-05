#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

uniform sampler2D uSmokeTexture;
uniform vec3 uSmokeColor;
uniform vec3 uWarmColor;
uniform float uSmokeOpacity;
varying vec2 vUv;
varying vec3 vParticle;

void main() {
  vec4 diffuseColor = vec4(1.0);
  #include <clipping_planes_fragment>
  float shape = texture2D(uSmokeTexture, vUv).r;
  float fade = smoothstep(0.0, 0.15, vParticle.x) * (1.0 - smoothstep(0.5, 1.0, vParticle.x));
  float opacity = shape * fade * vParticle.y * uSmokeOpacity;
  if (opacity < 0.005) { discard; }

  float warmth = 1.0 - smoothstep(0.0, 0.35, vParticle.x);
  vec3 smokeColor = uSmokeColor + uWarmColor * warmth * 0.28;
  gl_FragColor = vec4(smokeColor, opacity * diffuseColor.a);
  #include <logdepthbuf_fragment>
  #include <colorspace_fragment>
}
