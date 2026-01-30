## ADDED Requirements

### Requirement: Tool Routing

The router SHALL forward tool calls to the correct backend server based on the tool name.

#### Scenario: Route namespaced tool
- **WHEN** `callTool("server1_myTool", args)` is called
- **THEN** router resolves "server1_myTool" to server "server1" and tool "myTool"
- **AND** forwards the call to server1's client

#### Scenario: Handle unknown tool
- **WHEN** `callTool("unknown_tool", args)` is called
- **THEN** router throws a "Tool not found" error

### Requirement: Execution Policies

The router SHALL enforce runtime policies on tool execution.

#### Scenario: Enforce timeout
- **WHEN** tool execution exceeds configured `defaultTimeout`
- **THEN** router cancels the request and throws a Timeout error

#### Scenario: Propagate errors
- **WHEN** backend server returns an error
- **THEN** router propagates the error to the caller
