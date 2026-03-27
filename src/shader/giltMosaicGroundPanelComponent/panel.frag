precision mediump float;

uniform float uAnimationMode;
uniform vec3 uBaseColor;
uniform vec3 uGroutColor;
uniform float uGroutWidth;
uniform vec3 uSheenColor;
uniform vec3 uHighlightColor;
uniform float uLightSpeed;
uniform float uOpacity;
uniform float uPanelLength;
uniform float uPanelWidth;
uniform float uTileDensity;
uniform float uWaveDelay;
uniform float uWaveDirection;
uniform float uWaveSpeed;
uniform float uSparkleIntensity;
uniform float uTime;

varying vec2 vUv;
varying vec3 vViewNormal;
varying vec3 vViewTangent;
varying vec3 vViewBitangent;

const float GM_PI = 3.14159265359;
const float GM_TAU = 6.28318530718;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec2 hash2(vec2 p) {
  return vec2(
    fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453),
    fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453)
  );
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec4 tileGrid(vec2 p, float scale) {
  vec2 scaledPosition = p * scale;
  vec2 tileId = floor(scaledPosition);
  vec2 localCoord = fract(scaledPosition);
  vec2 jitter = hash2(tileId) * 0.12 - 0.06;
  localCoord -= jitter;
  return vec4(localCoord, tileId);
}

vec3 tileNormal(vec2 tileId) {
  float h1 = hash(tileId * 1.731 + 17.3);
  float h2 = hash(tileId * 2.419 + 31.7);
  float tiltX = (h1 - 0.5) * 0.35;
  float tiltY = (h2 - 0.5) * 0.35;
  return normalize(vec3(tiltX, tiltY, 1.0));
}

float groutMask(vec2 localCoord) {
  vec2 edge = smoothstep(vec2(0.0), vec2(uGroutWidth), localCoord)
    * smoothstep(vec2(0.0), vec2(uGroutWidth), vec2(1.0) - localCoord);
  return edge.x * edge.y;
}

float tileRoughness(vec2 localCoord, vec2 tileId) {
  float n1 = noise(localCoord * 8.0 + tileId * 3.7);
  float n2 = noise(localCoord * 16.0 + tileId * 7.1 + 50.0);
  return n1 * 0.6 + n2 * 0.4;
}

vec2 waveFlip(vec2 tileCenter, float rawTime) {
  float sweepDuration = max(uWaveSpeed, 0.0001);
  float cycleDuration = sweepDuration + max(uWaveDelay, 0.0);
  float cycleTime = mod(rawTime, cycleDuration);
  float waveCount = floor(rawTime / cycleDuration);
  float isOddWave = mod(waveCount, 2.0);

  float sweepRaw = clamp(cycleTime / sweepDuration, 0.0, 1.0);
  float sweep = sweepRaw * sweepRaw * (3.0 - 2.0 * sweepRaw);

  float direction = floor(uWaveDirection + 0.5);
  float tilePosition = tileCenter.x;

  if (direction == 1.0) {
    tilePosition = 1.0 - tileCenter.x;
  }
  else if (direction == 2.0) {
    tilePosition = 1.0 - tileCenter.y;
  }
  else if (direction == 3.0) {
    tilePosition = tileCenter.y;
  }

  float waveFront = sweep * 1.6 - 0.3;
  float tileRand = hash(tileCenter * 31.7 + vec2(17.3, 59.1));
  float stagger = tileRand * 0.06;
  float distanceToFront = tilePosition - waveFront + stagger;

  float flipProgress = smoothstep(0.5, -0.3, distanceToFront);
  float flipAngle = (isOddWave + flipProgress) * GM_PI;
  float transition = smoothstep(0.6, 0.0, abs(distanceToFront + 0.1));

  return vec2(flipAngle, transition);
}

vec3 rotateFlippedNormal(vec3 normalDirection, float flipAngle, bool flipVertical) {
  float cosFlip = cos(flipAngle);
  float sinFlip = sin(flipAngle);
  vec3 flippedNormal;

  if (flipVertical) {
    flippedNormal = vec3(
      normalDirection.x,
      normalDirection.y * cosFlip + normalDirection.z * sinFlip,
      -normalDirection.y * sinFlip + normalDirection.z * cosFlip
    );
  }
  else {
    flippedNormal = vec3(
      normalDirection.x * cosFlip + normalDirection.z * sinFlip,
      normalDirection.y,
      -normalDirection.x * sinFlip + normalDirection.z * cosFlip
    );
  }

  return normalize(flippedNormal);
}

vec3 viewSpaceNormalToPlane(vec3 localNormal) {
  return normalize(
    vViewTangent * localNormal.x
    + vViewBitangent * localNormal.y
    + vViewNormal * localNormal.z
  );
}

void main() {
  vec2 uv = vUv;
  vec2 planeUv = uv;
  float elapsed = uTime * uLightSpeed;

  // Sample the grid in aspect-corrected space so each tile stays square
  // when the panel becomes rectangular.
  float minPanelSize = max(min(uPanelLength, uPanelWidth), 0.0001);
  vec2 panelScale = vec2(uPanelLength, uPanelWidth) / minPanelSize;
  vec2 gridUv = planeUv * panelScale;

  float scale = max(uTileDensity, 1.0);
  vec4 tile = tileGrid(gridUv, scale);
  vec2 localCoord = tile.xy;
  vec2 tileId = tile.zw;

  float tileMask = groutMask(localCoord);

  float tileHash = hash(tileId);
  float tileHash2 = hash(tileId + 200.0);
  float tileHash3 = hash(tileId + 400.0);
  vec3 tileBaseNormal = tileNormal(tileId);

  float roughness = tileRoughness(localCoord, tileId);
  tileBaseNormal = normalize(tileBaseNormal + vec3(
    (roughness - 0.5) * 0.12,
    (noise(localCoord * 12.0 + tileId * 5.3) - 0.5) * 0.12,
    0.0
  ));

  vec2 tileCenter = (tileId + 0.5) / scale;
  vec2 normalizedTileCenter = tileCenter / max(panelScale, vec2(0.0001));
  vec2 flipData = waveFlip(normalizedTileCenter, uTime);
  float flipAngle = flipData.x * uAnimationMode;
  float transition = flipData.y * uAnimationMode;

  float cosFlip = cos(flipAngle);
  float absCos = abs(cosFlip);
  float direction = floor(uWaveDirection + 0.5);
  bool flipVertical = (direction == 2.0 || direction == 3.0);

  vec2 projectedCoord = localCoord;
  if (flipVertical) {
    projectedCoord.y = (projectedCoord.y - 0.5) / max(absCos, 0.04) + 0.5;
  }
  else {
    projectedCoord.x = (projectedCoord.x - 0.5) / max(absCos, 0.04) + 0.5;
  }

  float inBounds = step(0.0, projectedCoord.x)
    * step(projectedCoord.x, 1.0)
    * step(0.0, projectedCoord.y)
    * step(projectedCoord.y, 1.0);
  tileMask *= inBounds;

  float isBack = step(cosFlip, 0.0);
  vec3 rotatedNormal = rotateFlippedNormal(tileBaseNormal, flipAngle, flipVertical);
  vec3 localNormal = normalize(mix(tileBaseNormal, rotatedNormal, uAnimationMode));

  if (isBack > 0.5) {
    vec3 backNormal = tileNormal(tileId + 500.0);
    float backRoughness = tileRoughness(projectedCoord, tileId + 500.0);
    backNormal = normalize(backNormal + vec3(
      (backRoughness - 0.5) * 0.15,
      (noise(projectedCoord * 14.0 + tileId * 3.7) - 0.5) * 0.15,
      0.0
    ));
    localNormal = backNormal;
    roughness = backRoughness;
  }

  vec3 normalDirection = viewSpaceNormalToPlane(localNormal);
  vec3 tileWorldPosition = vec3(planeUv, 0.0);
  vec3 viewDirection = normalize(vec3(0.5, 0.5, 1.5) - tileWorldPosition);

  vec3 light1Position = vec3(
    0.5 + sin(elapsed * 0.7) * 0.4,
    0.5 + cos(elapsed * 0.53) * 0.4,
    0.8 + sin(elapsed * 0.31) * 0.15
  );
  vec3 light2Position = vec3(
    0.5 + cos(elapsed * 0.43 + 2.0) * 0.35,
    0.5 + sin(elapsed * 0.37 + 1.5) * 0.35,
    0.7 + cos(elapsed * 0.29) * 0.1
  );
  vec3 light3Position = vec3(
    0.5 + sin(elapsed * 0.19 + 4.0) * 0.25,
    0.5 + cos(elapsed * 0.23 + 3.0) * 0.25,
    1.2
  );

  vec3 lightDir1 = normalize(light1Position - tileWorldPosition);
  vec3 halfDir1 = normalize(lightDir1 + viewDirection);
  float spec1 = pow(max(dot(normalDirection, halfDir1), 0.0), 80.0 + tileHash * 60.0);
  float diff1 = max(dot(normalDirection, lightDir1), 0.0);

  vec3 lightDir2 = normalize(light2Position - tileWorldPosition);
  vec3 halfDir2 = normalize(lightDir2 + viewDirection);
  float spec2 = pow(max(dot(normalDirection, halfDir2), 0.0), 60.0 + tileHash2 * 80.0);
  float diff2 = max(dot(normalDirection, lightDir2), 0.0);

  vec3 lightDir3 = normalize(light3Position - tileWorldPosition);
  vec3 halfDir3 = normalize(lightDir3 + viewDirection);
  float spec3 = pow(max(dot(normalDirection, halfDir3), 0.0), 30.0 + tileHash3 * 20.0);
  float diff3 = max(dot(normalDirection, lightDir3), 0.0);

  float specTotal = (spec1 * 1.2 + spec2 * 0.9 + spec3 * 0.4) * uSparkleIntensity;
  float diffTotal = diff1 * 0.5 + diff2 * 0.35 + diff3 * 0.25;

  float breathe = 1.0 + sin(elapsed * 0.6) * 0.08 + sin(elapsed * 0.37 + 1.0) * 0.05;
  specTotal *= breathe;
  diffTotal *= breathe;

  float shimmerPhase = tileHash * GM_TAU + elapsed * (0.8 + tileHash2 * 1.5);
  float shimmer = pow(max(sin(shimmerPhase), 0.0), 16.0);
  float shimmerPhase2 = tileHash3 * GM_TAU + elapsed * (0.5 + tileHash * 0.7) + 2.0;
  float shimmer2 = pow(max(sin(shimmerPhase2), 0.0), 24.0);
  float shimmerBlend = mix(1.0, 0.45, uAnimationMode);
  float shimmerTotal = (shimmer * 0.6 + shimmer2 * 0.4) * shimmerBlend * uSparkleIntensity;

  vec3 darkGold = uBaseColor * 0.26;
  vec3 midGold = mix(uBaseColor, uSheenColor, 0.45);
  vec3 brightGold = mix(uSheenColor, uHighlightColor, 0.55);
  vec3 flashGold = mix(uHighlightColor, vec3(1.0), 0.35);
  vec3 hotGold = mix(uHighlightColor, vec3(1.0), 0.75);

  float baseVariation = tileHash;
  vec3 tileBaseColor = mix(darkGold, midGold, smoothstep(0.0, 0.5, baseVariation));
  tileBaseColor = mix(tileBaseColor, brightGold, smoothstep(0.5, 0.85, baseVariation));
  tileBaseColor *= 0.9 + tileHash2 * 0.2;

  vec3 tileColor = tileBaseColor;
  tileColor += tileBaseColor * diffTotal * 0.6;

  vec3 specColor = mix(brightGold, flashGold, smoothstep(0.0, 0.5, specTotal));
  specColor = mix(specColor, hotGold, smoothstep(0.5, 1.0, specTotal));
  tileColor += specColor * specTotal * 1.4;

  vec3 shimmerColor = mix(flashGold, hotGold, shimmerTotal);
  tileColor += shimmerColor * shimmerTotal * 0.7;

  float flipShade = mix(1.0, absCos * 0.7 + 0.3, transition);
  tileColor *= flipShade;
  tileColor = mix(tileColor, tileColor * vec3(1.2, 1.05, 0.85), isBack * 0.6);

  float edgeOnGlow = pow(1.0 - absCos, 4.0) * transition;
  tileColor += midGold * edgeOnGlow * 0.25 * uAnimationMode;

  float microSpec = pow(roughness, 4.0) * specTotal * 3.0;
  tileColor += flashGold * microSpec * 0.3;

  float edgeDist = min(
    min(projectedCoord.x, 1.0 - projectedCoord.x),
    min(projectedCoord.y, 1.0 - projectedCoord.y)
  );
  float edgeHighlight = smoothstep(0.15, 0.05, edgeDist);
  tileColor += brightGold * edgeHighlight * (diffTotal + specTotal * 0.5) * 0.15;

  vec3 color = mix(uGroutColor, tileColor, tileMask);

  float groutDepth = 1.0 - tileMask;
  color -= uGroutColor * 0.15 * groutDepth * (1.0 - smoothstep(0.0, 0.03, edgeDist));

  float glow1 = smoothstep(0.7, 0.0, length(planeUv - light1Position.xy));
  float glow2 = smoothstep(0.6, 0.0, length(planeUv - light2Position.xy));
  color += midGold * glow1 * 0.06;
  color += midGold * glow2 * 0.04;

  vec2 vignetteUv = uv * 2.0 - 1.0;
  float vignette = 1.0 - dot(vignetteUv, vignetteUv) * 0.35;
  vignette = max(vignette, 0.0);
  vignette = smoothstep(0.0, 1.0, vignette);
  color *= 0.5 + vignette * 0.5;

  color = color * (2.51 * color + 0.03) / (color * (2.43 * color + 0.59) + 0.14);
  color = pow(color, vec3(0.95, 1.0, 1.1));

  float alpha = mix(0.84, 1.0, tileMask) * uOpacity;

  if (alpha < 0.02) {
    discard;
  }

  csm_DiffuseColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
