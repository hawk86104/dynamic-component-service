precision highp float;

uniform vec3 uColor;
uniform float uInnerRadius;
uniform float uScanSpeed;
uniform float uTime;

varying vec2 vUv;

const float TAU = 6.28318530718;
const float SCAN_ANGULAR_SPEED = 2.25;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);

  if (r < uInnerRadius || r > 1.0) {
    discard;
  }

  float speedMagnitude = abs(uScanSpeed);
  float direction = uScanSpeed < 0.0 ? -1.0 : 1.0;
  float angle = mod(atan(p.y, p.x) + TAU, TAU);
  float sweepAngle = mod(uTime * speedMagnitude * SCAN_ANGULAR_SPEED * direction, TAU);
  float trailDelta = mod((sweepAngle - angle) * direction + TAU, TAU);
  float fan = exp(-trailDelta * 1.2) * (1.0 - smoothstep(1.75, 2.9, trailDelta));
  float ringDetail = pow(0.5 + 0.5 * sin(r * 92.0 - trailDelta * 7.0), 7.0);
  float radialDetail = pow(0.5 + 0.5 * sin(angle * 48.0 + r * 9.0), 12.0);
  float centerFade = smoothstep(uInnerRadius, uInnerRadius + 0.08, r);
  float edgeFade = 1.0 - smoothstep(0.88, 1.0, r);

  float alpha = fan * (0.07 + ringDetail * 0.1 + radialDetail * 0.04);
  alpha *= centerFade * edgeFade;

  if (alpha < 0.004) {
    discard;
  }

  vec3 color = mix(uColor * 0.62, vec3(1.0), clamp(ringDetail * fan, 0.0, 1.0) * 0.35);
  gl_FragColor = vec4(color, alpha);
}
