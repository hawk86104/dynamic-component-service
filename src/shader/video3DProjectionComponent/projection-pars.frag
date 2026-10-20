#include <packing>
uniform sampler2D projectorMap;
uniform sampler2D projectorDepthMap;
uniform vec3 projectorTint;
uniform float projectorIntensity;
uniform float projectorOpacity;
uniform float projectorDepthBias;
uniform float projectorEdgeFeather;
uniform bool projectorOcclusion;
uniform bool projectorReversedDepth;
uniform mat3 projectorUVMatrix;
varying vec4 vProjectorPosition;
