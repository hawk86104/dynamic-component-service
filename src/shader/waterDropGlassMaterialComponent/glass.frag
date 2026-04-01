precision mediump float;

uniform sampler2D uBackgroundMap;
uniform sampler2D uForegroundMap;
uniform vec2 uMapResolution;
uniform float uAlphaMultiply;
uniform float uAlphaSubtract;
uniform float uBrightness;
uniform float uOpacity;
uniform float uRefraction;
uniform bool uRenderShadow;
uniform bool uRenderShine;
uniform sampler2D uShineMap;
uniform sampler2D uWaterMap;

varying vec2 vUv;

vec4 blend(vec4 bg, vec4 fg) {
  vec3 bgm = bg.rgb * bg.a;
  vec3 fgm = fg.rgb * fg.a;
  float inverseAlpha = 1.0 - fg.a;
  float alpha = fg.a + bg.a * inverseAlpha;
  vec3 rgb = vec3(0.0);

  if (alpha > 0.0) {
    rgb = (fgm + bgm * inverseAlpha) / alpha;
  }

  return vec4(rgb, alpha);
}

vec2 pixel() {
  return vec2(1.0) / max(uMapResolution, vec2(1.0));
}

vec4 fgColor(float x, float y) {
  vec2 sampleUv = clamp(vUv + (pixel() * vec2(x, y)), vec2(0.0), vec2(1.0));
  return texture2D(uWaterMap, sampleUv);
}

void main() {
  vec4 bg = texture2D(uBackgroundMap, vUv);
  vec4 cur = fgColor(0.0, 0.0);

  float depth = cur.b;
  float offsetX = cur.g;
  float offsetY = cur.r;
  float alpha = clamp(cur.a * uAlphaMultiply - uAlphaSubtract, 0.0, 1.0);

  vec2 refraction = (vec2(offsetX, offsetY) - 0.5) * 2.0;
  vec2 refractionUv = clamp(
    vUv + (pixel() * refraction * (256.0 * uRefraction + (depth * 256.0 * uRefraction))),
    vec2(0.0),
    vec2(1.0)
  );

  vec4 tex = texture2D(uForegroundMap, refractionUv);

  if (uRenderShine) {
    float maxShine = 490.0;
    float minShine = maxShine * 0.18;
    vec2 shineUv = vec2(0.5) + ((1.0 / 512.0) * refraction) * -(minShine + ((maxShine - minShine) * depth));
    tex = blend(tex, texture2D(uShineMap, shineUv));
  }

  vec4 fg = vec4(tex.rgb * uBrightness, alpha);

  if (uRenderShadow) {
    float borderAlpha = fgColor(0.0, 0.0 - (depth * 6.0)).a;
    borderAlpha = borderAlpha * uAlphaMultiply - (uAlphaSubtract + 0.5);
    borderAlpha = clamp(borderAlpha, 0.0, 1.0);
    borderAlpha *= 0.2;
    fg = blend(vec4(0.0, 0.0, 0.0, borderAlpha), fg);
  }

  vec4 color = blend(bg, fg);
  gl_FragColor = vec4(color.rgb, clamp(color.a * uOpacity, 0.0, 1.0));
}
