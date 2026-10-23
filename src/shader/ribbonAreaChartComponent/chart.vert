uniform float uWidth;
uniform float uHeight;
varying vec2 vChart;
varying vec3 vNormal;
varying vec3 vView;

void main() {
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vChart = vec2(position.x / max(uWidth, 0.001) + 0.5, position.y / max(uHeight, 0.001));
  vNormal = normalize(normalMatrix * normal);
  vView = -viewPosition.xyz;
  gl_Position = projectionMatrix * viewPosition;
}
