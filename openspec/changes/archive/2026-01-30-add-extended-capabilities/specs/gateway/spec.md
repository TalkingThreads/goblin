## ADDED Requirements

### Requirement: Prompts Aggregation

The system SHALL aggregate prompts from all connected backend servers.

#### Scenario: List prompts
- **WHEN** client requests `prompts/list`
- **THEN** server returns all prompts from the registry, namespaced by server ID (e.g. `server1_promptName`)

#### Scenario: Get prompt
- **WHEN** client requests `prompts/get` with a namespaced name
- **THEN** server resolves the backend, forwards the request, and returns the prompt content

### Requirement: Resources Aggregation

The system SHALL aggregate resources from all connected backend servers.

#### Scenario: List resources
- **WHEN** client requests `resources/list`
- **THEN** server returns all resources from the registry

#### Scenario: List resource templates
- **WHEN** client requests `resources/templates/list`
- **THEN** server returns all resource templates from the registry

#### Scenario: Read resource
- **WHEN** client requests `resources/read` with a URI
- **THEN** server identifies the owning backend (via URI prefix or registry lookup) and forwards the read request

### Requirement: Capability Advertisement

The system SHALL advertise support for prompts and resources.

#### Scenario: Advertise capabilities
- **WHEN** server initializes
- **THEN** it includes `prompts` and `resources` in the capabilities object
