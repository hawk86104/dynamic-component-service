varying vec3 vLocalPos;

void main() {
  vLocalPos = position;

  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
