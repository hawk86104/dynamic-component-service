
uniform float uRibbonSideReflection;
uniform float uRibbonSideRoughness;
varying vec3 vRibbonSideNormal;
varying vec3 vRibbonSideView;
varying vec3 vRibbonSidePosition;

float ribbonSideNoise(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

void main() {
  ribbonSideBaseMain();
  vec3 n = normalize(vRibbonSideNormal);
  vec3 view = isOrthographic ? vec3(0.0, 0.0, 1.0) : normalize(vRibbonSideView);
  float fresnel = pow(1.0 - abs(dot(n, view)), 3.0);
  vec3 worldNormal = inverseTransformDirection(n, viewMatrix);
  vec3 worldView = inverseTransformDirection(view, viewMatrix);
  vec3 ray = reflect(-worldView, worldNormal);
  float specular = pow(max(dot(ray, normalize(vec3(-0.6, 1.2, 1.0))), 0.0), mix(80.0, 12.0, uRibbonSideRoughness));
  vec3 cell = vRibbonSidePosition * 145.0;
  vec3 footprint = fwidth(cell);
  float grainVisibility = 1.0 - smoothstep(0.7, 2.0, max(footprint.x, max(footprint.y, footprint.z)));
  float grain = (ribbonSideNoise(floor(cell)) - 0.5) * uRibbonSideRoughness * grainVisibility * 0.05;
  // A neutral scalar preserves the selected RGB hue, including saturated blue/red/green.
  float sheen = uRibbonSideReflection * (fresnel * 0.1 + specular * 0.18);
  gl_FragColor.rgb *= max(0.0, 1.0 + sheen + grain);
}
