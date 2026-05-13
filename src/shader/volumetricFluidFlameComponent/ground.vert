varying vec2 vGroundPos;

uniform float uGroundSize;

void main() {
  vGroundPos = position.xy * uGroundSize;
  csm_Position = position;
}
