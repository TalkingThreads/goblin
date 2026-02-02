# MCP Handshake Integration Tests

## ADDED Requirements

### Requirement: Full MCP handshake completion
The system SHALL validate complete MCP handshake including initialize request/response, capability negotiation, and result notification.

#### Scenario: Client successfully initializes with gateway
- **WHEN** a client sends initialize request with protocol version
- **THEN** the gateway SHALL respond with server info and capabilities
- **AND** the client SHALL complete handshake with result notification
- **AND** session SHALL be established for further requests

#### Scenario: Handshake with capability negotiation
- **WHEN** client sends initialize with supported capabilities
- **THEN** gateway SHALL merge capabilities from all backends
- **AND** negotiated capabilities SHALL be returned to client
- **AND** client capabilities SHALL be propagated to backends

#### Scenario: Handshake with version mismatch handling
- **WHEN** client requests unsupported protocol version
- **THEN** gateway SHALL return error with supported versions
- **AND** connection SHALL be closed gracefully
- **AND** error message SHALL be descriptive

### Requirement: Server info advertisement
The system SHALL validate proper server info advertisement during handshake.

#### Scenario: Gateway advertises correct server info
- **WHEN** handshake completes successfully
- **THEN** server info SHALL include Goblin version
- **AND** server info SHALL include MCP protocol version
- **AND** capabilities SHALL reflect enabled features

#### Scenario: Backend server info aggregation
- **WHEN** multiple backends are connected
- **THEN** gateway SHALL aggregate server info from backends
- **AND** combined capabilities SHALL be advertised
- **AND** individual backend info SHALL be accessible

### Requirement: Session lifecycle management
The system SHALL validate session lifecycle during handshake and disconnect.

#### Scenario: Session created on successful handshake
- **WHEN** handshake completes successfully
- **THEN** session SHALL be created with unique ID
- **AND** session SHALL track connected client
- **AND** session SHALL track connected backends

#### Scenario: Session cleanup on disconnect
- **WHEN** client disconnects unexpectedly
- **THEN** session SHALL be cleaned up
- **AND** all pending requests SHALL be cancelled
- **AND** resources SHALL be released

#### Scenario: Reconnection with existing session
- **WHEN** client reconnects with previous session ID
- **THEN** gateway SHALL validate session
- **AND** if valid, session SHALL be resumed
- **AND** if expired, new session SHALL be created

### Requirement: Capability advertisement validation
The system SHALL validate correct capability advertisement based on configuration.

#### Scenario: Gateway advertises enabled capabilities only
- **WHEN** handshake completes
- **THEN** advertised capabilities SHALL match configuration
- **AND** disabled features SHALL NOT be advertised
- **AND** experimental features SHALL be marked appropriately

#### Scenario: Dynamic capability updates
- **WHEN** backend connects/disconnects
- **THEN** gateway capabilities SHALL be updated
- **AND** listChanged notifications SHALL be sent to clients
- **AND** clients SHALL see updated capabilities
