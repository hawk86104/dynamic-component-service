uniform float uTime;
uniform float uProgress;
uniform vec3 uColor;
uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform float uFlowIntensity;
uniform float uWarpStrength;

varying vec3 vOrbNormal;
varying vec3 vOrbObjPos;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  float fresnel = 1.0 - abs(dot(normalize(vOrbNormal), vec3(0.0, 0.0, 1.0)));
  vec2 uv = vOrbObjPos.xy * uNoiseScale;
  vec2 q = vec2(
    fbm(uv + uTime * uNoiseSpeed),
    fbm(uv + vec2(3.7, 2.1) + uTime * uNoiseSpeed * 0.7)
  );
  vec2 r = vec2(
    fbm(uv + uWarpStrength * q + vec2(1.7, 9.2) + uTime * uNoiseSpeed * 0.5),
    fbm(uv + uWarpStrength * q + vec2(8.3, 2.8) + uTime * uNoiseSpeed * 0.9)
  );
  float flow = fbm(uv + uWarpStrength * r);
  float cloud = smoothstep(0.3, 0.75, flow);
  float mask = smoothstep(0.05, 0.4, fresnel) * smoothstep(1.0, 0.35, fresnel);
  float alpha = cloud * mask * uFlowIntensity * uProgress;
  csm_DiffuseColor = vec4(uColor * alpha, alpha);
}
