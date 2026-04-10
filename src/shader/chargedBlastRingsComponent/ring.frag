uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uEmission;

varying float vBlastRingBlend;

void main() {
  vec3 color = mix(uColorA, uColorB, vBlastRingBlend) * uEmission;
  csm_DiffuseColor = vec4(color, 1.0);
}
