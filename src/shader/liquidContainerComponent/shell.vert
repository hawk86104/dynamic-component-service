precision mediump float;

varying vec3 vLocalPosition;
varying vec3 vViewNormal;
varying vec3 vViewPosition;

void main() {
  vLocalPosition = position;
  vViewNormal = normalize(normalMatrix * normal);

  vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = modelViewPosition.xyz;
  csm_Position = position;
}
