#include <common>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

uniform float uTime;
uniform float uIntensity;
uniform float uHeight;
uniform float uInflate;
uniform float uTongueScale;
uniform float uTongueSpeed;
uniform float uTongueVariation;
uniform mat4 uMeshToRoot;
uniform mat4 uRootToView;
uniform mat3 uMeshNormalToRoot;
uniform mat3 uRootNormalToView;
varying vec3 vFirePosition;
varying vec3 vFireNormal;
varying vec3 vViewPosition;
varying vec3 vViewNormal;
varying float vMask;

void main() {
  #include <morphinstance_vertex>
  #include <beginnormal_vertex>
  #include <morphnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <begin_vertex>
  #include <morphtarget_vertex>
  #include <skinning_vertex>

  #ifdef USE_INSTANCING
    mat3 instanceNormal = mat3(instanceMatrix);
    objectNormal /= max(vec3(dot(instanceNormal[0], instanceNormal[0]),
      dot(instanceNormal[1], instanceNormal[1]), dot(instanceNormal[2], instanceNormal[2])), vec3(0.000001));
    objectNormal = instanceNormal * objectNormal;
    transformed = (instanceMatrix * vec4(transformed, 1.0)).xyz;
  #endif

  vec3 firePosition = (uMeshToRoot * vec4(transformed, 1.0)).xyz;
  vec3 fireNormal = normalize(uMeshNormalToRoot * objectNormal);
  float mask = clamp(fireNormal.y, 0.0, 1.0);
  float noise = fireNoise(vec3(firePosition.xz * uTongueScale, uTime * uTongueSpeed));
  float tongue = mix(1.0, noise * 0.5 + 0.5, uTongueVariation);
  firePosition += fireNormal * uInflate;
  firePosition.y += mask * uHeight * tongue * uIntensity;

  vFirePosition = firePosition;
  vFireNormal = fireNormal;
  vMask = mask;
  vec4 mvPosition = uRootToView * vec4(firePosition, 1.0);
  vViewPosition = -mvPosition.xyz;
  vViewNormal = normalize(uRootNormalToView * fireNormal);
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
}
