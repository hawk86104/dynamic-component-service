uniform float uHeight;

varying float vHeightProgress;

void main() {
  float safeHeight = max(uHeight, 0.0001);
  vHeightProgress = clamp((position.y + safeHeight * 0.5) / safeHeight, 0.0, 1.0);
  csm_Position = position;
}
