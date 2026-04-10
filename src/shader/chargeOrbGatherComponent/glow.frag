uniform vec3 uColorInner;
uniform vec3 uColorOuter;
uniform float uEmission;
uniform float uProgress;
uniform float uFalloffPower;
uniform float uEdgeSoftness;

varying vec3 vOrbNormal;

void main() {
  float fresnel = 1.0 - abs(dot(normalize(vOrbNormal), vec3(0.0, 0.0, 1.0)));
  float glow = pow(clamp(1.0 - fresnel, 0.0, 1.0), uFalloffPower);
  vec3 color = mix(uColorInner, uColorOuter, pow(fresnel, uEdgeSoftness));
  float alpha = glow * uEmission * uProgress;
  csm_DiffuseColor = vec4(color * alpha, alpha);
}
