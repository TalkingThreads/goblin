# gateway Specification

## Purpose
TBD - created by archiving change add-registry. Update Purpose after archive.
## Requirements
### Requirement: Server Management

The registry SHALL manage the lifecycle of tool synchronization for connected servers.

#### Scenario: Add server
- **WHEN** `addServer(serverId, client)` is called
- **THEN** registry fetches all tools from the client (handling pagination) and stores them indexed by server ID

#### Scenario: Remove server
- **WHEN** `removeServer(serverId)` is called
- **THEN** registry removes all tools associated with that server

### Requirement: Tool Storage

The registry SHALL store tool definitions and support aliasing.

#### Scenario: Store full schema
- **WHEN** tools are fetched from backend
- **THEN** full JSON schema is stored for validation and routing

#### Scenario: Namespace tools
- **WHEN** storing tools
- **THEN** tools are internally namespaced by server ID (e.g. `serverId:toolName`) to prevent collisions

### Requirement: Tool Discovery

The registry SHALL provide methods to list tools in different formats.

#### Scenario: List compact cards
- **WHEN** `listTools(compact=true)` is called
- **THEN** return lightweight objects with only name, description, and server ID

#### Scenario: Get full schema
- **WHEN** `getTool(name)` is called
- **THEN** return the complete tool definition including input schema

### Requirement: Event Notification

The registry SHALL emit events when the tool catalog changes.

#### Scenario: Emit change event
- **WHEN** tools are added or removed
- **THEN** registry emits `tool-changed` event with the diff or full list

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

