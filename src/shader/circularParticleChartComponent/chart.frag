precision highp float;

uniform vec3 uParticleColor;

varying float vAlpha;
varying float vBand;
varying float vScan;
varying float vSeed;

void main() {
  vec2 centered = gl_PointCoord - vec2(0.5);
  float dist = length(centered);
  float edge = smoothstep(0.5, 0.12, dist);
  float core = smoothstep(0.22, 0.0, dist);
  float halo = smoothstep(0.5, 0.0, dist) * 0.42;
  float sparkle = 0.74 + 0.26 * sin(vSeed * 43.0 + vScan * 12.0 + vBand * 3.0);

  float alpha = (edge * 0.62 + core * 0.58 + halo * (0.34 + vScan)) * vAlpha * sparkle;
  if (alpha < 0.01) {
    discard;
  }

  vec3 scanColor = mix(uParticleColor, vec3(1.0), 0.58);
  vec3 color = mix(uParticleColor * (0.46 + vBand * 0.1), scanColor * 2.05, clamp(vScan, 0.0, 1.0));
  gl_FragColor = vec4(color, alpha);
}
