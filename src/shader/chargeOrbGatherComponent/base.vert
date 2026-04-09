varying vec3 vNormal;
varying vec3 vObjPos;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vObjPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
