## ADDED Requirements

### Requirement: Support declarative config-pane action buttons
The preview layer SHALL allow component registration metadata in `src/dcsConfig.ts` to declare action buttons through declarative action identifiers instead of inline runtime callbacks.

#### Scenario: Render an action button from config metadata
- **WHEN** a component config item declares an action-button control with a label and action identifier
- **THEN** the preview pane MUST render a clickable button for that item

#### Scenario: Keep exported config metadata externally readable
- **WHEN** a host imports the federated `./config` module after action-button support is added
- **THEN** the component metadata MUST remain declarative and inspectable without depending on runtime callback functions embedded in `dcsConfig`

### Requirement: Bridge action buttons to the current previewed component instance
The preview template MUST be able to resolve a declared action identifier to the current component instance's exposed method and merge the returned snapshot back into reactive preview state.

#### Scenario: Invoke exposed method and merge the returned snapshot
- **WHEN** the current previewed component exposes the method mapped for an action identifier and the user clicks the corresponding action button
- **THEN** the preview layer MUST call that exposed method and MUST apply any returned config text or prop patch back into the live preview state

#### Scenario: Missing exposed method does not break the pane
- **WHEN** an action identifier cannot be resolved to an exposed method on the current previewed component instance
- **THEN** the preview layer MUST fail gracefully without breaking the rest of the pane controls

#### Scenario: Existing control types remain compatible
- **WHEN** a component does not declare any action buttons
- **THEN** existing `Select`, `ColorPicker`, `Switch`, `Slider`, and `jsonText` controls MUST continue to behave as before
