uniform vec3 uColor;
uniform float uEdgeSoftness;
uniform float uOpacity;

varying vec2 vBlastUv;
varying vec3 vBlastNormal;

void main() {
  float tailFade = vBlastUv.y;
  float facing = abs(dot(vBlastNormal, vec3(0.0, 0.0, 1.0)));
  float edgeFade = pow(facing, max(0.01, uEdgeSoftness));
  float alpha = edgeFade * tailFade * uOpacity;
  csm_DiffuseColor = vec4(uColor, alpha);
}
