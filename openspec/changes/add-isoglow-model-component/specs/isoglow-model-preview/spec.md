## ADDED Requirements

### Requirement: Register through the existing dynamic component protocol
The component SHALL be registered in dcsConfig with defaults, all eleven controls and a description; its preview MUST reuse the existing copy-current-parameters action.

#### Scenario: Select a preset in the panel
- **WHEN** the IsoGlowModel style preset changes in the parameter panel
- **THEN** the component MUST switch rendering behavior internally while preserving the current color, opacity and emissive parameter values
- **AND** the existing default/config protocol and copy action MUST remain in use without a new preset-binding schema

### Requirement: Reuse the shared preview
The component SHALL use the existing shared preview page through dcsConfig registration. previewEntry.vue, templateComponet.vue and createConfigPane.ts MUST remain unchanged, without a dedicated page, component-specific branch or new event forwarding.

#### Scenario: Preview IsoGlowModel
- **WHEN** the IsoGlowModel preview route is opened
- **THEN** the existing shared page MUST provide its usual TresCanvas, camera, background, scene lights and OrbitControls
- **AND** model styling MUST remain inside the reusable component while scene infrastructure remains outside it

#### Scenario: Preview an existing component
- **WHEN** another component is previewed
- **THEN** the existing preview page MUST continue using its original perspective camera, background, lights and helper defaults

### Requirement: Preserve existing host integration
The component SHALL work through existing remote loading and props without requiring loadDynamicComponent, zone3Deditor or gisPlaneEditor to change their caller protocol. Camera framing SHALL remain the existing host scene's responsibility.

#### Scenario: Mount in a current remote host
- **WHEN** a current host loads the component and supplies modelUrl and ordinary style props
- **THEN** the component MUST load and style the model without a preview adapter or mandatory event listeners
- **AND** it MUST preserve host camera settings and original model transforms

### Requirement: Show actionable loading errors
The component SHALL present readable model load errors using its own lifecycle and existing Cientos Html, without requiring preview or host event handling.

#### Scenario: CORS or external texture failure
- **WHEN** the GLB or one of its required external resources fails to load
- **THEN** the component MUST display the reported resource/error and explain checking server CORS response headers or using an authorized same-origin proxy
- **AND** it MUST NOT claim that a frontend request header can bypass CORS

#### Scenario: Replace a failed URL or unmount the component
- **WHEN** a new model URL begins loading or the component unmounts
- **THEN** the previous error message MUST be cleared or removed without host cleanup code
