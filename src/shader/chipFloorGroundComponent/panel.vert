precision mediump float;

uniform float uExtrusion;
uniform int uIterations;
uniform float uPatternScale;
uniform float uPlaneSize;

varying vec2 vUv;
varying vec3 vViewBitangent;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
varying vec3 vViewTangent;

float rand2(vec2 value) {
  return fract(sin(dot(value.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float getPatternClean(vec2 point) {
  vec2 grid = floor(point);
  vec2 localPoint = fract(point);
  vec2 state = grid;
  float lines = 0.0;

  for (int i = 0; i < 10; i++) {
    if (i < uIterations) {
      float weight = exp2(float(i));
      float splitX;
      float splitY;
      float thickness = 0.02 + 0.01 * float(i);
      float bevel = 0.025;

      splitX = rand2(state + vec2(0.0, float(i)));
      if (localPoint.x < splitX) {
        state.x += weight;
      }
      else {
        state.x -= weight;
      }
      float lineX = smoothstep(thickness + bevel, thickness, abs(localPoint.x - splitX));

      splitY = rand2(state + vec2(1.0, float(i)));
      if (localPoint.y < splitY) {
        state.y += weight;
      }
      else {
        state.y -= weight;
      }
      float lineY = smoothstep(thickness + bevel, thickness, abs(localPoint.y - splitY));

      lines = max(lines, max(lineX, lineY));
    }
  }

  return 1.0 - lines;
}

float getRadialLiftMask(vec2 uv) {
  vec2 diskUv = uv * 2.0 - 1.0;
  float diskRadius = length(diskUv);
  return 1.0 - smoothstep(0.78, 1.04, diskRadius);
}

void main() {
  vUv = uv;

  vec2 planePos = (uv * 2.0 - 1.0) * (uPlaneSize * 0.5);
  float chipHeight = getPatternClean(planePos * uPatternScale) * uExtrusion * getRadialLiftMask(uv);
  vec3 displacedPosition = position + normal * chipHeight;
  vec4 viewPosition = modelViewMatrix * vec4(displacedPosition, 1.0);

  vViewPosition = viewPosition.xyz;
  vViewNormal = normalize(normalMatrix * normal);
  vViewTangent = normalize((modelViewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
  vViewBitangent = normalize((modelViewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);

  csm_Position = displacedPosition;
}
