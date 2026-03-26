## ADDED Requirements

### Requirement: ezTreeCom MUST expose additive runtime config methods
The `ezTreeCom` component MUST expose additive public instance methods that allow callers to read the latest config snapshot, apply a new config snapshot, and request a randomized tree configuration after the component has mounted.

#### Scenario: Read the latest config from a component ref
- **WHEN** a consumer obtains the `ezTreeCom` instance through a Vue ref in preview or federated usage
- **THEN** the consumer MUST be able to retrieve the latest applied tree configuration from that component instance

#### Scenario: Apply config through a public method
- **WHEN** a consumer applies a new config object or accepted text payload through the component's public API
- **THEN** the component MUST update its runtime tree options and MUST regenerate the tree from that configuration

#### Scenario: Randomize through a public method
- **WHEN** a consumer triggers the component's public randomization method
- **THEN** the component MUST produce a new tree configuration, regenerate the tree, and make the new snapshot available for immediate readback

### Requirement: Keep config text, runtime options, and generated tree state synchronized
The component MUST keep `jsonText`, runtime tree options, and generated geometry aligned across manual text apply, preview action-button calls, and public method calls.

#### Scenario: Apply text that passed editor validation
- **WHEN** the preview editor accepts a tree config text payload
- **THEN** `ezTreeCom` MUST accept the same syntax on apply and MUST regenerate the tree from that payload instead of failing later in the component

#### Scenario: Randomization updates the latest text snapshot
- **WHEN** preview or external code changes the tree through randomization or a public apply method
- **THEN** the component's latest config text snapshot and any preview-bound `jsonText` state MUST update to the same applied configuration

#### Scenario: Preserve upstream TreeOptions behavior across repeated updates
- **WHEN** `ezTreeCom` applies new configuration data repeatedly over time
- **THEN** it MUST keep the upstream `TreeOptions`-based flow intact rather than replacing the options container with an incompatible plain object

### Requirement: Preserve existing prop-based compatibility for published consumers
The existing prop-driven usage of `isUpdate`, `jsonText`, and `jsonTextChangeNumber` MUST continue to work after public methods are added.

#### Scenario: Legacy consumer only uses props
- **WHEN** a consumer continues driving `ezTreeCom` only through props without calling any new public methods
- **THEN** the component MUST still load, update, and animate as it did before this change
