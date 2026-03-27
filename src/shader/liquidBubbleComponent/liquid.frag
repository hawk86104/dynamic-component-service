precision mediump float;

uniform vec3 uBaseColor;
uniform vec3 uTopColor;
uniform float uWidth;
uniform float uDepth;
uniform float uHeight;
uniform float uRadius;
uniform float uOpacity;
uniform float uShapeType;

varying vec3 vLocalNormal;
varying vec3 vLocalPosition;
varying vec3 vViewNormal;
varying vec3 vViewPosition;

float hash21(vec2 value) {
  return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise2(vec2 value) {
  vec2 base = floor(value);
  vec2 fraction = fract(value);
  vec2 smoothFraction = fraction * fraction * (3.0 - 2.0 * fraction);

  float a = hash21(base);
  float b = hash21(base + vec2(1.0, 0.0));
  float c = hash21(base + vec2(0.0, 1.0));
  float d = hash21(base + vec2(1.0, 1.0));

  return mix(
    mix(a, b, smoothFraction.x),
    mix(c, d, smoothFraction.x),
    smoothFraction.y
  );
}

void main() {
  float heightT = clamp((vLocalPosition.y / max(uHeight, 0.0001)) + 0.5, 0.0, 1.0);
  vec3 viewNormal = normalize(vViewNormal);
  vec3 viewDir = normalize(-vViewPosition);

  float fresnel = pow(1.0 - abs(dot(viewNormal, viewDir)), 1.65);
  float topBand = smoothstep(0.76, 1.0, heightT);
  float topSurface = smoothstep(0.35, 1.0, vLocalNormal.y) * topBand;
  float edgeLift = smoothstep(0.12, 0.95, fresnel);
  float sideMask = 1.0 - smoothstep(0.4, 0.98, abs(vLocalNormal.y));

  vec2 localPlane = vLocalPosition.xz;
  if (uShapeType < 0.5) {
    localPlane.x /= max(uWidth, 0.0001);
    localPlane.y /= max(uDepth, 0.0001);
  }
  else {
    localPlane /= max(uRadius * 2.0, 0.0001);
  }

  float bodyNoise = noise2(localPlane * 5.5 + vec2(heightT * 2.0, fresnel * 1.5));
  vec3 liquidColor = mix(uBaseColor, uTopColor, smoothstep(0.05, 1.0, heightT));
  liquidColor *= mix(0.88, 1.06, bodyNoise * 0.45 + heightT * 0.55);
  liquidColor = mix(liquidColor, vec3(1.0), edgeLift * 0.2 + topSurface * 0.26);
  liquidColor += vec3(1.0, 0.92, 0.8) * sideMask * topBand * 0.08;

  float alpha = uOpacity;
  alpha *= mix(0.84, 1.0, heightT);
  alpha += edgeLift * 0.08;
  alpha += topSurface * 0.06;
  alpha = clamp(alpha, 0.0, 1.0);

  csm_DiffuseColor = vec4(liquidColor, alpha);
}
