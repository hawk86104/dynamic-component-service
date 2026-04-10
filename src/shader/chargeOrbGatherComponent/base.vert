varying vec3 vOrbNormal;
varying vec3 vOrbObjPos;

void main() {
  vOrbNormal = normalize(normalMatrix * normal);
  vOrbObjPos = position;
  csm_Position = position;
}
