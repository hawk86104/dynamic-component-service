precision highp float;

varying vec2 vUv;

uniform sampler2D uFluid;
uniform float uDt;
uniform float uTime;
uniform float uDissipation;
uniform float uBuoyancy;
uniform float uCurlStrength;
uniform float uEmitStrength;
uniform float uFlameWidth;
uniform float uFlameHeight;
uniform float uTurbulence;
uniform float uFlameScaleX;
uniform float uFlameScaleY;
uniform float uFlameScaleZ;

#include <atlas_common>

vec3 hash3(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 74.7)),
    dot(p, vec3(269.5, 183.3, 246.1)),
    dot(p, vec3(113.5, 271.9, 124.6))
  );

  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float gnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      mix(
        dot(hash3(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)),
        dot(hash3(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)),
        u.x
      ),
      mix(
        dot(hash3(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
        dot(hash3(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)),
        u.x
      ),
      u.y
    ),
    mix(
      mix(
        dot(hash3(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
        dot(hash3(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)),
        u.x
      ),
      mix(
        dot(hash3(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
        dot(hash3(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)),
        u.x
      ),
      u.y
    ),
    u.z
  );
}

vec3 curlAt(vec3 p) {
  float e = 1.0 / uGrid;
  vec4 px1 = sampleVolume(uFluid, p + vec3(e, 0.0, 0.0));
  vec4 px0 = sampleVolume(uFluid, p - vec3(e, 0.0, 0.0));
  vec4 py1 = sampleVolume(uFluid, p + vec3(0.0, e, 0.0));
  vec4 py0 = sampleVolume(uFluid, p - vec3(0.0, e, 0.0));
  vec4 pz1 = sampleVolume(uFluid, p + vec3(0.0, 0.0, e));
  vec4 pz0 = sampleVolume(uFluid, p - vec3(0.0, 0.0, e));

  float curlX = (py1.z - py0.z) - (pz1.y - pz0.y);
  float curlY = (pz1.x - pz0.x) - (px1.z - px0.z);
  float curlZ = (px1.y - px0.y) - (py1.x - py0.x);

  return vec3(curlX, curlY, curlZ);
}

void main() {
  vec3 uvw = atlasToUvw(vUv);
  vec4 current = sampleVolume(uFluid, uvw);
  vec3 vel = current.xyz;
  float density = current.w;

  vec3 backtraced = uvw - vel * uDt * 0.5;
  vec4 advected = sampleVolume(uFluid, backtraced);

  vec3 newVel = advected.xyz;
  float newDensity = advected.w * uDissipation;

  float buoyancyMult = 0.7 + uFlameHeight;
  newVel.y += newDensity * uBuoyancy * buoyancyMult * uDt;

  if (uCurlStrength > 0.001) {
    vec3 c = curlAt(uvw);
    float e = 1.0 / uGrid;
    float cx1 = length(curlAt(uvw + vec3(e, 0.0, 0.0)));
    float cx0 = length(curlAt(uvw - vec3(e, 0.0, 0.0)));
    float cy1 = length(curlAt(uvw + vec3(0.0, e, 0.0)));
    float cy0 = length(curlAt(uvw - vec3(0.0, e, 0.0)));
    float cz1 = length(curlAt(uvw + vec3(0.0, 0.0, e)));
    float cz0 = length(curlAt(uvw - vec3(0.0, 0.0, e)));
    vec3 eta = vec3(cx1 - cx0, cy1 - cy0, cz1 - cz0);
    vec3 n = eta / (length(eta) + 1e-5);

    newVel += cross(n, c) * uCurlStrength * uDt;
  }

  float emitterY = 0.06;
  vec3 center = vec3(0.5, emitterY, 0.5);
  vec2 radialVec = uvw.xz - center.xz;
  vec2 scaledRadialVec = radialVec / vec2(uFlameScaleX, uFlameScaleZ);
  float radialDist = length(scaledRadialVec);
  float vertDist = uvw.y - center.y;

  float discRadius = 0.06 + uFlameWidth * 0.15;
  float discSigma = discRadius * 0.8;
  float discFalloff = exp(-radialDist * radialDist / (discSigma * discSigma));
  float vertFalloff = exp(-vertDist * vertDist / (0.03 * 0.03));
  float emit = discFalloff * vertFalloff;

  float angle1 = uTime * 1.5;
  float angle2 = angle1 + 3.14159;
  float angle3 = angle1 + 1.5708;
  float ringR = 0.04 + uFlameWidth * 0.08;
  float ringSize = 0.035 + uFlameWidth * 0.015;
  vec3 ring1 = center + vec3(sin(angle1) * ringR, 0.0, cos(angle1) * ringR);
  vec3 ring2 = center + vec3(sin(angle2) * ringR, 0.0, cos(angle2) * ringR);
  vec3 ring3 = center + vec3(sin(angle3) * ringR, 0.0, cos(angle3) * ringR);

  emit += 0.5 * exp(-dot(uvw - ring1, uvw - ring1) / (ringSize * ringSize));
  emit += 0.5 * exp(-dot(uvw - ring2, uvw - ring2) / (ringSize * ringSize));
  emit += 0.4 * exp(-dot(uvw - ring3, uvw - ring3) / (ringSize * ringSize));
  emit = clamp(emit, 0.0, 1.0);

  newDensity += emit * uEmitStrength * uDt * 50.0;
  newVel.y += emit * (2.0 + uFlameHeight * 3.0) * uDt;

  float turbFreq = 4.0 + uTurbulence * 12.0;
  float turbAmp = uTurbulence * 2.0;
  float emitRegion = smoothstep(0.0, 0.3, emit + density * 0.15);
  vec3 noiseCoord = uvw * turbFreq + vec3(uTime * 1.2, uTime * 0.8, uTime);
  float nx = gnoise(noiseCoord);
  float ny = gnoise(noiseCoord + vec3(31.416, 0.0, 0.0));
  float nz = gnoise(noiseCoord + vec3(0.0, 0.0, 71.063));

  newVel += vec3(nx, ny * 0.5, nz) * turbAmp * emitRegion * uDt;

  float turbAngle = atan(radialVec.y, radialVec.x);
  float swirlStrength = emit * 0.8 * uDt;
  newVel.x += -sin(turbAngle) * swirlStrength + emit * sin(uvw.y * 20.0 + uTime * 2.5) * 0.4 * uDt;
  newVel.z += cos(turbAngle) * swirlStrength + emit * cos(uvw.y * 20.0 + uTime * 2.0) * 0.4 * uDt;

  float inwardEdge = 0.1 + uFlameWidth * 0.18;
  float inwardOuter = inwardEdge + 0.15;
  float rawRadialDist = length(radialVec);
  float inwardForce = smoothstep(inwardEdge, inwardOuter, radialDist) * 1.2 * uDt;
  vec2 radialDir = rawRadialDist > 0.001 ? radialVec / rawRadialDist : vec2(0.0);
  float heightInfluence = 1.0 - smoothstep(0.0, 0.5, uvw.y);

  newVel.x -= radialDir.x * inwardForce * heightInfluence;
  newVel.z -= radialDir.y * inwardForce * heightInfluence;
  newVel *= 0.995;

  float boundary = 2.0 / uGrid;
  float cylRadius = length((uvw.xz - vec2(0.5)) / vec2(uFlameScaleX, uFlameScaleZ));
  float cylBoundaryInner = 0.28 + uFlameWidth * 0.15;
  float cylBoundary = smoothstep(cylBoundaryInner, cylBoundaryInner + 0.12, cylRadius);

  newVel *= mix(1.0, 0.05, cylBoundary);
  newDensity *= mix(1.0, 0.3, cylBoundary);

  if (uvw.x < boundary || uvw.x > 1.0 - boundary || uvw.z < boundary || uvw.z > 1.0 - boundary) {
    newVel *= 0.05;
  }

  if (uvw.y < boundary) {
    newVel.y = max(newVel.y, 0.0);
  }

  float topFadeStart = 0.55 + uFlameHeight * 0.35;
  float scaledY = 0.5 + (uvw.y - 0.5) / uFlameScaleY;
  float topFade = smoothstep(topFadeStart, topFadeStart + 0.15, scaledY);

  newDensity *= mix(1.0, 0.15, topFade);
  newVel.y = mix(newVel.y, min(newVel.y, 0.0), topFade);

  if (uvw.y > 1.0 - boundary) {
    newDensity *= 0.05;
    newVel.y = min(newVel.y, 0.0);
  }

  gl_FragColor = vec4(newVel, clamp(newDensity, 0.0, 8.0));
}
