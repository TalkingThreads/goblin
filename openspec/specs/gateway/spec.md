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

### Requirement: MCP Server Interface

The system SHALL provide an MCP server interface that adheres to the Model Context Protocol.

#### Scenario: Initialize server
- **WHEN** server is created
- **THEN** it advertises capabilities including `tools`

#### Scenario: Connect transport
- **WHEN** a transport connects
- **THEN** server performs initialization handshake

### Requirement: Dynamic Tool Listing

The server SHALL return the current list of tools from the registry.

#### Scenario: List tools
- **WHEN** client requests `tools/list`
- **THEN** server queries the registry and returns all available tools as a unified list

#### Scenario: Tool updates
- **WHEN** registry emits a change event
- **THEN** server sends a notification to connected clients (if supported)

### Requirement: Request Routing

The server SHALL route tool execution requests to the appropriate backend.

#### Scenario: Call tool
- **WHEN** client requests `tools/call`
- **THEN** server forwards the request to the router
- **AND** returns the result from the router

### Requirement: HTTP Endpoints

The system SHALL expose HTTP endpoints for MCP communication.

#### Scenario: SSE Connection
- **WHEN** client GETs `/sse`
- **THEN** server establishes an SSE stream
- **AND** sends an `endpoint` event pointing to `/messages?sessionId={uuid}`

#### Scenario: Message Handling
- **WHEN** client POSTs to `/messages`
- **THEN** server routes the message to the corresponding session's transport

### Requirement: Session Management

The system SHALL manage lifecycle of client sessions.

#### Scenario: Create session
- **WHEN** new SSE connection is established
- **THEN** create new `GatewayServer` instance and connect transport

#### Scenario: Destroy session
- **WHEN** SSE connection is closed/aborted
- **THEN** close `GatewayServer` and cleanup resources

### Requirement: Hono Integration

The system SHALL use Hono as the web server framework.

#### Scenario: Bind to port
- **WHEN** gateway starts
- **THEN** Hono listens on configured port and host

