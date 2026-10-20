if (vProjectorPosition.w <= 0.0) discard;
vec3 projectorNDC = vProjectorPosition.xyz / vProjectorPosition.w;
if (projectorNDC.z < (projectorReversedDepth ? 0.0 : -1.0) || projectorNDC.z > 1.0) discard;
vec2 projectorUV = projectorNDC.xy * 0.5 + 0.5;
if (any(lessThan(projectorUV, vec2(0.0))) || any(greaterThan(projectorUV, vec2(1.0)))) discard;

if (projectorOcclusion) {
  // RGBADepthPacking stores perspective depth even with logarithmicDepthBuffer.
  float surfaceDepth = unpackRGBAToDepth(texture2D(projectorDepthMap, projectorUV));
  float projectedDepth = projectorReversedDepth ? projectorNDC.z : projectorNDC.z * 0.5 + 0.5;
  if (projectorReversedDepth) {
    if (projectedDepth < surfaceDepth - projectorDepthBias) discard;
  } else {
    if (projectedDepth > surfaceDepth + projectorDepthBias) discard;
  }
}

vec2 videoUV = (projectorUVMatrix * vec3(projectorUV, 1.0)).xy;
if (any(lessThan(videoUV, vec2(0.0))) || any(greaterThan(videoUV, vec2(1.0)))) discard;
vec2 edgeDistance = min(videoUV, vec2(1.0) - videoUV);
float feather = projectorEdgeFeather > 0.0
  ? smoothstep(0.0, projectorEdgeFeather, min(edgeDistance.x, edgeDistance.y))
  : 1.0;

// VideoTexture's custom sampler needs the same explicit sRGB decode as map_fragment.
vec4 projectedVideo = sRGBTransferEOTF(texture2D(projectorMap, videoUV));
float projectedAlpha = projectedVideo.a * diffuseColor.a * projectorOpacity * feather;
if (projectedAlpha < 0.001) discard;
gl_FragColor = vec4(projectedVideo.rgb * projectorTint * projectorIntensity, projectedAlpha);
