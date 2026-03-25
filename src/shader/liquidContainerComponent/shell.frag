precision mediump float;

uniform vec3 uShellColor;
uniform float uOpacity;
uniform vec3 uHalfExtents;
uniform float uClipX;
uniform float uClipZ;

varying vec3 vLocalPosition;
varying vec3 vViewNormal;
varying vec3 vViewPosition;

void main() {
  float clipThresholdX = mix(-uHalfExtents.x, uHalfExtents.x, clamp(uClipX, 0.0, 1.0));
  float clipThresholdZ = mix(-uHalfExtents.z, uHalfExtents.z, clamp(uClipZ, 0.0, 1.0));

  if (vLocalPosition.x > clipThresholdX || vLocalPosition.z > clipThresholdZ) {
    discard;
  }

  vec3 viewNormal = normalize(vViewNormal);
  vec3 viewDirection = normalize(-vViewPosition);
  float fresnel = pow(1.0 - max(dot(viewNormal, viewDirection), 0.0), 2.2);
  float heightMix = clamp((vLocalPosition.y + uHalfExtents.y) / max(0.0001, uHalfExtents.y * 2.0), 0.0, 1.0);

  vec3 color = mix(uShellColor * 0.72, uShellColor * 1.18, min(1.0, heightMix * 0.35 + fresnel * 0.9));
  float alpha = uOpacity * (0.22 + fresnel * 0.78);

  if (alpha <= 0.01) {
    discard;
  }

  csm_DiffuseColor = vec4(color, min(alpha, 1.0));
}
