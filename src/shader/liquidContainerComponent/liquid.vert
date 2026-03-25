precision mediump float;

varying vec3 vLocalPosition;
varying vec3 vWorldPosition;

void main() {
  vLocalPosition = position;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  csm_Position = position;
}
