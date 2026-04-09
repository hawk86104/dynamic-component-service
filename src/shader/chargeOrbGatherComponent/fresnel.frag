uniform vec3 uCoreColor;
uniform vec3 uRimColor;
uniform float uEmission;
uniform float uProgress;
uniform float uFresnelPower;
uniform float uBodyFalloff;
uniform float uCoreFalloff;
uniform float uCoreBoost;

varying vec3 vNormal;

void main() {
  float fresnel = 1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
  float body = pow(max(0.0, 1.0 - fresnel), uBodyFalloff);
  float core = pow(max(0.0, 1.0 - fresnel * uCoreFalloff), 4.0);
  vec3 color = mix(uCoreColor, uRimColor, pow(fresnel, uFresnelPower));
  float brightness = (body + core * uCoreBoost) * uEmission * uProgress;
  gl_FragColor = vec4(color * brightness, brightness);
}
