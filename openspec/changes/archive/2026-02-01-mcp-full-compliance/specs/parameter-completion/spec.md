# Parameter Completion Specification

This specification defines the parameter completion capability for the Goblin MCP Gateway, enabling argument completion for tools and resources via `completion/complete`.

## ADDED Requirements

### Requirement: Completion capability advertisement
The Gateway SHALL advertise the `completion` capability to clients when completion support is available.

#### Scenario: Client receives completion capability
- **WHEN** a client establishes a connection to the Gateway
- **THEN** the server capabilities include `completion: { supported: true }`

### Requirement: Gateway handles tool completion requests
The Gateway SHALL accept `completion/complete` requests for tool arguments and collect completions from backend servers.

#### Scenario: Tool completion request for single backend
- **WHEN** a client sends `completion/complete` for a tool argument
- **AND** the tool belongs to a specific backend server
- **THEN** the Gateway SHALL forward the request to that backend server
- **AND** return the completions from the backend

#### Scenario: Tool completion with partial matches
- **WHEN** a client sends `completion/complete` with partial argument value
- **THEN** the Gateway SHALL forward the partial value to the backend
- **AND** return matching completions

### Requirement: Gateway aggregates completion results
The Gateway SHALL support aggregating completions from multiple backend servers.

#### Scenario: Completion request to all servers
- **WHEN** a client sends `completion/complete` without specifying a tool source
- **THEN** the Gateway SHALL send the request to all backend servers
- **AND** the Gateway SHALL deduplicate completion results
- **AND** return unique completions to the client

#### Scenario: Completion result deduplication
- **WHEN** multiple backend servers return the same completion value
- **THEN** the Gateway SHALL include the value only once in the response
- **AND** the completion response SHALL indicate the total completion count

### Requirement: Resource URI completion
The Gateway SHALL support completion for resource URIs.

#### Scenario: Resource completion request
- **WHEN** a client sends `completion/complete` for a resource URI
- **THEN** the Gateway SHALL collect resource URIs from all backend servers
- **AND** return matching completions

#### Scenario: Partial resource URI completion
- **WHEN** a client sends `completion/complete` with partial resource URI prefix
- **THEN** the Gateway SHALL filter resources by the prefix
- **AND** return matching resource URIs

### Requirement: Completion context preservation
The Gateway SHALL preserve completion request context.

#### Scenario: Completion request with full context
- **WHEN** a client sends `completion/complete` with refToken, argument, and context
- **THEN** the Gateway SHALL forward all context to the backend servers
- **AND** return completions with appropriate completion markers

### Requirement: Empty completion handling
The Gateway SHALL handle cases where no completions are available.

#### Scenario: No completions available
- **WHEN** no backend server can provide completions for a request
- **THEN** the Gateway SHALL return an empty completion response
- **AND** the response SHALL indicate completion is supported but no matches found
