precision mediump float;

uniform vec3 uDropletColor;
uniform float uDropletGlow;
uniform float uDropletRoughness;
uniform sampler2D uWaterMap;

varying vec2 vUv;

void main() {
  vec4 water = texture2D(uWaterMap, vUv);
  float dropletMask = smoothstep(0.02, 0.18, water.a);
  float dropletDepth = smoothstep(0.02, 0.95, water.b);
  float curvature = length((water.rg - 0.5) * 2.0);
  float highlight = smoothstep(0.18, 0.95, curvature) * dropletMask;
  float dropletField = dropletMask * (0.35 + dropletDepth * 0.65);

  csm_Roughness = mix(csm_Roughness, uDropletRoughness, dropletField);
  csm_Emissive += uDropletColor * (dropletDepth * 0.12 + highlight * 0.18) * uDropletGlow;
  csm_DiffuseColor.rgb = mix(
    csm_DiffuseColor.rgb,
    mix(csm_DiffuseColor.rgb, uDropletColor, 0.08),
    dropletField
  );
}
