uniform sampler2D uMask;

varying vec2 vMaskUv;
varying vec3 vPetalColor;
varying vec3 vFoliageColor;
varying vec3 vCentreColor;

void main() {
  vec4 mask = texture2D(uMask, vMaskUv);
  if (mask.a < 0.28) {
    discard;
  }

  vec3 color = mask.r * vPetalColor
    + mask.g * vFoliageColor
    + mask.b * vCentreColor;
  gl_FragColor = vec4(color, mask.a);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
