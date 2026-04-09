uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uEmission;

varying float vBlend;

void main() {
  vec3 color = mix(uColorA, uColorB, vBlend) * uEmission;
  gl_FragColor = vec4(color, 1.0);
}
