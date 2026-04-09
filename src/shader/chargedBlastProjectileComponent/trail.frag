uniform vec3 uColor;
uniform float uEdgeSoftness;
uniform float uOpacity;

varying vec2 vUv;
varying vec3 vNormal;

void main() {
  float tailFade = vUv.y;
  float facing = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
  float edgeFade = pow(facing, max(0.01, uEdgeSoftness));
  float alpha = edgeFade * tailFade * uOpacity;
  gl_FragColor = vec4(uColor, alpha);
}
