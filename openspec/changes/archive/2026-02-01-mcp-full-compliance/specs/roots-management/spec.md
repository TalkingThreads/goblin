## ADDED Requirements

### Requirement: Roots capability advertisement
The Gateway SHALL advertise the `roots` capability to clients when roots support is enabled.

#### Scenario: Client receives roots capability
- **WHEN** a client establishes a connection to the Gateway
- **THEN** the server capabilities include `roots: { listChanged: true }`

### Requirement: Gateway handles roots list requests from clients
The Gateway SHALL accept `roots/list` requests from clients and return the aggregated roots.

#### Scenario: Client requests roots list
- **WHEN** a client sends `roots/list` request
- **THEN** the Gateway SHALL return all roots configured or advertised by the client
- **AND** the response SHALL include root URIs and capabilities

### Requirement: Gateway propagates roots to backend servers
The Gateway SHALL forward client roots to backend servers that support roots.

#### Scenario: Backend server receives roots
- **WHEN** a client provides roots and connects to the Gateway
- **AND** a backend server that supports roots connects
- **THEN** the Gateway SHALL send the client's roots to that backend server
- **AND** the backend server SHALL receive `roots/list` notification

### Requirement: Client roots update handling
The Gateway SHALL handle `roots/list_changed` notifications from clients and update backend servers.

#### Scenario: Client roots change notification
- **WHEN** a client sends `roots/list_changed` notification
- **THEN** the Gateway SHALL update its internal roots tracking
- **AND** the Gateway SHALL forward the notification to all connected backend servers

### Requirement: Roots capability matching
The Gateway SHALL match roots capabilities between clients and backend servers.

#### Scenario: Roots with file pattern capabilities
- **WHEN** a client provides roots with file pattern capabilities
- **THEN** the Gateway SHALL forward the capabilities to backend servers
- **AND** backend servers SHALL respect the allowed file patterns

### Requirement: Roots cleanup on disconnect
The Gateway SHALL clean up roots tracking when a client disconnects.

#### Scenario: Client disconnect with roots
- **WHEN** a client connection is closed
- **THEN** the Gateway SHALL remove that client's roots from tracking
- **AND** the Gateway SHALL update connected backend servers if necessary

### Requirement: Root URI validation
The Gateway SHALL validate root URIs to prevent path traversal attacks.

#### Scenario: Invalid root URI format
- **WHEN** a client provides a root URI with an invalid format
- **THEN** the Gateway SHALL reject the root with an error
- **AND** SHALL NOT forward invalid roots to backend servers

#### Scenario: Path traversal attempt in root
- **WHEN** a client provides a root URI that attempts path traversal
- **THEN** the Gateway SHALL reject the root with an error
- **AND** log the security event for audit
