# Tool Discovery Tests

## ADDED Requirements

### Requirement: Tool listing from connected backend
The gateway SHALL list tools from connected backend servers.

#### Scenario: Tools listed from single backend
- **WHEN** single backend with tools is connected
- **AND** client sends listTools request
- **THEN** all tools from that backend SHALL be returned
- **AND** tool count SHALL match backend tool count

#### Scenario: Tools listed from multiple backends
- **WHEN** multiple backends are connected
- **AND** client sends listTools request
- **THEN** tools from all backends SHALL be returned
- **AND** tool names SHALL be unique across backends
- **AND** duplicate tool names SHALL be namespaced

#### Scenario: Tool listing is fast
- **WHEN** client sends listTools request
- **THEN** response time SHALL be under 500ms
- **AND** operation SHALL not block on other requests

#### Scenario: Tool listing includes metadata
- **WHEN** client sends listTools request
- **THEN** each tool SHALL include name
- **AND** each tool SHALL include description
- **AND** each tool SHALL include input schema

### Requirement: Tool discovery with filters
The gateway SHALL support filtering tool listings.

#### Scenario: Filter tools by prefix
- **WHEN** client requests tools with name prefix filter
- **THEN** only tools matching prefix SHALL be returned
- **AND** other tools SHALL not be included

#### Scenario: Filter tools by backend
- **WHEN** client requests tools from specific backend
- **THEN** only tools from that backend SHALL be returned
- **AND** tools from other backends SHALL not be included

#### Scenario: Empty filter returns all tools
- **WHEN** client requests tools with empty filter
- **THEN** all tools SHALL be returned
- **AND** behavior SHALL match unfiltered request

### Requirement: Tool invocation through gateway
The gateway SHALL route tool invocations to correct backends.

#### Scenario: Tool invoked on correct backend
- **WHEN** client invokes a tool
- **THEN** request SHALL be routed to owning backend
- **AND** tool SHALL execute on backend
- **AND** result SHALL be returned to client

#### Scenario: Tool invocation with arguments
- **WHEN** client invokes tool with arguments
- **THEN** arguments SHALL be forwarded to backend
- **AND** argument types SHALL be preserved
- **AND** result SHALL reflect tool execution

#### Scenario: Tool invocation result format
- **WHEN** client invokes tool successfully
- **THEN** result SHALL include content
- **AND** result format SHALL match MCP specification
- **AND** result SHALL include isError flag if applicable

### Requirement: Tool discovery after backend connection
The gateway SHALL update tool list when backends connect/disconnect.

#### Scenario: New tools appear after backend connects
- **WHEN** backend connects with new tools
- **AND** client sends listTools request
- **THEN** new tools SHALL be included
- **AND** listChanged notification SHALL be sent

#### Scenario: Tools removed after backend disconnects
- **WHEN** backend disconnects
- **AND** client sends listTools request
- **THEN** removed tools SHALL not be included
- **AND** listChanged notification SHALL be sent

#### Scenario: Tool list updates are consistent
- **WHEN** multiple backends connect/disconnect rapidly
- **AND** client sends listTools request
- **THEN** tool list SHALL be consistent
- **AND** no duplicate tools SHALL appear
- **AND** no missing tools SHALL occur

### Requirement: Tool schema validation
The gateway SHALL validate tool schemas during discovery.

#### Scenario: Valid tool schemas accepted
- **WHEN** backend registers tool with valid schema
- **THEN** tool SHALL be available for invocation
- **AND** schema SHALL be stored correctly

#### Scenario: Invalid tool schema rejected
- **WHEN** backend registers tool with invalid schema
- **THEN** error SHALL be logged
- **AND** tool SHALL not be registered
- **AND** backend connection SHALL continue

#### Scenario: Tool schema includes all required fields
- **WHEN** client receives tool list
- **THEN** each tool SHALL have name
- **AND** each tool SHALL have description
- **AND** each tool SHALL have inputSchema
- **AND** each tool MAY have outputSchema

### Requirement: Tool availability status
The gateway SHALL report tool availability accurately.

#### Scenario: Tool marked as available when backend connected
- **WHEN** backend is connected and tool is registered
- **THEN** tool status SHALL be available

#### Scenario: Tool marked as unavailable when backend disconnected
- **WHEN** backend disconnects
- **AND** client requests tool from that backend
- **THEN** tool status SHALL be unavailable
- **AND** appropriate error SHALL be returned

#### Scenario: Tool availability updates in real-time
- **WHEN** backend connection state changes
- **THEN** tool availability SHALL update immediately
- **AND** subsequent requests SHALL reflect current state
