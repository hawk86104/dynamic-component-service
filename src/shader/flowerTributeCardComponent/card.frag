uniform sampler2D uArt;
uniform sampler2D uText;
uniform float uPitchNm;
uniform float uGrooveAngle;
uniform float uGain;
uniform float uRedFilter;
uniform float uStars;
uniform float uCornerRadius;
uniform float uFlowOffset;
varying vec2 vCardUv;
varying vec3 vCardView;
varying vec3 vCardNormal;
varying vec3 vCardTangent;
varying vec3 vCardBitangent;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Intersection with a straight edge of a ten-vertex, five-point star.
float starMask(vec2 p) {
  float sector = 0.62831853;
  float angle = mod(atan(p.x, p.y) + 6.28318531, 6.28318531);
  float index = floor(angle / sector);
  float local = angle - index * sector;
  float r0 = mix(0.235, 0.102, mod(index, 2.0));
  float r1 = mix(0.102, 0.235, mod(index, 2.0));
  float boundary = r0 * r1 * sin(sector)
    / (r1 * sin(sector - local) + r0 * sin(local));
  float aa = max(fwidth(length(p)), 0.002);
  return 1.0 - smoothstep(boundary - aa, boundary + aa, length(p));
}

vec3 spectrum(float wavelength) {
  vec3 delta = (vec3(wavelength) - vec3(625.0, 540.0, 450.0)) / vec3(46.0, 36.0, 32.0);
  return exp(-0.5 * delta * delta);
}

void main() {
  vec2 uv = vCardUv;
  // Measure both axes in card-width units so all four corners stay circular.
  vec2 halfSize = vec2(0.5, 0.5 * 1672.0 / 941.0);
  vec2 corner = abs((uv - 0.5) * vec2(1.0, 1672.0 / 941.0)) - halfSize + uCornerRadius;
  float edge = length(max(corner, 0.0)) + min(max(corner.x, corner.y), 0.0) - uCornerRadius;
  if (edge > 0.0) discard;
  // Same UV on both faces intentionally produces mirrored artwork on the back.
  vec3 art = texture2D(uArt, uv).rgb;
  vec4 lettering = texture2D(uText, uv);
  vec3 eye = normalize(vCardView);
  vec3 normal = normalize(vCardNormal) * (gl_FrontFacing ? 1.0 : -1.0);
  vec2 viewSlope = vec2(dot(eye, normalize(vCardTangent)), dot(eye, normalize(vCardBitangent)));
  vec2 direction = vec2(cos(uGrooveAngle), sin(uGrooveAngle));
  vec2 grid = uv * vec2(7.0, 7.0 * 1672.0 / 941.0) - vec2(0.38, 0.72) * uFlowOffset;
  vec2 cell = floor(grid);
  float star = 0.0;
  // Neighbour cells allow strongly jittered stars to cross cell boundaries intact.
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 id = cell + vec2(float(x), float(y));
      vec2 center = id + 0.5 + (vec2(hash21(id + 1.7), hash21(id + 8.1)) - 0.5) * 0.94;
      vec2 p = grid - center;
      float angle = hash21(id + 17.4) * 6.28318531;
      p = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * p;
      p /= mix(0.48, 1.45, hash21(id + 23.8));
      float flash = pow(0.5 + 0.5 * sin(dot(viewSlope, vec2(9.0, 6.0)) + hash21(id + 31.2) * 6.28318531 + uFlowOffset * 1.4), 5.0);
      star += starMask(p) * step(0.42, hash21(id + 2.7)) * (0.22 + flash * 0.9);
    }
  }
  star = min(star, 1.2) * uStars;
  float diagonal = dot(uv, vec2(0.86, -1.28)) * 5.0;
  float stripe = 1.0 - smoothstep(0.025, 0.055, abs(fract(diagonal) - 0.5));
  float across = abs(dot(viewSlope, direction) + 0.48 + dot(uv - 0.5, direction) * 0.28);
  vec3 diffraction = vec3(0.0);
  for (int order = 1; order <= 3; order++) {
    float wavelength = uPitchNm * across / float(order);
    diffraction += spectrum(wavelength) / float(order * order);
  }
  // Red / rose / warm gold filter keeps the foil in the memorial palette.
  vec3 warm = vec3(dot(diffraction, vec3(0.8, 0.55, 0.45)), diffraction.g * 0.24, diffraction.b * 0.32);
  diffraction = mix(diffraction, warm, uRedFilter);
  float facing = abs(dot(normal, eye));
  float laminate = pow(1.0 - facing, 4.0) * 0.08;
  // Reduce foil over pale lettering and statues, and over the dedication area.
  float inkProtection = 1.0 - smoothstep(0.35, 0.85, max(art.r, max(art.g, art.b)));
  float writingProtection = mix(0.16, 1.0, smoothstep(0.15, 0.22, uv.y));
  vec3 foil = diffraction * (0.07 + stripe * 0.48 + star);
  foil += vec3(1.0, 0.25, 0.16) * laminate;
  vec3 color = art + foil * uGain * mix(0.25, 1.0, inkProtection) * writingProtection;
  color = mix(color, vec3(1.0), lettering.a);
  csm_DiffuseColor = vec4(color, 1.0);
}
