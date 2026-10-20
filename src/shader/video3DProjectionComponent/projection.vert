// Runs after Three.js morph, skinning and project_vertex chunks.
vec4 projectorWorldPosition = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  projectorWorldPosition = instanceMatrix * projectorWorldPosition;
#endif
vProjectorPosition = projectorMatrix * modelMatrix * projectorWorldPosition;
