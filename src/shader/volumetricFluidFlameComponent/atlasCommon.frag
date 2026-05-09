uniform float uGrid;
uniform float uSlicesPerRow;
uniform float uAtlas;

vec3 atlasToUvw(vec2 atlasUv) {
  vec2 pixel = atlasUv * uAtlas;
  float col = floor(pixel.x / uGrid);
  float row = floor(pixel.y / uGrid);
  float sliceIndex = row * uSlicesPerRow + col;
  float x = mod(pixel.x, uGrid);
  float y = mod(pixel.y, uGrid);

  return vec3(x / uGrid, y / uGrid, (sliceIndex + 0.5) / uGrid);
}

vec4 sampleVolume(sampler2D tex, vec3 uvw) {
  uvw = clamp(uvw, vec3(0.5 / uGrid), vec3(1.0 - 0.5 / uGrid));

  float slice = uvw.z * (uGrid - 1.0);
  float z0 = floor(slice);
  float z1 = min(z0 + 1.0, uGrid - 1.0);
  float fz = slice - z0;

  float col0 = mod(z0, uSlicesPerRow);
  float row0 = floor(z0 / uSlicesPerRow);
  float col1 = mod(z1, uSlicesPerRow);
  float row1 = floor(z1 / uSlicesPerRow);

  vec2 origin0 = vec2(col0, row0) * uGrid / uAtlas;
  vec2 origin1 = vec2(col1, row1) * uGrid / uAtlas;
  vec2 withinSlice = uvw.xy * (uGrid / uAtlas);

  vec4 s0 = texture2D(tex, origin0 + withinSlice);
  vec4 s1 = texture2D(tex, origin1 + withinSlice);

  return mix(s0, s1, fz);
}
