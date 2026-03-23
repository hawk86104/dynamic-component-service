varying vec3 vShieldNormal;
varying vec3 vShieldViewDir;
varying vec3 vShieldObjPos;

void main() {
  vShieldObjPos = position;
  vShieldNormal = normalize(normalMatrix * normal);
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vShieldViewDir = normalize(-viewPosition.xyz);
  csm_Position = position;
}
