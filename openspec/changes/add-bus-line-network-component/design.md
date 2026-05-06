## Design

The component loads GeoJSON client-side and converts each `LineString` or `MultiLineString` route into a `Line2` object from `three-stdlib`.

The rendering pipeline is intentionally simple:

- Fetch the configured GeoJSON URL with an abortable request; the default URL points to the local `public/data/bj-bus.json` copy.
- Normalize route coordinate arrays from GeoJSON features.
- Project `[lng, lat]` pairs with Web Mercator and subtract a local center.
- Apply a configurable `mapScale` so the whole Beijing network fits the preview camera by default.
- Assign each route to a height and color bucket, matching the Mars3D sample's layered green palette by default.
- Use `LineMaterial` with `worldUnits` for stable width in the Three scene.

This avoids generating heavy tube meshes for roughly 64,000 source points and keeps the logic readable.

## Configuration

The component exposes:

- Data: `dataUrl`, `dataUrlDraft`, `maxRoutes`, `pointSampleStep`.
- Projection: `autoCenter`, `centerLng`, `centerLat`, `mapScale`.
- Shape: `lineWidth`, `baseHeight`, `heightStep`, `heightGroups`.
- Style: `colorTheme`, `opacity`, `pulseSpeed`, `pulseIntensity`.

Defaults use the local Mars3D dataset copy, automatic bounds centering, full route count, and a light point sample step for preview performance. Hosts can edit `dataUrlDraft` and click the confirm action to apply a different URL; they can set `pointSampleStep` to `1` for full coordinate fidelity.

## Constraints

- The generic preview views remain unchanged.
- The component must dispose line geometries/materials when data or props change.
- Fetch errors must not break the scene; the component should clear its own lines and log a scoped warning.
