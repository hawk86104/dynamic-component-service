precision mediump float;

attribute float aSize;
attribute float aSeed;
attribute float aOpacity;

varying float vSeed;
varying float vOpacity;

uniform float uTime;

void main() {
  vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewPosition;

  float perspective = clamp(220.0 / max(1.0, -modelViewPosition.z), 0.0, 220.0);
  float pulse = 0.92 + sin(uTime * (0.85 + aSeed * 0.65) + aSeed * 31.0) * 0.08;
  gl_PointSize = aSize * perspective * pulse;
  vSeed = aSeed;
  vOpacity = aOpacity;
}
