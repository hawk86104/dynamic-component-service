precision highp float;

varying vec3 vLocalPos;

uniform sampler2D uFluid;
uniform vec3 uCameraPos;
uniform mat4 uInvModelMatrix;
uniform float uBrightness;
uniform float uAbsorption;
uniform int uColorMode;
uniform int uRayMarchSteps;
uniform float uFlameWidth;
uniform float uFlameHeight;
uniform float uFlameScaleX;
uniform float uFlameScaleY;
uniform float uFlameScaleZ;

#include <atlas_common>

vec2 intersectBox(vec3 ro, vec3 rd) {
  vec3 invRd = 1.0 / rd;
  vec3 t0 = (-0.5 - ro) * invRd;
  vec3 t1 = (0.5 - ro) * invRd;
  vec3 tmin = min(t0, t1);
  vec3 tmax = max(t0, t1);
  float tNear = max(max(tmin.x, tmin.y), tmin.z);
  float tFar = min(min(tmax.x, tmax.y), tmax.z);

  return vec2(tNear, tFar);
}

vec3 fireColor(float density) {
  float t = clamp(density, 0.0, 1.0);
  vec3 c1;
  vec3 c2;
  vec3 c3;
  vec3 c4;
  vec3 c5;

  if (uColorMode == 1) {
    c1 = vec3(0.0, 0.0, 0.03);
    c2 = vec3(0.05, 0.05, 0.6);
    c3 = vec3(0.1, 0.3, 1.0);
    c4 = vec3(0.4, 0.7, 1.0);
    c5 = vec3(0.8, 0.95, 1.0);
  }
  else if (uColorMode == 2) {
    c1 = vec3(0.0, 0.02, 0.0);
    c2 = vec3(0.0, 0.4, 0.05);
    c3 = vec3(0.1, 0.8, 0.1);
    c4 = vec3(0.5, 1.0, 0.2);
    c5 = vec3(0.85, 1.0, 0.7);
  }
  else if (uColorMode == 3) {
    c1 = vec3(0.03, 0.03, 0.04);
    c2 = vec3(0.15, 0.15, 0.18);
    c3 = vec3(0.4, 0.4, 0.45);
    c4 = vec3(0.7, 0.7, 0.75);
    c5 = vec3(0.95, 0.95, 1.0);
  }
  else if (uColorMode == 4) {
    c1 = vec3(0.02, 0.0, 0.03);
    c2 = vec3(0.4, 0.0, 0.5);
    c3 = vec3(0.8, 0.1, 0.6);
    c4 = vec3(1.0, 0.4, 0.5);
    c5 = vec3(1.0, 0.85, 0.7);
  }
  else {
    c1 = vec3(0.02, 0.0, 0.0);
    c2 = vec3(0.6, 0.05, 0.0);
    c3 = vec3(1.0, 0.35, 0.02);
    c4 = vec3(1.0, 0.65, 0.15);
    c5 = vec3(1.0, 0.95, 0.6);
  }

  if (t < 0.2) {
    return mix(c1, c2, t / 0.2);
  }
  if (t < 0.45) {
    return mix(c2, c3, (t - 0.2) / 0.25);
  }
  if (t < 0.7) {
    return mix(c3, c4, (t - 0.45) / 0.25);
  }

  return mix(c4, c5, (t - 0.7) / 0.3);
}

vec3 smokeBaseColor() {
  if (uColorMode == 1) {
    return vec3(0.15, 0.2, 0.35);
  }
  if (uColorMode == 2) {
    return vec3(0.1, 0.3, 0.12);
  }
  if (uColorMode == 3) {
    return vec3(0.3, 0.3, 0.32);
  }
  if (uColorMode == 4) {
    return vec3(0.25, 0.15, 0.3);
  }

  return vec3(0.35, 0.3, 0.25);
}

vec3 innerSmokeColor() {
  if (uColorMode == 1) {
    return vec3(0.02, 0.05, 0.15);
  }
  if (uColorMode == 2) {
    return vec3(0.02, 0.12, 0.02);
  }
  if (uColorMode == 3) {
    return vec3(0.08, 0.08, 0.1);
  }
  if (uColorMode == 4) {
    return vec3(0.1, 0.02, 0.12);
  }

  return vec3(0.15, 0.05, 0.01);
}

vec3 glowColorForMode() {
  if (uColorMode == 1) {
    return vec3(0.1, 0.3, 0.8);
  }
  if (uColorMode == 2) {
    return vec3(0.1, 0.7, 0.15);
  }
  if (uColorMode == 3) {
    return vec3(0.5, 0.5, 0.55);
  }
  if (uColorMode == 4) {
    return vec3(0.6, 0.1, 0.5);
  }

  return vec3(0.7, 0.25, 0.05);
}

void main() {
  vec3 localCameraPos = (uInvModelMatrix * vec4(uCameraPos, 1.0)).xyz;
  vec3 rayDir = normalize(vLocalPos - localCameraPos);
  vec2 tHit = intersectBox(localCameraPos, rayDir);

  if (tHit.x > tHit.y) {
    discard;
  }

  tHit.x = max(tHit.x, 0.0);

  const int MAX_STEPS = 128;
  float marchLength = tHit.y - tHit.x;
  float activeSteps = max(float(uRayMarchSteps), 1.0);
  float stepSize = marchLength / activeSteps;
  vec3 accumulated = vec3(0.0);
  float transmittance = 1.0;
  vec3 pos = localCameraPos + rayDir * tHit.x;
  vec3 stepVec = rayDir * stepSize;
  vec3 lightDir1 = normalize(vec3(0.3, 1.0, 0.2));
  vec3 lightDir2 = normalize(vec3(-0.4, 0.8, -0.3));

  for (int i = 0; i < MAX_STEPS; i++) {
    if (i >= uRayMarchSteps) {
      break;
    }

    vec3 uvw = pos + 0.5;

    if (
      uvw.x >= 0.0 && uvw.x <= 1.0
      && uvw.y >= 0.0 && uvw.y <= 1.0
      && uvw.z >= 0.0 && uvw.z <= 1.0
    ) {
      vec2 radialVec = uvw.xz - vec2(0.5);
      vec2 scaledRadialVec = radialVec / vec2(uFlameScaleX, uFlameScaleZ);
      float radialDist = length(scaledRadialVec);
      float cylMaskInner = 0.22 + uFlameWidth * 0.15;
      float cylMaskOuter = cylMaskInner + 0.2;
      float cylMask = 1.0 - smoothstep(cylMaskInner, cylMaskOuter, radialDist);
      vec4 fluid = sampleVolume(uFluid, uvw);
      float density = fluid.w * cylMask;

      if (density > 0.008) {
        float height = 0.5 + (uvw.y - 0.5) / uFlameScaleY;
        float tempFalloff = 0.9 - uFlameHeight * 0.3;
        float temperature = density * max(1.0 - height * tempFalloff, 0.0);
        float radialTemp = 1.0 - smoothstep(0.0, 0.25, radialDist);

        temperature *= 0.6 + 0.4 * radialTemp;

        vec3 emitColor = fireColor(temperature * 0.5) * uBrightness;
        float lightDensity1 = 0.0;
        float lightDensity2 = 0.0;

        for (int lightSample = 1; lightSample <= 3; lightSample++) {
          float lightStep = float(lightSample) * 0.04;
          vec3 lp1 = uvw + lightDir1 * lightStep;
          vec3 lp2 = uvw + lightDir2 * lightStep;

          if (all(greaterThanEqual(lp1, vec3(0.0))) && all(lessThanEqual(lp1, vec3(1.0)))) {
            lightDensity1 += sampleVolume(uFluid, lp1).w;
          }

          if (all(greaterThanEqual(lp2, vec3(0.0))) && all(lessThanEqual(lp2, vec3(1.0)))) {
            lightDensity2 += sampleVolume(uFluid, lp2).w;
          }
        }

        float lightAtten1 = exp(-lightDensity1 * 0.8);
        float lightAtten2 = exp(-lightDensity2 * 0.6);
        float lightAtten = lightAtten1 * 0.65 + lightAtten2 * 0.35;
        vec3 smokeColor = smokeBaseColor() * lightAtten * 0.4;

        smokeColor += innerSmokeColor() * radialTemp * lightAtten;

        float fireFactor = clamp(temperature * 1.8 - height * 1.5, 0.0, 1.0);
        vec3 color = mix(smokeColor, emitColor, fireFactor);

        color *= 0.5 + 0.5 * lightAtten;

        float absorption = density * stepSize * uAbsorption;
        float alpha = 1.0 - exp(-absorption);

        accumulated += color * alpha * transmittance;
        transmittance *= 1.0 - alpha;

        if (transmittance < 0.01) {
          break;
        }
      }
    }

    pos += stepVec;
  }

  accumulated += glowColorForMode() * ((1.0 - transmittance) * 0.015);
  accumulated = accumulated / (accumulated + vec3(0.9));
  accumulated = pow(accumulated, vec3(1.05));

  csm_DiffuseColor = vec4(accumulated, 1.0 - transmittance);
}
