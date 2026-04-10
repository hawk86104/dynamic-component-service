varying vec2 vBlastUv;
varying vec3 vBlastNormal;

void main() {
  vBlastUv = uv;
  vBlastNormal = normalize(normalMatrix * normal);
  csm_Position = position;
}
