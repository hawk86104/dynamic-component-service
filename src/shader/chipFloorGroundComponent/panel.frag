precision mediump float;

uniform vec3 uBaseColor;
uniform float uDotDensity;
uniform float uDotOpacity;
uniform float uExtrusion;
uniform vec3 uGlowColor;
uniform float uGlowIntensity;
uniform int uIterations;
uniform vec3 uParticleColor;
uniform float uParticleDensity;
uniform float uParticleSize;
uniform float uParticleSpeed;
uniform float uPlaneSize;
uniform float uPatternScale;
uniform float uTime;
uniform vec3 uTraceColor;
uniform vec3 uTrailColor;
uniform float uTrailLength;
uniform float uTrailSpeed;

varying vec2 vUv;

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

float getHeight(vec2 point) {
  return getPatternClean(point * uPatternScale) * uExtrusion;
}

vec3 getNormal(vec2 point) {
  float epsilon = 0.04 / max(uPatternScale, 0.0001);
  float heightL = getHeight(point - vec2(epsilon, 0.0));
  float heightR = getHeight(point + vec2(epsilon, 0.0));
  float heightD = getHeight(point - vec2(0.0, epsilon));
  float heightU = getHeight(point + vec2(0.0, epsilon));

  return normalize(vec3(heightL - heightR, epsilon * 2.2, heightD - heightU));
}

void main() {
  vec2 diskUv = vUv * 2.0 - 1.0;
  float diskRadius = length(diskUv);
  vec2 planePos = diskUv * (uPlaneSize * 0.5);

  float chip = getPatternClean(planePos * uPatternScale);
  float gap = 1.0 - chip;
  float topMask = smoothstep(0.9, 1.0, chip);
  float trenchMask = smoothstep(0.08, 0.92, gap);

  vec3 normalDirection = getNormal(planePos);
  vec3 lightDirection = normalize(vec3(0.45, 1.0, 0.35));
  vec3 viewDirection = vec3(0.0, 1.0, 0.0);
  vec3 reflectedDirection = reflect(-lightDirection, normalDirection);

  float diffuseLight = max(dot(normalDirection, lightDirection), 0.0);
  float specular = pow(max(dot(reflectedDirection, viewDirection), 0.0), 28.0) * topMask;
  float ambient = 0.28;

  vec3 materialColor = mix(uBaseColor, uTraceColor, topMask);
  materialColor *= 1.0 - gap * 0.12;

  vec3 color = materialColor * (ambient + diffuseLight * 0.78);
  color += vec3(1.0) * specular * 0.3;

  float trenchGlow = trenchMask * (0.45 + gap * 0.55);
  color += uGlowColor * trenchGlow * uGlowIntensity * 0.9;

  float trailFrequency = uPatternScale * 2.0;
  float trailIdX = floor(planePos.y * trailFrequency * 8.0);
  float trailIdY = floor(planePos.x * trailFrequency * 8.0);
  float trailRandX = rand2(vec2(trailIdX, 12.3));
  float trailRandY = rand2(vec2(trailIdY, 45.6));

  float trailDirX = sign(trailRandX - 0.5);
  float trailDirY = sign(trailRandY - 0.5);
  float trailSpeedX = uTime * uTrailSpeed * (trailRandX * 0.5 + 0.5);
  float trailSpeedY = uTime * uTrailSpeed * (trailRandY * 0.5 + 0.5);

  float pulseX = fract(planePos.x * trailFrequency * trailDirX - trailSpeedX + trailRandX * 10.0);
  float pulseY = fract(planePos.y * trailFrequency * trailDirY - trailSpeedY + trailRandY * 10.0);

  float trailX = pow(pulseX, uTrailLength) * step(0.6, trailRandX);
  float trailY = pow(pulseY, uTrailLength) * step(0.6, trailRandY);
  float trailMask = max(trailX, trailY) * trenchMask;
  color += uTrailColor * trailMask * 2.3;

  float particleFrequency = uPatternScale * 2.0;
  float particleIdX = floor(planePos.y * particleFrequency * 8.0);
  float particleIdY = floor(planePos.x * particleFrequency * 8.0);
  float particleRandX = rand2(vec2(particleIdX, 77.7));
  float particleRandY = rand2(vec2(particleIdY, 88.8));

  float particleDirX = sign(particleRandX - 0.5);
  float particleDirY = sign(particleRandY - 0.5);
  float particleSpeedX = uTime * uParticleSpeed * (particleRandX * 0.5 + 0.5);
  float particleSpeedY = uTime * uParticleSpeed * (particleRandY * 0.5 + 0.5);

  float particleDensity = uPatternScale * uParticleDensity;

  float lineCoordX = planePos.x * particleDensity * particleDirX - particleSpeedX + particleRandX * 10.0;
  float cellIdX = floor(lineCoordX);
  float cellFractX = fract(lineCoordX);
  float dotPosX = rand2(vec2(cellIdX, particleRandX)) * 0.6 + 0.2;
  float particleDistX = abs(cellFractX - dotPosX);
  float showDotX = step(0.4, rand2(vec2(cellIdX, particleRandX * 1.337)));

  float lineCoordY = planePos.y * particleDensity * particleDirY - particleSpeedY + particleRandY * 10.0;
  float cellIdY = floor(lineCoordY);
  float cellFractY = fract(lineCoordY);
  float dotPosY = rand2(vec2(cellIdY, particleRandY)) * 0.6 + 0.2;
  float particleDistY = abs(cellFractY - dotPosY);
  float showDotY = step(0.4, rand2(vec2(cellIdY, particleRandY * 1.337)));

  float dotScale = max(uParticleSize * 1.35, 0.0012);
  float dotSmooth = max(dotScale * 0.65, 0.0015);

  float particleX = smoothstep(dotScale + dotSmooth, dotScale, particleDistX) * step(0.4, particleRandX) * showDotX;
  float particleY = smoothstep(dotScale + dotSmooth, dotScale, particleDistY) * step(0.4, particleRandY) * showDotY;
  float particleMask = max(particleX, particleY) * trenchMask;
  color += uParticleColor * particleMask * 3.5;

  if (topMask > 0.0) {
    float dotScaleUv = uPatternScale * uDotDensity;
    vec2 dotUv = fract(planePos * dotScaleUv);
    vec2 dotId = floor(planePos * dotScaleUv);

    float dotMaskX = 1.0 - smoothstep(0.15, 0.25, abs(dotUv.x - 0.5));
    float dotMaskY = 1.0 - smoothstep(0.15, 0.25, abs(dotUv.y - 0.5));
    float dotGridMask = dotMaskX * dotMaskY;

    float dotRand = rand2(dotId * 1.337);
    float twinkle = sin(uTime * 2.5 + dotRand * 6.2831) * 0.5 + 0.5;
    float finalDotAlpha = uDotOpacity * (0.25 + 0.75 * twinkle) * (0.95 - diskRadius * 0.25);

    color += vec3(1.0) * dotGridMask * finalDotAlpha * topMask;
  }

  float vignette = 1.0 - smoothstep(0.2, 1.08, diskRadius);
  color *= 0.82 + vignette * 0.18;

  float edgeFade = 1.0 - smoothstep(0.72, 1.0, diskRadius);
  color = mix(uBaseColor * 0.14, color, smoothstep(0.0, 0.36, edgeFade));

  float alpha = smoothstep(0.0, 1.0, edgeFade);
  if (alpha < 0.02) {
    discard;
  }

  csm_DiffuseColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
