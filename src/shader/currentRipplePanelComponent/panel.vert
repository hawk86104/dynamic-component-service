precision mediump float;

varying vec2 vUv;
varying vec3 vViewBitangent;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
varying vec3 vViewTangent;

void main() {
  vUv = uv;
  vViewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  vViewNormal = normalize(normalMatrix * normal);
  vViewTangent = normalize((modelViewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
  vViewBitangent = normalize((modelViewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);

  csm_Position = position;
}
