
varying vec3 vRibbonSideNormal;
varying vec3 vRibbonSideView;
varying vec3 vRibbonSidePosition;

void main() {
  ribbonSideBaseMain();
  vRibbonSideNormal = normalize(normalMatrix * normal);
  vRibbonSideView = -(modelViewMatrix * vec4(position, 1.0)).xyz;
  vRibbonSidePosition = position;
}
