#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
uniform vec3 uCardSize;
uniform vec3 uCardColor;
uniform vec3 uSecondaryColor;
uniform vec3 uHighlightColor;
uniform float uShine;
uniform float uOpacity;
uniform float uTime;
varying vec3 vLocal;
varying vec3 vViewNormal;
varying vec3 vViewPosition;

void main() {
  #include <clipping_planes_fragment>
  #include <logdepthbuf_fragment>
  vec2 p = vLocal.xy / uCardSize.xy;
  vec3 n = normalize(vViewNormal);
  vec3 viewDirection = normalize(vViewPosition);
  float fresnel = pow(1.0 - abs(dot(n, viewDirection)), 2.8);
  float drift = sin(uTime * 0.22) * 0.035;
  float mint = smoothstep(-0.35, 0.48, p.x + p.y * 0.4 + drift);
  vec3 color = mix(uCardColor, uSecondaryColor, mint * 0.9);
  float warm = exp(-dot((p - vec2(0.05, 0.31)) * vec2(2.6, 3.2), (p - vec2(0.05, 0.31)) * vec2(2.6, 3.2)));
  color = mix(color, uHighlightColor, warm * 0.68);
  float bottomShade = mix(0.42, 1.0, smoothstep(-0.52, 0.1, p.y));
  float glint = pow(max(dot(n, normalize(vec3(-0.45, 0.8, 1.0))), 0.0), 32.0);
  float streak = exp(-pow((p.x + p.y * 0.27 + 0.3) * 23.0, 2.0)) * smoothstep(-0.1, 0.5, p.y);
  color *= bottomShade;
  color += (glint * 0.36 + streak * 0.18 + fresnel * 0.65) * uShine * vec3(1.0, 0.96, 0.89);
  gl_FragColor = vec4(color, uOpacity);
  #include <colorspace_fragment>
}
