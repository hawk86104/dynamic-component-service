varying vec2 vCardUv;
varying vec3 vCardView;
varying vec3 vCardNormal;
varying vec3 vCardTangent;
varying vec3 vCardBitangent;

void main() {
  vCardUv = uv;
  vCardView = -(modelViewMatrix * vec4(position, 1.0)).xyz;
  vCardNormal = normalize(normalMatrix * normal);
  vCardTangent = normalize((modelViewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
  vCardBitangent = normalize((modelViewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
  csm_Position = position;
}
