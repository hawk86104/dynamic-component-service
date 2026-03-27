precision mediump float;

varying vec3 vLocalNormal;
varying vec3 vLocalPosition;
varying vec3 vViewNormal;
varying vec3 vViewPosition;

void main() {
  vLocalPosition = position;
  vLocalNormal = normalize(normal);
  vViewNormal = normalize(normalMatrix * normal);
  vViewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;

  csm_Position = position;
}
