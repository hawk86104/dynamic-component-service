float ecHash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.13, 0.37, 0.73));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float ecNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(ecHash(i), ecHash(i + vec3(1, 0, 0)), f.x),
        mix(ecHash(i + vec3(0, 1, 0)), ecHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(ecHash(i + vec3(0, 0, 1)), ecHash(i + vec3(1, 0, 1)), f.x),
        mix(ecHash(i + vec3(0, 1, 1)), ecHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}

float ecFbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * ecNoise(p);
    p = p * 2.03 + vec3(3.1, 1.7, 5.2);
    amplitude *= 0.5;
  }
  return value;
}

vec3 ecCapsulePoint(float phase, vec2 size) {
  float radius = size.x * 0.5;
  float straight = max(0.0, (size.y - size.x) * 0.5);
  float arc = 3.14159265 * radius;
  float side = straight * 2.0;
  float d = fract(phase) * (arc * 2.0 + side * 2.0);
  if (d < arc) {
    float a = d / radius;
    return vec3(cos(a) * radius, straight + sin(a) * radius, 0.0);
  }
  d -= arc;
  if (d < side) { return vec3(-radius, straight - d, 0.0); }
  d -= side;
  if (d < arc) {
    float a = 3.14159265 + d / radius;
    return vec3(cos(a) * radius, -straight + sin(a) * radius, 0.0);
  }
  return vec3(radius, -straight + d - arc, 0.0);
}

vec3 ecCapsuleNormal(vec3 p, vec2 size) {
  float straight = max(0.0, (size.y - size.x) * 0.5);
  return normalize(vec3(p.x, p.y - clamp(p.y, -straight, straight), 0.0));
}
