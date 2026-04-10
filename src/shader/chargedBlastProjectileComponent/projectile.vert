varying float vBlastPosY;
varying vec3 vBlastNormal;

void main() {
  vBlastPosY = position.y;
  vBlastNormal = normalize(normalMatrix * normal);
  csm_Position = position;
}
