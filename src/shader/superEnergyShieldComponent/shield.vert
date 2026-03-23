varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vObjPos;

void main() {
  vObjPos = position;
  vNormal = normalize(normalMatrix * normal);
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-viewPosition.xyz);
  gl_Position = projectionMatrix * viewPosition;
}
