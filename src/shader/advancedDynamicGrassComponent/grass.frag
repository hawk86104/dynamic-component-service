uniform vec3 uGrassBottom;
uniform vec3 uGrassTop;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uLightIntensity;
uniform vec3 uBacklightColor;
uniform float uBacklightStrength;
uniform float uBacklightPower;
uniform float uBacklightTip;
uniform float uBrightness;

varying float vBladeHeight;
varying vec3 vBladeNormal;
varying vec3 vWorldPosition;

void main() {
  float gradient = smoothstep(0.08, 1.0, vBladeHeight);
  vec3 grassColor = mix(uGrassBottom, uGrassTop, gradient);

  vec3 lightDirection = normalize(uLightDirection);
  float diffuse = 0.35 + 0.65 * max(dot(vec3(0.0, 1.0, 0.0), lightDirection), 0.0);
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float viewToLight = pow(
    max(dot(viewDirection, -lightDirection), 0.0),
    uBacklightPower
  );
  float edgeOn = 1.0 - abs(dot(normalize(vBladeNormal), lightDirection));
  float thinTip = mix(1.0, vBladeHeight, uBacklightTip);
  float transmission = viewToLight * edgeOn * thinTip * uBacklightStrength;

  vec3 lit = grassColor * diffuse * uLightColor * uLightIntensity;
  lit += uBacklightColor * uLightColor * uLightIntensity * transmission;
  gl_FragColor = vec4(lit * uBrightness, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
