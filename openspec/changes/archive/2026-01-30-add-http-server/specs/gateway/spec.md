## ADDED Requirements

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
