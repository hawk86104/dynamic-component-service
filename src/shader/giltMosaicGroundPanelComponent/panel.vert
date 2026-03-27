precision mediump float;

varying vec2 vUv;
varying vec3 vViewNormal;
varying vec3 vViewTangent;
varying vec3 vViewBitangent;

void main() {
  vUv = uv;
  vViewNormal = normalize(normalMatrix * normal);
  vViewTangent = normalize((modelViewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
  vViewBitangent = normalize((modelViewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);

  csm_Position = position;
}
