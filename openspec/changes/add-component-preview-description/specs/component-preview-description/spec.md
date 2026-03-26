## ADDED Requirements

### Requirement: Support component-level rich-text descriptions
The service SHALL allow each component entry in `src/dcsConfig.ts` to define an optional rich-text `description` string.

#### Scenario: Component provides rich-text description
- **WHEN** a component registration entry includes HTML-rich description content
- **THEN** the service MUST preserve that content as component metadata without requiring component-specific preview code

#### Scenario: Component omits description
- **WHEN** a component registration entry does not include a `description`
- **THEN** the service MUST continue to load the component list and single preview page without rendering an empty description placeholder

### Requirement: Show the current component description on the single preview page
The single-component preview page MUST render the current component's rich-text description in a concise panel near the lower-left corner when description content exists.

#### Scenario: Render component description with links
- **WHEN** the current previewed component has a rich-text `description`
- **THEN** the preview page MUST display that content in a visually distinct panel and preserve clickable links inside the rendered HTML

#### Scenario: Hide description panel when absent
- **WHEN** the current previewed component has no `description`
- **THEN** the preview page MUST omit the description panel entirely instead of showing empty chrome

#### Scenario: Keep preview controls available
- **WHEN** the preview page shows the component description panel
- **THEN** the page MUST keep the existing tweakpane-based controls available for the same component

### Requirement: Keep component-specific notes with the relevant component
The system MUST allow component-specific notes to live with the component that they describe instead of remaining only in the global service description.

#### Scenario: Move ez-tree announcement to the advanced tree component
- **WHEN** the service registers the `ezTreeCom` component
- **THEN** the ez-tree announcement text MUST be stored on that component entry and be available on its single preview page
