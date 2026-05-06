## ADDED Requirements

### Requirement: Render a Beijing bus line network

The system SHALL provide `busLineNetworkComponent` that loads the local Mars3D Beijing bus GeoJSON dataset copy and renders the routes as a three-dimensional line network.

#### Scenario: Default render

- **GIVEN** the component is rendered with default props
- **WHEN** the local GeoJSON request succeeds
- **THEN** the scene SHALL display elevated bus route lines using the configured color theme and line width

#### Scenario: Data load failure

- **GIVEN** the configured `dataUrl` cannot be fetched or parsed
- **WHEN** the component handles the error
- **THEN** it SHALL clear its own route lines and log a scoped warning without throwing into the host scene

### Requirement: Convert GeoJSON coordinates to local Three coordinates

The component SHALL convert longitude/latitude pairs to local Three.js coordinates before rendering.

#### Scenario: Automatic center

- **GIVEN** `autoCenter` is true
- **WHEN** GeoJSON data is loaded
- **THEN** the component SHALL center the rendered network from the loaded coordinate bounds

#### Scenario: Manual center

- **GIVEN** `autoCenter` is false
- **WHEN** `centerLng` or `centerLat` changes
- **THEN** the component SHALL rebuild route geometry around the provided center

### Requirement: Config service integration

The component SHALL be registered in `src/dcsConfig.ts` with defaults and configuration controls.

#### Scenario: Component appears in service list

- **GIVEN** the dynamic component service reads `src/dcsConfig.ts`
- **WHEN** the component list is built
- **THEN** `busLineNetworkComponent` SHALL be available with preview metadata

#### Scenario: Apply URL from config panel

- **GIVEN** a user edits the data source URL text field
- **WHEN** the user clicks the confirm action
- **THEN** the component SHALL apply the edited URL to `dataUrl` and reload route data

#### Scenario: Runtime config updates

- **GIVEN** a user changes sampling, scale, height, width, color theme, opacity, or pulse controls
- **WHEN** props update
- **THEN** the component SHALL rebuild geometry only when needed and update material style in place otherwise
