#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

uniform float uTime;
uniform float uIntensity;
uniform float uErosion;
uniform float uSoftness;
uniform float uFresnelPower;
uniform float uTextureScale;
uniform float uScrollSpeed;
uniform float uDistortion;
uniform float uDistortionSpeed;
uniform float uBrightness;
uniform vec3 uColorCore;
uniform vec3 uColorMid;
uniform vec3 uColorDeep;
varying vec3 vFirePosition;
varying vec3 vFireNormal;
varying vec3 vViewPosition;
varying vec3 vViewNormal;
varying float vMask;

float fireFbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amplitude * fireNoise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value * 0.5 + 0.5;
}

float sampleFire(vec2 plane) {
  vec2 uv = plane * uTextureScale;
  vec2 distortionUv = uv * 0.8 - vec2(0.0, uTime * uDistortionSpeed);
  uv += vec2(fireNoise(vec3(distortionUv, 1.7)), fireNoise(vec3(distortionUv, 9.3))) * uDistortion;
  uv.y = uv.y * 0.5 - uTime * uScrollSpeed;
  return fireFbm(vec3(uv, uTime * 0.15));
}

void main() {
  vec4 diffuseColor = vec4(1.0);
  #include <clipping_planes_fragment>
  vec2 weights = abs(normalize(vFireNormal).xz) + 0.001;
  weights /= weights.x + weights.y;
  float fire = sampleFire(vFirePosition.zy) * weights.x + sampleFire(vFirePosition.xy) * weights.y;
  float heat = fire - vMask * uErosion - (1.0 - uIntensity);
  float alpha = smoothstep(0.0, uSoftness, heat);
  vec3 viewDirection = isOrthographic ? vec3(0.0, 0.0, 1.0) : normalize(vViewPosition);
  float facing = abs(dot(normalize(vViewNormal), viewDirection));
  alpha *= pow(max(facing, 0.0001), uFresnelPower) * uIntensity;
  alpha *= diffuseColor.a;
  if (alpha < 0.001) { discard; }

  float ramp = clamp(heat * 1.6, 0.0, 1.0);
  vec3 color = mix(uColorDeep, uColorMid, smoothstep(0.0, 0.5, ramp));
  color = mix(color, uColorCore, smoothstep(0.5, 1.0, ramp));
  gl_FragColor = vec4(color * uBrightness, alpha);
  #include <logdepthbuf_fragment>
  #include <colorspace_fragment>
}
