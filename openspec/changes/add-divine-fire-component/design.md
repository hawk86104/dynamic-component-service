## Context

The supplied `DivineFireView.vue` delegates to `src/components/demos/d-g/divine-fire/`. That implementation welds source geometry, attaches additive overlay meshes, stretches upward-facing vertices, and erodes those sheets with procedural noise. Its experience also owns four subjects, lights, a ground plane, a pane, and Bloom. Only the subject-bound effect belongs in this service component.

## Goals / Non-Goals

**Goals:** A burning cube by default; replacement with an online GLB/glTF; reactive effect controls; correct hierarchy, skinning, and morph handling; safe concurrent loading and cleanup; registration through the existing catalog and federation map.

**Non-Goals:** Owning external scene state, adding scene/post-processing controls, replacing the generic previews, changing external editor code, or recording an unrequested runtime preview.

## Decisions

- Use one component-owned root and subject. An empty URL creates a subdivided cube. Loaded models retain their original materials and hierarchy, fit to a configurable longest dimension, and stand on local Y=0. Wrapper groups perform fitting without overwriting animated node transforms.
- Overlay each source mesh with an identity child. Weld static/skinned positions and skin attributes after discarding UVs and hard-edge normals; preserve morph geometry instead of merging vertices with potentially different morph displacements. Support GLTF instanced meshes and share their instance transforms.
- Keep flame calculations in component coordinates. CPU-computed mesh-to-root, normal, and root-to-view matrices avoid feeding large GIS world coordinates into noise or vertex deformation. The parent transform controls the flame direction and size.
- Externalize vertex, fragment, and shared noise sources under the component's shader directory. Include skinning, morphing, instancing, logarithmic depth, and clipping support. Additive blending retains depth testing and disables depth writing; no Bloom is required.
- Share defaults between the Vue props and registry. Keep source visibility as a model-owned control, and remove reference scene wireframe/debug, lights, animation-scene toggle, and Bloom controls. A local playback switch controls fire motion and the first embedded model animation.
- Use abortable, debounced per-instance HTTP loading with the project's existing Draco assets and Meshopt decoder. Track request identity, discard late results, and retain the previous subject on errors. Emit loading/loaded/loadError events for the host.
- Dispose overlays before source geometry/material/texture/skeleton resources. Each request owns its Draco decoder, so disposing an instance cannot disrupt another instance.

## Risks / Trade-offs

- Surface geometry resolution limits flame detail → subdivide the default cube; document that external model topology controls detail and is not automatically subdivided.
- Cross-origin model dependencies can fail → report errors through events, retain the visible subject, and document HTTPS/CORS and supported GLB/glTF resources.
- Additive shells cannot reproduce the reference scene's Bloom halo or physical volumetric fire → document the scope and leave post-processing to the host.
- Morph seam welding could change deformations → preserve morph vertices and attributes, accepting original mesh seams.
- Runtime validation is not authorized → run targeted lint and review the source/diff; explicitly record unverified rendering and model loading.

## Migration Plan

Register the additional component without changing existing entries or dependencies. Roll back by removing its registry entry/import and newly added files.
