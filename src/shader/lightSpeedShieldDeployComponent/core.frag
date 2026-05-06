uniform float uTime;
uniform float uProgress;
uniform vec3 uCoreColor;
uniform vec3 uHotColor;
uniform float uCoreIntensity;
uniform float uNoiseScale;
uniform float uNoiseSpeed;

varying vec3 vCoreNormal;
varying vec3 vCoreObjPos;
varying vec3 vCoreViewDir;

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
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec3 normal = normalize(vCoreNormal);
  vec3 viewDir = normalize(vCoreViewDir);
  float viewFacing = clamp(dot(normal, viewDir), 0.0, 1.0);
  float fresnel = pow(1.0 - viewFacing, 2.4);
  float body = pow(viewFacing, 1.35);

  vec2 uv = vCoreObjPos.xy * uNoiseScale;
  float cloud = fbm(uv + vec2(uTime * uNoiseSpeed, -uTime * uNoiseSpeed * 0.7));
  float innerPulse = 0.78 + 0.22 * sin(uTime * 7.5 + cloud * 4.0);
  float progress = smoothstep(0.0, 1.0, uProgress);
  float brightness = (body * 0.92 + fresnel * 0.55 + cloud * 0.32) * uCoreIntensity * progress * innerPulse;
  vec3 color = mix(uCoreColor, uHotColor, smoothstep(0.45, 1.0, body + cloud * 0.32));

  csm_DiffuseColor = vec4(color * brightness, clamp(brightness * 0.62, 0.0, 1.0));
}
