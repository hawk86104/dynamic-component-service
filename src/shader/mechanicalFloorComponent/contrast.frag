// Anchor at white: zero removes the texture's dark pattern so tint controls
// the full base color; one preserves the original map, above one deepens it.
sampledDiffuseColor.rgb = clamp(
    mix(vec3(1.0), sampledDiffuseColor.rgb, floorTextureContrast),
    0.0,
    1.0
);
diffuseColor *= sampledDiffuseColor;
