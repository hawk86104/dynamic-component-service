#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
uniform vec2 uCardSize;
uniform vec3 uColor;
uniform vec3 uCoronaColor;
uniform float uLayerScale;
uniform float uCoronaIntensity;
uniform float uIntensity;
uniform float uOpacity;
uniform float uTime;
uniform float uPulse;
varying vec3 vLocal;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  float facing = abs(dot(normalize(vViewNormal), normalize(vViewPosition)));
  float alpha = pow(facing, 1.4);
  float shimmer = 1.0 + sin(vUv.x * 127.0 + uTime * 2.0) * uPulse * 0.08;
  vec3 color = uCoronaColor * (0.9 + uCoronaIntensity * 0.15);
  if (uLayerScale > 1.5) {
    float shoulder = (uCardSize.y - uCardSize.x) * 0.5;
    vec2 p = vec2(vLocal.x, vLocal.y - clamp(vLocal.y, -shoulder, shoulder));
    float outside = (length(p) - uCardSize.x * 0.5) / uCardSize.x;
    alpha *= smoothstep(-0.008, 0.018, outside);
    alpha *= uLayerScale < 5.0 ? 0.20 : 0.055;
    color = mix(uColor, uCoronaColor, uLayerScale < 5.0 ? 0.22 : 0.0);
  }
  alpha *= uOpacity * uIntensity * uCoronaIntensity * shimmer;
  if (alpha < 0.002) { discard; }
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
