vec3 isoNormal = normalize(normal);
float isoFacing = abs(dot(isoNormal, normalize(vViewPosition)));
float isoRim = pow(1.0 - clamp(isoFacing, 0.0, 1.0), 2.6);
float isoKey = dot(isoNormal, normalize(vec3(-0.45, 0.7, 0.65))) * 0.5 + 0.5;

if (isoStyleMode < 0.5) {
  // A restrained face fill survives scenes without an environment map.
  vec3 isoFill = diffuseColor.rgb * (0.62 + isoKey * 0.55);
  outgoingLight = mix(isoFill, outgoingLight, 0.55);
  outgoingLight += isoEdgeColor * isoRim * 0.15;
  outgoingLight += isoGlowColor * isoGlowIntensity * isoRim * 0.06;
} else if (isoStyleMode < 1.5) {
  // Screen-space pen hatching on the model, never a scene/grid overlay.
  float isoPeriod = (gl_FragCoord.x + gl_FragCoord.y) / 9.0;
  float isoDistance = abs(fract(isoPeriod) - 0.5) * 9.0;
  float isoHatch = 1.0 - smoothstep(0.35, 1.15, isoDistance);
  outgoingLight = diffuseColor.rgb * 0.4;
  outgoingLight += isoEdgeColor * (0.035 + isoHatch * (0.12 + 0.28 * (1.0 - isoKey)));
  outgoingLight += totalEmissiveRadiance * 0.15;
} else {
  // Thin transparent shells, rather than full-opacity additive surfaces.
  diffuseColor.a *= 0.025 + isoRim * 0.4;
  outgoingLight = diffuseColor.rgb * 0.45 + isoEdgeColor * 0.6;
  outgoingLight += isoGlowColor * isoGlowIntensity * 0.2;
  outgoingLight *= 0.35 + isoRim * 1.5;
}
